"""
Sales Router — HTTP Endpoint Layer.
Kurus dan bersih: hanya menerima request, delegasi ke service, kembalikan response.
"""
from datetime import date
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from core.database import get_db
from core.security import get_current_user, get_current_user_payload
from domains.identity.models import User
from domains.sales.schemas import (
    TransactionCreate,
    TransactionResponse,
    TransactionBatchCreate,
    BatchSyncResponse,
    TransactionSummaryResponse,
)
from domains.sales import service as sales_service
from domains.sales import repository as sales_repo

router = APIRouter(
    prefix="/transactions",
    tags=["Transactions"]
)


@router.post("/", response_model=TransactionResponse, status_code=201)
def create_transaction(transaction: TransactionCreate, db: Session = Depends(get_db)):
    """
    Endpoint Kasir:
    Mencatat totalan keranjang transaksi baru. Memfilter input kotor via Pydantic Data Contracts.
    """
    try:
        return sales_service.create_single_transaction(db, transaction)
    except ValueError as e:
        if str(e) == "STOK_CONFLICT":
            raise HTTPException(status_code=409, detail="Stock version conflict. Another transaction updated this stock.")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal Server Error during checkout.")


@router.post("/batch", status_code=207)
def sync_offline_transactions(batch: TransactionBatchCreate, db: Session = Depends(get_db)):
    """
    Offline Sync Endpoint:
    Menerima tumpukan keranjang transaksi dari browser kasir yang sempat mati internet.
    """
    return sales_service.sync_offline_transactions(db, batch)


@router.get("/mine", response_model=List[TransactionResponse])
def read_my_transactions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    date_from: Optional[date] = Query(None, description="Filter tanggal awal (inklusif)"),
    date_to: Optional[date] = Query(None, description="Filter tanggal akhir (inklusif)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Transaksi milik kasir yang sedang login (Transaksi Saya).
    cashier_id diambil dari JWT — tidak bisa di-spoof oleh client.
    """
    return sales_repo.get_transactions_with_items(
        db,
        skip=skip,
        limit=limit,
        cashier_id=current_user.id,
        date_from=date_from,
        date_to=date_to,
    )


@router.get("/", response_model=List[TransactionResponse])
def read_transactions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    cashier_id: Optional[UUID] = Query(None, description="Filter by kasir (UUID)"),
    date_from: Optional[date] = Query(None, description="Filter tanggal awal (inklusif)"),
    date_to: Optional[date] = Query(None, description="Filter tanggal akhir (inklusif)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Endpoint Dashboard Admin/Owner:
    Mengambil list transaksi dengan filter opsional (cashier, tanggal) dan Eager Loading.
    """
    return sales_repo.get_transactions_with_items(
        db,
        skip=skip,
        limit=limit,
        cashier_id=cashier_id,
        date_from=date_from,
        date_to=date_to,
    )


@router.get("/summary", response_model=TransactionSummaryResponse)
def transaction_summary(
    date_from: date = Query(...),
    date_to: date = Query(...),
    store_nbr: Optional[int] = Query(None, description="Filter by store number"),
    group_by: str = Query("day", pattern="^(day|week|month)$"),
    db: Session = Depends(get_db),
    _user=Depends(get_current_user_payload),
):
    """
    Ringkasan transaksi untuk halaman laporan: total, payment mix, dan time series.
    """
    try:
        return sales_service.get_transaction_summary(
            db,
            date_from=date_from,
            date_to=date_to,
            group_by=group_by,
            store_nbr=store_nbr,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/summary/today")
def get_today_summary(
    branch_id: Optional[str] = Query(None, description="Specific branch UUID"),
    db: Session = Depends(get_db)
):
    """
    Live Summary Dashboard:
    Menghitung total omzet hari ini menggunakan agregasi langsung tingkat DB.
    """
    return sales_service.get_today_summary(db, branch_id)
