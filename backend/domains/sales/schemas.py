"""
Sales Domain Schemas — Kontrak validasi data transaksi.
"""
from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import List, Optional
from datetime import date, time
from uuid import UUID


class TransactionItemCreate(BaseModel):
    product_id: UUID
    quantity: int
    unit_price_at_time: float
    version_at_transaction: int

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "product_id": "123e4567-e89b-12d3-a456-426614174000",
                "quantity": 2,
                "unit_price_at_time": 25.50
            }
        }
    )

    @field_validator('quantity')
    @classmethod
    def validate_quantity(cls, v: int) -> int:
        if v <= 0:
            raise ValueError('quantity must be greater than 0')
        return v
    
    @field_validator('unit_price_at_time')
    @classmethod
    def validate_unit_price(cls, v: float) -> float:
        if v <= 0:
            raise ValueError('unit_price_at_time must be greater than 0')
        return v


class TransactionCreate(BaseModel):
    branch_id: Optional[UUID] = None
    store_nbr: Optional[int] = Field(None, description="Nomor toko (alternatif untuk branch_id)")
    date: date
    time: time
    payment_method: str = Field(..., min_length=1)
    cashier_id: UUID | None = None
    cash_session_id: UUID | None = None
    client_txn_id: Optional[str] = Field(
        default=None,
        max_length=64,
        description="Client-generated UUID for idempotent offline sync. Prevent duplicate on retry.",
    )
    items: List[TransactionItemCreate] = Field(..., min_length=1)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "branch_id": "3a25ed1a-7203-4581-9f28-410f918d579f",
                "date": "2026-04-16",
                "time": "14:30:00",
                "payment_method": "CASH",
                "client_txn_id": "offline-uuid-v4-from-browser",
                "items": [
                    {
                        "product_id": "123e4567-e89b-12d3-a456-426614174000",
                        "quantity": 2,
                        "unit_price_at_time": 25.50
                    }
                ]
            }
        }
    )


class TransactionResponse(BaseModel):
    id: UUID
    branch_id: UUID
    date: date
    time: time
    total_amount: float
    payment_method: str
    cashier_id: UUID | None
    cash_session_id: UUID | None
    client_txn_id: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class TransactionBatchCreate(BaseModel):
    transactions: List[TransactionCreate]


class BatchItemResult(BaseModel):
    """Hasil sync per-item dalam batch offline."""
    status: str  # "success" | "failed" | "duplicate"
    client_txn_id: Optional[str] = None  # Echo untuk korelasi di frontend
    id: Optional[str] = None  # Server-generated ID kalau sukses
    error: Optional[str] = None  # Error message kalau gagal


class BatchSyncResponse(BaseModel):
    """Response untuk POST /transactions/batch (offline sync)."""
    synced: int
    failed: int
    duplicate: int = 0
    details: List[BatchItemResult]


class TransactionSummarySeriesItem(BaseModel):
    date: str
    revenue: float = 0
    transactions: int = 0


class TransactionPaymentMethodSummary(BaseModel):
    method: str
    count: int = 0
    total: float = 0


class TransactionSummaryResponse(BaseModel):
    total_revenue: float = 0
    total_transactions: int = 0
    total_items: int = 0
    payment_methods: list[TransactionPaymentMethodSummary] = Field(default_factory=list)
    series: list[TransactionSummarySeriesItem] = Field(default_factory=list)
