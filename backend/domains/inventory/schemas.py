"""
Inventory Domain Schemas — Kontrak validasi untuk Product, Stock, dan Movement.
"""
from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import date, datetime
from uuid import UUID


# ========================
# PRODUCT SCHEMAS
# ========================

class ProductCreate(BaseModel):
    sku: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=200)
    family: str = Field(..., min_length=1, description="Link ke ML prediction. Contoh: GROCERY I, BEVERAGES")
    category: str = Field(..., min_length=1, description="Label UI. Contoh: Sembako, Minuman")
    unit: str = Field(default="pcs")
    base_price: float = Field(..., gt=0)
    default_price: Optional[float] = Field(default=None, gt=0, description="Harga default untukPOS")
    cost_price: float = Field(default=0.0, ge=0)
    supplier: Optional[str] = None
    image_url: Optional[str] = None

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "sku": "SKU-001",
                "name": "Beras Premium 5kg",
                "family": "GROCERY I",
                "category": "Sembako",
                "unit": "pcs",
                "base_price": 75000,
                "cost_price": 62000,
                "supplier": "PT Beras Nusantara"
            }
        }
    )


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    family: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    base_price: Optional[float] = Field(default=None, gt=0)
    cost_price: Optional[float] = Field(default=None, ge=0)
    supplier: Optional[str] = None
    is_active: Optional[bool] = None
    image_url: Optional[str] = None


class ProductResponse(BaseModel):
    id: UUID
    sku: str
    name: str
    family: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    base_price: float
    cost_price: Optional[float] = None
    supplier: Optional[str] = None
    is_active: bool
    image_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ========================
# INVENTORY SCHEMAS
# ========================

class InventoryCreate(BaseModel):
    product_id: UUID
    store_nbr: int
    current_stock: int = Field(default=0, ge=0)
    min_stock: int = Field(default=10, ge=0)
    max_stock: int = Field(default=100, ge=1)
    reorder_point: int = Field(default=20, ge=0)
    location: Optional[str] = None


class InventoryResponse(BaseModel):
    id: UUID
    product_id: UUID
    store_nbr: int
    current_stock: int
    min_stock: int
    max_stock: int
    reorder_point: int
    location: Optional[str]
    last_restock_date: Optional[date]
    version: int
    created_at: datetime
    updated_at: datetime
    
    # Computed fields (diisi oleh service layer)
    status: Optional[str] = None          # "SAFE", "LOW", "CRITICAL", "OVERSTOCK", "OUT_OF_STOCK"
    days_remaining: Optional[float] = None
    product_name: Optional[str] = None
    product_sku: Optional[str] = None
    product_category: Optional[str] = None
    product_family: Optional[str] = None
    product_unit: Optional[str] = None
    product_price: Optional[float] = None
    product_image_url: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class StockSummaryResponse(BaseModel):
    total_products: int
    safe: int
    low: int
    critical: int
    overstock: int
    out_of_stock: int
    total_inventory_value: float


# ========================
# STOCK MOVEMENT SCHEMAS
# ========================

class StockMovementCreate(BaseModel):
    inventory_id: UUID
    movement_type: str = Field(..., pattern="^(IN|OUT|ADJUSTMENT|WASTE)$")
    quantity: int = Field(..., description="Positif = masuk stok, Negatif = keluar stok")
    reason: str = Field(..., min_length=1)
    reference_id: Optional[UUID] = None
    performed_by: Optional[UUID] = None

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "inventory_id": "3a25ed1a-7203-4581-9f28-410f918d579f",
                "movement_type": "IN",
                "quantity": 50,
                "reason": "Restok dari supplier"
            }
        }
    )


class StockMovementResponse(BaseModel):
    id: UUID
    inventory_id: UUID
    movement_type: str
    quantity: int
    reason: str
    reference_id: Optional[UUID]
    performed_by: Optional[UUID]
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
