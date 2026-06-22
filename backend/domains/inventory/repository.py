"""
Inventory Repository — Data Access Layer.
Query database murni. Tidak ada logika bisnis.
"""
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import Optional
from uuid import UUID
from datetime import datetime

from domains.inventory.models import Product, Inventory, StockMovement


def _coerce_uuid(value: str | UUID) -> Optional[UUID]:
    if isinstance(value, UUID):
        return value
    try:
        return UUID(str(value))
    except (TypeError, ValueError):
        return None


# ========================
# PRODUCT QUERIES
# ========================

def get_products(db: Session, family: Optional[str] = None, category: Optional[str] = None,
                 is_active: Optional[bool] = None, search: Optional[str] = None,
                 skip: int = 0, limit: int = 100, updated_since: Optional[datetime] = None):
    """List produk dengan filter opsional.
    
    Parameter `updated_since` dipakai untuk incremental sync offline cache (PWA).
    """
    query = db.query(Product)
    
    if family:
        query = query.filter(Product.family == family)
    if category:
        query = query.filter(Product.category == category)
    if is_active is not None:
        query = query.filter(Product.is_active == is_active)
    if search:
        query = query.filter(
            (Product.name.ilike(f"%{search}%")) | 
            (Product.sku.ilike(f"%{search}%"))
        )
    if updated_since is not None:
        query = query.filter(Product.updated_at > updated_since)
    
    return query.order_by(Product.name).offset(skip).limit(limit).all()


def get_product_by_id(db: Session, product_id: str) -> Optional[Product]:
    product_uuid = _coerce_uuid(product_id)
    if product_uuid is None:
        return None
    return db.query(Product).filter(
        Product.id == product_uuid,
        Product.is_active.is_(True),
        Product.deleted_at.is_(None),
    ).first()


def get_product_by_sku(db: Session, sku: str) -> Optional[Product]:
    return db.query(Product).filter(Product.sku == sku).first()


def create_product(db: Session, product_data: dict) -> Product:
    db_product = Product(**product_data)
    db.add(db_product)
    return db_product


def update_product(db: Session, product: Product, update_data: dict) -> Product:
    for key, value in update_data.items():
        if value is not None:
            setattr(product, key, value)
    return product


def count_products(db: Session, is_active: Optional[bool] = None) -> int:
    query = db.query(func.count(Product.id))
    if is_active is not None:
        query = query.filter(Product.is_active == is_active)
    return query.scalar() or 0


def get_distinct_families(db: Session):
    """Ambil daftar family unik untuk filter dropdown."""
    return [row[0] for row in db.query(Product.family).distinct().order_by(Product.family).all()]


def get_distinct_categories(db: Session):
    """Ambil daftar kategori unik untuk filter dropdown."""
    return [row[0] for row in db.query(Product.category).distinct().order_by(Product.category).all()]


# ========================
# INVENTORY QUERIES
# ========================

def get_inventory_list(db: Session, store_nbr: Optional[int] = None, skip: int = 0, limit: int = 100):
    """List stok dengan eager load product info."""
    query = db.query(Inventory).options(joinedload(Inventory.product))
    
    if store_nbr is not None:
        query = query.filter(Inventory.store_nbr == store_nbr)
    
    return query.offset(skip).limit(limit).all()


def get_inventory_by_product_store(db: Session, product_id: str, store_nbr: int) -> Optional[Inventory]:
    product_uuid = _coerce_uuid(product_id)
    if product_uuid is None:
        return None
    return db.query(Inventory).filter(
        Inventory.product_id == product_uuid,
        Inventory.store_nbr == store_nbr
    ).first()


def get_inventory_by_id(db: Session, inventory_id: str) -> Optional[Inventory]:
    inventory_uuid = _coerce_uuid(inventory_id)
    if inventory_uuid is None:
        return None
    return db.query(Inventory).options(
        joinedload(Inventory.product)
    ).filter(Inventory.id == inventory_uuid).first()


def create_inventory(db: Session, inv_data: dict) -> Inventory:
    db_inv = Inventory(**inv_data)
    db.add(db_inv)
    return db_inv


def update_stock(db: Session, inventory: Inventory, new_stock: int):
    inventory.current_stock = new_stock


def deduct_stock_atomic(db: Session, product_id: str, store_nbr: int, quantity: int, expected_version: int):
    """
    Mengurangi stok menggunakan Optimistic Locking.
    Return True jika sukses, False jika versi tidak cocok (conflict).
    """
    product_uuid = _coerce_uuid(product_id)
    if product_uuid is None:
        return False

    # Menggunakan update statement dengan filter versi untuk atomicity
    result = db.query(Inventory).filter(
        Inventory.product_id == product_uuid,
        Inventory.store_nbr == store_nbr,
        Inventory.version == expected_version
    ).update({
        "current_stock": Inventory.current_stock - quantity,
        "version": Inventory.version + 1
    }, synchronize_session=False)
    
    return result > 0


def get_all_inventory_with_products(db: Session, store_nbr: Optional[int] = None):
    """Untuk summary: ambil semua stok beserta harga produk."""
    query = db.query(Inventory).options(joinedload(Inventory.product))
    if store_nbr is not None:
        query = query.filter(Inventory.store_nbr == store_nbr)
    return query.all()


# ========================
# STOCK MOVEMENT QUERIES
# ========================

def create_movement(db: Session, movement_data: dict) -> StockMovement:
    db_movement = StockMovement(**movement_data)
    db.add(db_movement)
    return db_movement


def get_movements_by_inventory(db: Session, inventory_id: str, limit: int = 50):
    return db.query(StockMovement).filter(
        StockMovement.inventory_id == inventory_id
    ).order_by(StockMovement.created_at.desc()).limit(limit).all()
