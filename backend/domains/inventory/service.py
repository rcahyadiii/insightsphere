"""
Inventory Service — Business Logic Layer.
Logika bisnis: status stok, sisa hari, deduct dari penjualan, validasi.
"""
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date, datetime, timezone

from domains.inventory import repository as inv_repo
from domains.inventory.schemas import (
    ProductCreate, ProductUpdate, StockMovementCreate, InventoryCreate,
    InventoryResponse, StockSummaryResponse
)


# ========================
# STOCK STATUS LOGIC
# ========================

def determine_stock_status(current: int, min_stock: int, max_stock: int) -> str:
    """Tentukan status stok berdasarkan ambang batas. Digunakan di UI untuk badge warna."""
    if current <= 0:
        return "OUT_OF_STOCK"
    if current <= min_stock:
        return "CRITICAL"
    if current <= int(min_stock * 1.5):
        return "LOW"
    if current >= max_stock:
        return "OVERSTOCK"
    return "SAFE"


def calculate_days_remaining(current_stock: int, avg_daily_demand: float) -> float:
    """Estimasi berapa hari stok bertahan berdasarkan rata-rata penjualan harian."""
    if avg_daily_demand <= 0:
        return 999.0
    return round(current_stock / avg_daily_demand, 1)


# ========================
# PRODUCT OPERATIONS
# ========================

def create_product(db: Session, product_data: ProductCreate):
    """Buat produk baru. Tolak jika SKU sudah ada."""
    existing = inv_repo.get_product_by_sku(db, product_data.sku)
    if existing:
        raise ValueError(f"Product with SKU '{product_data.sku}' already exists.")
    
    product = inv_repo.create_product(db, product_data.model_dump())
    db.commit()
    db.refresh(product)
    return product


def update_product(db: Session, product_id: str, update_data: ProductUpdate):
    """Update produk. Hanya field yang dikirim yang diubah."""
    product = inv_repo.get_product_by_id(db, product_id)
    if not product:
        raise ValueError("Product not found.")
    
    inv_repo.update_product(db, product, update_data.model_dump(exclude_unset=True))
    db.commit()
    db.refresh(product)
    return product


def delete_product(db: Session, product_id: str):
    """Soft delete produk (set is_active = False)."""
    product = inv_repo.get_product_by_id(db, product_id)
    if not product:
        raise ValueError("Product not found.")
    
    product.is_active = False
    product.deleted_at = datetime.now(timezone.utc)
    db.commit()
    return {"detail": "Product deactivated."}


def get_products(db: Session, family=None, category=None, is_active=None, search=None, skip=0, limit=100, updated_since=None):
    return inv_repo.get_products(db, family, category, is_active, search, skip, limit, updated_since)


def get_product_by_id(db: Session, product_id: str):
    product = inv_repo.get_product_by_id(db, product_id)
    if not product:
        raise ValueError("Product not found.")
    return product


def get_filter_options(db: Session):
    """Ambil daftar family & category unik untuk dropdown filter."""
    return {
        "families": inv_repo.get_distinct_families(db),
        "categories": inv_repo.get_distinct_categories(db)
    }


# ========================
# INVENTORY OPERATIONS
# ========================

def get_stock_list(db: Session, store_nbr: Optional[int] = None, skip: int = 0, limit: int = 100):
    """Ambil daftar stok beserta status otomatis per item."""
    items = inv_repo.get_inventory_list(db, store_nbr, skip, limit)
    
    enriched = []
    for inv in items:
        status = determine_stock_status(inv.current_stock, inv.min_stock, inv.max_stock)
        days = calculate_days_remaining(inv.current_stock, 5.0)  # TODO: avg dari data nyata
        
        response = InventoryResponse(
            id=inv.id,
            product_id=inv.product_id,
            store_nbr=inv.store_nbr,
            current_stock=inv.current_stock,
            min_stock=inv.min_stock,
            max_stock=inv.max_stock,
            reorder_point=inv.reorder_point,
            location=inv.location,
            last_restock_date=inv.last_restock_date,
            version=inv.version,
            created_at=inv.created_at,
            updated_at=inv.updated_at,
            status=status,
            days_remaining=days,
            product_name=inv.product.name if inv.product else None,
            product_sku=inv.product.sku if inv.product else None,
            product_category=inv.product.category if inv.product else None,
            product_family=inv.product.family if inv.product else None,
            product_unit=inv.product.unit if inv.product else None,
            product_price=(inv.product.default_price or inv.product.base_price) if inv.product else None,
            product_image_url=inv.product.image_url if inv.product else None,
        )
        enriched.append(response)
    
    return enriched


def get_stock_summary(db: Session, store_nbr: Optional[int] = None) -> StockSummaryResponse:
    """Hitung ringkasan stok: berapa aman, menipis, kritis, dll."""
    all_inv = inv_repo.get_all_inventory_with_products(db, store_nbr)
    
    counts = {"SAFE": 0, "LOW": 0, "CRITICAL": 0, "OVERSTOCK": 0, "OUT_OF_STOCK": 0}
    total_value = 0.0
    
    for inv in all_inv:
        status = determine_stock_status(inv.current_stock, inv.min_stock, inv.max_stock)
        counts[status] = counts.get(status, 0) + 1
        
        if inv.product:
            total_value += inv.current_stock * inv.product.cost_price
    
    return StockSummaryResponse(
        total_products=len(all_inv),
        safe=counts["SAFE"],
        low=counts["LOW"],
        critical=counts["CRITICAL"],
        overstock=counts["OVERSTOCK"],
        out_of_stock=counts["OUT_OF_STOCK"],
        total_inventory_value=round(total_value, 2)
    )


# ========================
# STOCK MOVEMENT OPERATIONS
# ========================

def record_stock_movement(db: Session, movement_data: StockMovementCreate):
    """
    Catat pergerakan stok + update current_stock sekaligus.
    IN → tambah stok, OUT → kurangi stok, ADJUSTMENT → set langsung, WASTE → kurangi.
    """
    inventory = inv_repo.get_inventory_by_id(db, str(movement_data.inventory_id))
    if not inventory:
        raise ValueError("Inventory record not found.")
    
    # Update current_stock berdasarkan tipe
    new_stock = inventory.current_stock + movement_data.quantity
    if new_stock < 0:
        raise ValueError(f"Insufficient stock. Current: {inventory.current_stock}, Requested: {movement_data.quantity}")
    
    inv_repo.update_stock(db, inventory, new_stock)
    
    # Update last_restock_date jika tipe IN
    if movement_data.movement_type == "IN":
        inventory.last_restock_date = datetime.now(timezone.utc).date()
    
    movement = inv_repo.create_movement(db, movement_data.model_dump())
    
    db.commit()
    db.refresh(movement)
    return movement


def deduct_stock_from_sale(db: Session, product_id: str, store_nbr: int, quantity: int, transaction_id: str = None):
    """
    Auto-kurangi stok saat transaksi POS dicatat.
    Dipanggil oleh sales service setelah transaction dibuat.
    """
    inventory = inv_repo.get_inventory_by_product_store(db, product_id, store_nbr)
    if not inventory:
        return None  # Produk belum punya record stok di cabang ini — skip silently
    
    new_stock = max(inventory.current_stock - quantity, 0)
    inv_repo.update_stock(db, inventory, new_stock)
    
    inv_repo.create_movement(db, {
        "inventory_id": inventory.id,
        "movement_type": "OUT",
        "quantity": -quantity,
        "reason": "Penjualan POS — auto deduct",
        "reference_id": transaction_id,
    })
    
    return inventory
