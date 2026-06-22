"""
Intelligence Service — Business Logic Layer.
Orchestrasi hasil AI: format, filter, dan trigger batch.
"""
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date

from domains.intelligence import repository as intel_repo


def get_predictions(db: Session, store_nbr: Optional[int] = None,
                    predicted_for_date: Optional[date] = None,
                    limit: int = 100, offset: int = 0):
    """Ambil daftar prediksi AI beserta reasoning text."""
    return intel_repo.get_predictions(db, store_nbr, predicted_for_date, limit, offset)


def get_model_metrics(db: Session, model_name: Optional[str] = None,
                      store_nbr: Optional[int] = None, limit: int = 50):
    """Ambil metrik kesehatan model (WAPE, MAE, R², dll)."""
    return intel_repo.get_metrics(db, model_name, store_nbr, limit)
