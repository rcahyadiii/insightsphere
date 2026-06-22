from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from core.database import get_db
from core.security import get_current_user_payload
from domains.dataset.models import Store
from domains.dataset.schemas import StoreResponse

router = APIRouter(prefix="/stores", tags=["Stores"])

@router.get("/", response_model=List[StoreResponse])
def get_stores(db: Session = Depends(get_db)):
    """
    Mengambil daftar seluruh toko (cabang).
    Digunakan untuk dropdown pemilihan cabang saat registrasi cashiers.
    """
    stores = db.query(Store).all()
    return stores
