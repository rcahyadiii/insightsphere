"""
Intelligence Router — HTTP Endpoint Layer.
Endpoint untuk prediksi AI dan metrik model.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from core.database import get_db
from domains.intelligence.schemas import AIPredictionLogResponse, AIModelMetricResponse
from domains.intelligence import service as intel_service

router = APIRouter()


@router.get("/predictions", response_model=List[AIPredictionLogResponse])
def get_analytics_predictions(
    store_nbr: Optional[int] = Query(None, description="Filter predictions by specific store_nbr"),
    predicted_for_date: Optional[date] = Query(None, description="Filter for a specific date"),
    limit: int = Query(100, ge=1, le=1000, description="Batas pengembalian maksimum"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    db: Session = Depends(get_db)
):
    """
    Menarik tabel prediksi "Rekomendasi Stok Cerdas" beserta Reasoning AI Text.
    """
    return intel_service.get_predictions(db, store_nbr, predicted_for_date, limit, offset)


@router.get("/metrics", response_model=List[AIModelMetricResponse])
def get_model_metrics(
    model_name: Optional[str] = Query(None, description="Nama model spesifik"),
    store_nbr: Optional[int] = Query(None, description="Filter cabang"),
    limit: int = Query(50, ge=1, le=200, description="Batas pengembalian"),
    db: Session = Depends(get_db)
):
    """
    Tarik Metrik Kesehatan Akurasi AI (R-Squared, RMSE, Bias).
    """
    return intel_service.get_model_metrics(db, model_name, store_nbr, limit)
