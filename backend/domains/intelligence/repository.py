"""
Intelligence Repository — Data Access Layer.
Query database untuk AI predictions dan model metrics.
"""
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional
from datetime import date

from domains.intelligence.models import AIPredictionLog, AIModelMetric


def get_predictions(db: Session, store_nbr: Optional[int] = None, 
                    predicted_for_date: Optional[date] = None,
                    limit: int = 100, offset: int = 0):
    """Tarik prediksi AI dengan filter opsional."""
    query = db.query(AIPredictionLog)
    
    if store_nbr is not None:
        query = query.filter(AIPredictionLog.store_nbr == store_nbr)
    if predicted_for_date is not None:
        query = query.filter(AIPredictionLog.predicted_for_date == predicted_for_date)
    
    return query.order_by(
        desc(AIPredictionLog.predicted_for_date), 
        desc(AIPredictionLog.created_at)
    ).offset(offset).limit(limit).all()


def get_metrics(db: Session, model_name: Optional[str] = None, 
                store_nbr: Optional[int] = None, limit: int = 50):
    """Tarik metrik kesehatan model AI."""
    query = db.query(AIModelMetric)
    
    if model_name:
        query = query.filter(AIModelMetric.model_name == model_name)
    if store_nbr is not None:
        query = query.filter(AIModelMetric.store_nbr == store_nbr)
    
    return query.order_by(desc(AIModelMetric.evaluated_at)).limit(limit).all()
