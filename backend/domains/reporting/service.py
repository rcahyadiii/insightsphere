"""
Domain Reporting — Service layer (CSV/Excel generators).

Setiap generator return tuple `(BytesIO buffer, row_count)`.
Buffer di-stream langsung ke client via StreamingResponse di router.

Catatan arsitektur:
- Tidak persist file ke disk. Untuk MVP cukup streaming inline.
- Bila volume besar (>100k row), pertimbangkan switch ke chunked iterator
  + Celery background job + S3 storage.
"""
from __future__ import annotations

import csv
import io
import logging
from datetime import date, datetime, timedelta, timezone
from typing import List, Optional, Tuple
from uuid import UUID as UUIDType

import pandas as pd
from sqlalchemy import func
from sqlalchemy.orm import Session

from domains.dataset.models import Store
from domains.finance.models import PettyCashTransaction, CashSession
from domains.intelligence.models import AIPredictionLog
from domains.inventory.models import Inventory, Product, StockMovement
from domains.inventory.service import get_stock_summary
from domains.reporting.models import (
    ExportFormat, ExportPeriod, ExportType, ReportExport,
)
from domains.reporting.schemas import ReportingDashboardStatsResponse
from domains.sales.models import Transaction, TransactionItem
from domains.sales.service import get_transaction_summary

logger = logging.getLogger(__name__)


# ============================================================
# Helpers
# ============================================================

def _resolve_period(period: ExportPeriod) -> Tuple[date, date]:
    """Hitung (start_date, end_date) inklusif relatif terhadap hari ini (UTC)."""
    today = datetime.now(timezone.utc).date()
    if period == ExportPeriod.WEEK:
        start = today - timedelta(days=7)
    elif period == ExportPeriod.MONTH:
        start = today - timedelta(days=30)
    elif period == ExportPeriod.QUARTER:
        start = today - timedelta(days=90)
    elif period == ExportPeriod.YEAR:
        start = today - timedelta(days=365)
    else:  # safety fallback
        start = today - timedelta(days=30)
    return start, today


def _dataframe_to_buffer(df: pd.DataFrame, fmt: ExportFormat) -> io.BytesIO:
    """Encode DataFrame ke BytesIO sesuai format yg diminta."""
    buf = io.BytesIO()
    if fmt == ExportFormat.CSV:
        # Encode ke UTF-8 dengan BOM agar Excel di Windows tampil bener.
        text = df.to_csv(index=False)
        buf.write(b"\xef\xbb\xbf" + text.encode("utf-8"))
    elif fmt == ExportFormat.XLSX:
        with pd.ExcelWriter(buf, engine="openpyxl") as writer:
            df.to_excel(writer, index=False, sheet_name="Report")
    else:
        raise ValueError(f"Unsupported format: {fmt}")
    buf.seek(0)
    return buf


def media_type_for(fmt: ExportFormat) -> str:
    """Mime type untuk Content-Type header."""
    return {
        ExportFormat.CSV: "text/csv; charset=utf-8",
        ExportFormat.XLSX: (
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ),
    }[fmt]


def file_extension_for(fmt: ExportFormat) -> str:
    return {ExportFormat.CSV: "csv", ExportFormat.XLSX: "xlsx"}[fmt]


# ============================================================
# TEMPLATES — metadata utk dropdown frontend
# ============================================================

TEMPLATES = [
    {
        "export_type": ExportType.SALES,
        "label": "Laporan Penjualan",
        "description": "Detail transaksi POS per item dalam rentang waktu tertentu.",
        "columns": [
            "transaction_id", "date", "time", "branch_id", "payment_method",
            "product_sku", "product_name", "quantity", "unit_price", "subtotal",
        ],
    },
    {
        "export_type": ExportType.PREDICTION,
        "label": "Laporan Prediksi Stok",
        "description": "Hasil forecast ML beserta nilai aktual & rekomendasi restock.",
        "columns": [
            "predicted_for_date", "store_nbr", "family", "horizon_days",
            "predicted_value", "actual_value", "recommended_stock",
            "model_version", "reasoning",
        ],
    },
    {
        "export_type": ExportType.PROFIT_LOSS,
        "label": "Laporan Laba Rugi",
        "description": "Ringkasan pendapatan vs pengeluaran (petty cash) per hari.",
        "columns": ["date", "revenue", "expenses", "net_profit"],
    },
    {
        "export_type": ExportType.WASTAGE,
        "label": "Laporan Wastage / Stok Rusak",
        "description": "Pergerakan stok bertipe WASTE (kadaluarsa, rusak, hilang).",
        "columns": [
            "date", "store_nbr", "product_sku", "product_name",
            "quantity", "reason", "performed_by",
        ],
    },
]


# ============================================================
# Service class
# ============================================================

class ReportingService:
    def __init__(self, db: Session):
        self.db = db

    # ---------- Templates ----------

    @staticmethod
    def list_templates() -> List[dict]:
        return TEMPLATES

    def get_dashboard_stats(
        self,
        period: str = "month",
        store_nbr: Optional[int] = None,
    ) -> ReportingDashboardStatsResponse:
        export_period = _coerce_period(period)
        start, end = _resolve_period(export_period)
        stock = get_stock_summary(self.db, store_nbr=store_nbr)
        sales = get_transaction_summary(
            self.db,
            date_from=start,
            date_to=end,
            group_by="day",
            store_nbr=store_nbr,
        )
        average_order_value = (
            sales.total_revenue / sales.total_transactions
            if sales.total_transactions
            else 0
        )

        return ReportingDashboardStatsResponse(
            revenue=sales.total_revenue,
            transactions=sales.total_transactions,
            average_order_value=round(average_order_value, 2),
            gross_margin=self._calculate_gross_margin(start, end, store_nbr),
            inventory_value=stock.total_inventory_value,
            low_stock_count=stock.low + stock.critical + stock.out_of_stock,
        )

    # ---------- History (audit) ----------

    def list_export_history(
        self,
        requested_by: Optional[UUIDType] = None,
        limit: int = 50,
    ) -> List[ReportExport]:
        q = self.db.query(ReportExport)
        if requested_by is not None:
            q = q.filter(ReportExport.requested_by == requested_by)
        return q.order_by(ReportExport.created_at.desc()).limit(limit).all()

    # ---------- Main entry ----------

    def generate_export(
        self,
        export_type: ExportType,
        period: ExportPeriod,
        export_format: ExportFormat,
        requested_by: UUIDType,
        store_nbr: Optional[int] = None,
    ) -> Tuple[io.BytesIO, str, int]:
        """
        Dispatch ke generator yg sesuai, hasilkan buffer + filename + row_count.
        Audit row di-insert sebelum return.
        """
        start, end = _resolve_period(period)
        logger.info(
            "Export request type=%s period=%s (%s..%s) store=%s by=%s",
            export_type, period, start, end, store_nbr, requested_by,
        )

        if export_type == ExportType.SALES:
            df = self._build_sales_df(start, end, store_nbr)
        elif export_type == ExportType.PREDICTION:
            df = self._build_prediction_df(start, end, store_nbr)
        elif export_type == ExportType.PROFIT_LOSS:
            df = self._build_profit_loss_df(start, end, store_nbr)
        elif export_type == ExportType.WASTAGE:
            df = self._build_wastage_df(start, end, store_nbr)
        else:
            raise ValueError(f"Unknown export type: {export_type}")

        row_count = len(df)
        buf = _dataframe_to_buffer(df, export_format)

        ext = file_extension_for(export_format)
        ts = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
        filename = f"{export_type.value.lower()}_{period.value}_{ts}.{ext}"

        # Audit log (best-effort, jangan jatuhkan response kalau gagal)
        try:
            audit = ReportExport(
                requested_by=requested_by,
                export_type=export_type,
                export_format=export_format,
                period=period,
                store_nbr=store_nbr,
                row_count=row_count,
                filename=filename,
            )
            self.db.add(audit)
            self.db.commit()
        except Exception as exc:
            self.db.rollback()
            logger.error("Failed to write export audit row: %s", exc)

        return buf, filename, row_count

    # ============================================================
    # Generators (per export type) — pure SQL → DataFrame
    # ============================================================

    def _build_sales_df(
        self, start: date, end: date, store_nbr: Optional[int]
    ) -> pd.DataFrame:
        """SALES: transaksi POS per item."""
        q = (
            self.db.query(
                Transaction.id.label("transaction_id"),
                Transaction.date.label("date"),
                Transaction.time.label("time"),
                Transaction.branch_id.label("branch_id"),
                Transaction.payment_method.label("payment_method"),
                Product.sku.label("product_sku"),
                Product.name.label("product_name"),
                TransactionItem.quantity.label("quantity"),
                TransactionItem.unit_price_at_time.label("unit_price"),
                TransactionItem.subtotal.label("subtotal"),
            )
            .join(TransactionItem, TransactionItem.transaction_id == Transaction.id)
            .join(Product, Product.id == TransactionItem.product_id)
            .filter(Transaction.date >= start, Transaction.date <= end)
        )
        # Filter store: branch_id adalah UUID di Transaction; store_nbr filter
        # tidak applicable langsung. Skip filter jika user provide store_nbr.
        # (Untuk MVP, branch filtering di sales akan dihandle di Phase berikut
        # ketika branch_id <-> store_nbr mapping diperjelas via Store table.)
        rows = q.all()
        return pd.DataFrame(rows, columns=[
            "transaction_id", "date", "time", "branch_id", "payment_method",
            "product_sku", "product_name", "quantity", "unit_price", "subtotal",
        ])

    def _build_prediction_df(
        self, start: date, end: date, store_nbr: Optional[int]
    ) -> pd.DataFrame:
        """PREDICTION: AI forecast logs."""
        q = self.db.query(
            AIPredictionLog.predicted_for_date.label("predicted_for_date"),
            AIPredictionLog.store_nbr.label("store_nbr"),
            AIPredictionLog.family.label("family"),
            AIPredictionLog.horizon_days.label("horizon_days"),
            AIPredictionLog.predicted_value.label("predicted_value"),
            AIPredictionLog.actual_value.label("actual_value"),
            AIPredictionLog.recommended_stock.label("recommended_stock"),
            AIPredictionLog.model_version.label("model_version"),
            AIPredictionLog.reasoning_text.label("reasoning"),
        ).filter(
            AIPredictionLog.predicted_for_date >= start,
            AIPredictionLog.predicted_for_date <= end,
        )
        if store_nbr is not None:
            q = q.filter(AIPredictionLog.store_nbr == store_nbr)
        rows = q.all()
        return pd.DataFrame(rows, columns=[
            "predicted_for_date", "store_nbr", "family", "horizon_days",
            "predicted_value", "actual_value", "recommended_stock",
            "model_version", "reasoning",
        ])

    def _build_profit_loss_df(
        self, start: date, end: date, store_nbr: Optional[int]
    ) -> pd.DataFrame:
        """
        PROFIT_LOSS: revenue (transactions) - expenses (petty_cash type=expense),
        di-aggregate per tanggal.
        """
        # Revenue per hari
        rev_q = (
            self.db.query(
                Transaction.date.label("date"),
                func.sum(Transaction.total_amount).label("revenue"),
            )
            .filter(Transaction.date >= start, Transaction.date <= end)
            .group_by(Transaction.date)
        )
        rev_df = pd.DataFrame(rev_q.all(), columns=["date", "revenue"])

        # Expenses per hari (dari petty_cash JOIN cash_session utk dapet tanggal)
        exp_q = (
            self.db.query(
                func.date(CashSession.start_time).label("date"),
                func.sum(PettyCashTransaction.amount).label("expenses"),
            )
            .join(CashSession, CashSession.id == PettyCashTransaction.cash_session_id)
            .filter(
                func.date(CashSession.start_time) >= start,
                func.date(CashSession.start_time) <= end,
                PettyCashTransaction.type == "expense",
            )
            .group_by(func.date(CashSession.start_time))
        )
        exp_df = pd.DataFrame(exp_q.all(), columns=["date", "expenses"])

        # Merge & hitung net_profit
        if rev_df.empty and exp_df.empty:
            return pd.DataFrame(columns=["date", "revenue", "expenses", "net_profit"])

        merged = pd.merge(rev_df, exp_df, on="date", how="outer").fillna(0.0)
        merged["net_profit"] = merged["revenue"] - merged["expenses"]
        merged = merged.sort_values("date").reset_index(drop=True)
        return merged[["date", "revenue", "expenses", "net_profit"]]

    def _build_wastage_df(
        self, start: date, end: date, store_nbr: Optional[int]
    ) -> pd.DataFrame:
        """WASTAGE: stock movements bertipe WASTE."""
        q = (
            self.db.query(
                func.date(StockMovement.created_at).label("date"),
                Inventory.store_nbr.label("store_nbr"),
                Product.sku.label("product_sku"),
                Product.name.label("product_name"),
                StockMovement.quantity.label("quantity"),
                StockMovement.reason.label("reason"),
                StockMovement.performed_by.label("performed_by"),
            )
            .join(Inventory, Inventory.id == StockMovement.inventory_id)
            .join(Product, Product.id == Inventory.product_id)
            .filter(
                StockMovement.movement_type == "WASTE",
                func.date(StockMovement.created_at) >= start,
                func.date(StockMovement.created_at) <= end,
            )
        )
        if store_nbr is not None:
            q = q.filter(Inventory.store_nbr == store_nbr)
        rows = q.all()
        return pd.DataFrame(rows, columns=[
            "date", "store_nbr", "product_sku", "product_name",
            "quantity", "reason", "performed_by",
        ])

    def _calculate_gross_margin(
        self,
        start: date,
        end: date,
        store_nbr: Optional[int],
    ) -> float:
        query = (
            self.db.query(
                func.sum(TransactionItem.subtotal).label("revenue"),
                func.sum(TransactionItem.quantity * Product.cost_price).label("cost"),
            )
            .join(Transaction, Transaction.id == TransactionItem.transaction_id)
            .join(Product, Product.id == TransactionItem.product_id)
            .filter(Transaction.date >= start, Transaction.date <= end)
        )
        if store_nbr is not None:
            query = query.join(Store, Transaction.branch_id == Store.id).filter(Store.store_nbr == store_nbr)

        row = query.first()
        revenue = float(row.revenue or 0) if row else 0.0
        cost = float(row.cost or 0) if row else 0.0
        if revenue <= 0:
            return 0.0
        return round(((revenue - cost) / revenue) * 100, 2)


def _coerce_period(period: str) -> ExportPeriod:
    try:
        return ExportPeriod(period)
    except ValueError:
        return ExportPeriod.MONTH
