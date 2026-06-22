"""
Finance Router — HTTP Endpoint Layer.
Kurus: hanya menerima request, delegasi ke service, kembalikan response.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from uuid import UUID

from core.database import get_db
from core.security import get_current_user_payload
from domains.finance.schemas import (
    CashSessionCreate, CashSessionResponse, 
    CashSessionClose, PettyCashCreate, PettyCashResponse,
    CashSessionListResponse,
)
from domains.finance import service as finance_service

router = APIRouter(
    prefix="/finance",
    tags=["Cash Management (Finance)"]
)


@router.post("/cash-sessions/open", response_model=CashSessionResponse, status_code=201)
def open_cash_session(session_data: CashSessionCreate, db: Session = Depends(get_db)):
    """AM-Shift Buka Kasir: Kasir declare saldo awal hari ini."""
    try:
        return finance_service.open_shift(db, session_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/cash-sessions/petty-cash", response_model=PettyCashResponse, status_code=201)
def record_petty_cash(expense_data: PettyCashCreate, db: Session = Depends(get_db)):
    """Petty Cash: Kasir ambil uang dari laci untuk kebutuhan mendesak."""
    try:
        return finance_service.record_petty_cash(db, expense_data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/cash-sessions", response_model=CashSessionListResponse)
def list_cash_sessions(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _user=Depends(get_current_user_payload),
):
    return finance_service.list_cash_sessions(db, limit=limit, offset=offset)


@router.get("/cash-sessions/{session_id}", response_model=CashSessionResponse)
def get_cash_session(
    session_id: UUID,
    db: Session = Depends(get_db),
    _user=Depends(get_current_user_payload),
):
    return finance_service.get_cash_session_detail(db, session_id)


@router.put("/cash-sessions/{session_id}/close", response_model=CashSessionResponse)
def close_cash_session(session_id: str, close_data: CashSessionClose, db: Session = Depends(get_db)):
    """PM-Shift Tutup Kasir: Menghitung kaku kekurangan/kelebihan uang."""
    try:
        return finance_service.close_shift(db, session_id, close_data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
