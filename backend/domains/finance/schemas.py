"""
Finance Domain Schemas — Kontrak validasi data Cash Management.
"""
from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from uuid import UUID


class CashSessionCreate(BaseModel):
    cashier_id: UUID
    store_id: UUID
    opening_balance: float = Field(..., ge=0)


class CashSessionClose(BaseModel):
    actual_closing_balance: float = Field(..., ge=0)


class CashSessionResponse(BaseModel):
    id: UUID
    cashier_id: UUID
    store_id: UUID
    start_time: datetime
    end_time: datetime | None = None
    opening_balance: float
    expected_closing_balance: float | None = None
    actual_closing_balance: float | None = None
    difference: float | None = None
    status: str
    
    model_config = ConfigDict(from_attributes=True)


class CashSessionListResponse(BaseModel):
    items: list[CashSessionResponse]
    total: int


class PettyCashCreate(BaseModel):
    cash_session_id: UUID
    amount: float = Field(..., gt=0)
    description: str = Field(..., min_length=1)
    type: str = "expense"


class PettyCashResponse(BaseModel):
    id: UUID
    cash_session_id: UUID
    amount: float
    description: str
    type: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
