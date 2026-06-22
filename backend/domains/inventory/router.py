"""
Inventory Router — HTTP Endpoint Layer.
8 Endpoint: CRUD Products + Stock per Cabang + Movement.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from core.database import get_db
from core.security import require_owner_or_admin, require_roles, require_store_access, get_current_user_payload
from domains.identity.constants import STORE_SCOPED_ROLES
from domains.inventory.schemas import (
    ProductCreate, ProductUpdate, ProductResponse,
    InventoryCreate, InventoryResponse, StockSummaryResponse,
    StockMovementCreate, StockMovementResponse
)
from domains.inventory import service as inv_service
from domains.inventory import repository as inv_repo

router = APIRouter(
    prefix="/inventory",
    tags=["Inventory"]
)



# ========================
# PRODUCT ENDPOINTS
# ========================

@router.get("/products", response_model=List[ProductResponse], dependencies=[Depends(get_current_user_payload)])
def list_products(
    family: Optional[str] = Query(None, description="Filter by ML family: GROCERY I, BEVERAGES, dll"),
    category: Optional[str] = Query(None, description="Filter by UI category: Sembako, Minuman, dll"),
    is_active: Optional[bool] = Query(None, description="Filter produk aktif/nonaktif"),
    search: Optional[str] = Query(None, description="Cari nama atau SKU"),
    updated_since: Optional[datetime] = Query(
        None,
        description="ISO-8601 timestamp. Hanya return produk yang di-update setelah waktu ini. Untuk incremental sync di PWA offline cache.",
    ),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """List semua produk dengan filter opsional.
    
    **Offline PWA support**: Gunakan `updated_since` untuk incremental sync —
    cuma download produk yang berubah sejak sync terakhir, hemat bandwidth.
    """
    return inv_service.get_products(db, family, category, is_active, search, skip, limit, updated_since)


@router.get("/products/filters", dependencies=[Depends(get_current_user_payload)])
def get_filter_options(db: Session = Depends(get_db)):
    """Ambil daftar family & category unik untuk dropdown filter."""
    return inv_service.get_filter_options(db)


@router.get("/products/{product_id}", response_model=ProductResponse, dependencies=[Depends(get_current_user_payload)])
def get_product(product_id: str, db: Session = Depends(get_db)):
    """Detail 1 produk berdasarkan ID."""
    try:
        return inv_service.get_product_by_id(db, product_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/products", response_model=ProductResponse, status_code=201, dependencies=[Depends(require_owner_or_admin)])
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    """Tambah produk baru ke katalog."""
    try:
        return inv_service.create_product(db, product)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/products/{product_id}", response_model=ProductResponse, dependencies=[Depends(require_owner_or_admin)])
def update_product(product_id: str, update_data: ProductUpdate, db: Session = Depends(get_db)):
    """Update field produk. Hanya field yang dikirim yang berubah."""
    try:
        return inv_service.update_product(db, product_id, update_data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/products/{product_id}", dependencies=[Depends(require_owner_or_admin)])
def delete_product(product_id: str, db: Session = Depends(get_db)):
    """Soft delete produk (nonaktifkan)."""
    try:
        return inv_service.delete_product(db, product_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ========================
# STOCK ENDPOINTS
# ========================

@router.get("/stock", response_model=List[InventoryResponse])
def list_stock(
    store_nbr: Optional[int] = Query(None, description="Filter cabang"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_user_payload)
):
    """List stok semua produk beserta status otomatis (SAFE/LOW/CRITICAL/OVERSTOCK)."""
    # Jika role cabang tidak memberikan store_nbr di filter, paksakan ke cabangnya
    # sebelum validasi akses agar default request tidak ditolak.
    if payload.get("role") in STORE_SCOPED_ROLES and store_nbr is None:
        store_nbr = payload.get("store_nbr")

    require_store_access(store_nbr, payload)
        
    return inv_service.get_stock_list(db, store_nbr, skip, limit)


@router.get("/stock/summary", response_model=StockSummaryResponse)
def get_stock_summary(
    store_nbr: Optional[int] = Query(None, description="Filter cabang"),
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_user_payload)
):
    """Ringkasan stok: total produk, aman, menipis, kritis, nilai inventaris."""
    if payload.get("role") in STORE_SCOPED_ROLES and store_nbr is None:
        store_nbr = payload.get("store_nbr")

    require_store_access(store_nbr, payload)
        
    return inv_service.get_stock_summary(db, store_nbr)


@router.post("/stock/movement", response_model=StockMovementResponse, status_code=201)
def record_stock_movement(
    movement: StockMovementCreate, 
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_user_payload)
):
    """Catat pergerakan stok (IN/OUT/ADJUSTMENT/WASTE) + auto-update current_stock."""
    # store_nbr tidak ada di payload movement — resolve dari inventory row dulu
    # sebelum cek akses cabang (sebelumnya membaca movement.store_nbr → AttributeError 500).
    inventory = inv_repo.get_inventory_by_id(db, str(movement.inventory_id))
    if not inventory:
        raise HTTPException(status_code=404, detail="Inventory record not found.")
    require_store_access(inventory.store_nbr, payload)
    try:
        return inv_service.record_stock_movement(db, movement)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
