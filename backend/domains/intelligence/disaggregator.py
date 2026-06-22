"""
DemandDisaggregator — Top-Down Disaggregation.
Pecah prediksi family-level menjadi per produk individual
berdasarkan proporsi penjualan POS terakhir 30 hari.
"""
import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import func, select
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any, Optional
from uuid import UUID

from domains.sales.models import Transaction, TransactionItem
from domains.inventory.models import Product


class DemandDisaggregator:
    def __init__(self, db_session: Session):
        self.db = db_session
        self.lookback_days = 30  # Jendela waktu untuk menghitung proporsi

    def _get_products_by_family(self, family: str, store_nbr: Optional[int] = None) -> List[dict]:
        """Ambil semua produk aktif dalam 1 family."""
        query = self.db.query(
            Product.id, Product.sku, Product.name, Product.family
        ).filter(
            Product.family == family,
            Product.is_active == True
        )
        
        return [
            {"id": str(row.id), "sku": row.sku, "name": row.name, "family": row.family}
            for row in query.all()
        ]

    def calculate_product_proportions(self, family: str, store_nbr: int) -> Dict[str, float]:
        """
        Hitung share per produk dari data transaksi POS terakhir 30 hari.
        
        Output: {"product_id_1": 0.30, "product_id_2": 0.45, "product_id_3": 0.25}
        Total semua proporsi = 1.0
        """
        cutoff_date = (datetime.now(timezone.utc) - timedelta(days=self.lookback_days)).date()
        
        # Query: SUM(quantity) per product_id WHERE product.family = X AND last 30 days
        query = (
            self.db.query(
                TransactionItem.product_id,
                func.sum(TransactionItem.quantity).label('total_qty')
            )
            .join(Transaction, TransactionItem.transaction_id == Transaction.id)
            .join(Product, TransactionItem.product_id == Product.id)
            .filter(
                Product.family == family,
                Transaction.date >= cutoff_date,
            )
        )
        
        # Filter per store jika ada branch mapping
        # (Saat ini Transaction.branch_id belum di-map ke store_nbr, skip filter store)
        
        query = query.group_by(TransactionItem.product_id)
        results = query.all()
        
        if not results:
            # Fallback: distribusi merata ke semua produk dalam family
            return self._equal_distribution(family)
        
        total_qty = sum(row.total_qty for row in results)
        if total_qty <= 0:
            return self._equal_distribution(family)
        
        proportions = {}
        for row in results:
            proportions[str(row.product_id)] = row.total_qty / total_qty
        
        # Tambahkan produk yang belum punya data POS (0% tapi tetap ada)
        all_products = self._get_products_by_family(family)
        for p in all_products:
            if p["id"] not in proportions:
                proportions[p["id"]] = 0.0
        
        # Renormalize jika ada produk baru
        total = sum(proportions.values())
        if total > 0 and abs(total - 1.0) > 0.001:
            proportions = {k: v / total for k, v in proportions.items()}
        
        return proportions

    def _equal_distribution(self, family: str) -> Dict[str, float]:
        """Fallback: bagi rata ke semua produk aktif dalam family."""
        products = self._get_products_by_family(family)
        if not products:
            return {}
        
        share = 1.0 / len(products)
        return {p["id"]: share for p in products}

    def disaggregate(self, family_predictions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Distribusikan prediksi family-level ke produk individual.
        
        Input:  [{"family": "GROCERY I", "store_nbr": 1, "predicted_value": 500, "horizon_days": 7, ...}]
        Output: [{"product_id": "uuid", "predicted_value": 150, "prediction_level": "product", ...}, ...]
        
        Conservation: sum(product predictions) == family prediction
        """
        product_predictions = []
        
        # Cache proporsi per (family, store_nbr) untuk efisiensi
        proportion_cache: Dict[str, Dict[str, float]] = {}
        
        for fp in family_predictions:
            family = fp.get("family")
            store_nbr = fp.get("store_nbr")
            
            if not family:
                continue
            
            cache_key = f"{family}_{store_nbr}"
            if cache_key not in proportion_cache:
                proportion_cache[cache_key] = self.calculate_product_proportions(family, store_nbr)
            
            proportions = proportion_cache[cache_key]
            
            if not proportions:
                continue
            
            family_demand = fp.get("predicted_value", 0.0)
            family_recommended = fp.get("recommended_stock", 0)
            
            for product_id, share in proportions.items():
                if share <= 0:
                    continue
                
                item_demand = family_demand * share
                item_recommended = int(round(family_recommended * share))
                
                product_pred = {
                    "store_nbr": store_nbr,
                    "family": family,
                    "product_id": product_id,
                    "predicted_for_date": fp.get("predicted_for_date"),
                    "prediction_type": "stock_demand",
                    "predicted_value": round(item_demand, 2),
                    "recommended_stock": item_recommended,
                    "safety_stock_buffer": fp.get("safety_stock_buffer"),
                    "safety_stock_source": fp.get("safety_stock_source"),
                    "reasoning_text": self._generate_item_story(
                        fp, product_id, share, item_demand, item_recommended
                    ),
                    "model_version": fp.get("model_version"),
                    "horizon_days": fp.get("horizon_days"),
                    "prediction_level": "product",
                }
                product_predictions.append(product_pred)
        
        print(f"[Disaggregator] {len(product_predictions)} prediksi per-item dari {len(family_predictions)} prediksi family.")
        return product_predictions

    def _generate_item_story(self, family_pred: dict, product_id: str, share: float, 
                              item_demand: float, item_recommended: int) -> str:
        """Generate narasi XAI per produk."""
        horizon = family_pred.get("horizon_days", 7)
        family = family_pred.get("family", "")
        family_demand = family_pred.get("predicted_value", 0)
        pct = share * 100
        
        return (
            f"Disaggregasi dari family '{family}' (demand harian: {family_demand:.1f}). "
            f"Produk ini mencakup {pct:.0f}% dari total kategori. "
            f"Prediksi demand harian ({horizon}d): {item_demand:.1f} qty. "
            f"Rekomendasi stok: {item_recommended} qty."
        )
