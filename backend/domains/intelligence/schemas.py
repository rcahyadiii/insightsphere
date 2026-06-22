"""
Intelligence Domain Schemas — Response contracts untuk prediksi AI & metrik model.
"""
from pydantic import BaseModel, ConfigDict
from datetime import date, datetime
from uuid import UUID


class AIPredictionLogResponse(BaseModel):
    id: UUID
    store_nbr: int | None
    branch_id: UUID | None
    family: str | None
    predicted_for_date: date
    prediction_type: str
    predicted_value: float
    actual_value: float | None
    recommended_stock: int | None
    safety_stock_buffer: float | None
    safety_stock_source: str | None
    reasoning_text: str
    model_version: str | None
    horizon_days: int | None
    product_id: UUID | None
    prediction_level: str | None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class AIModelMetricResponse(BaseModel):
    id: UUID
    store_nbr: int | None
    model_name: str
    metric_name: str
    metric_value: float
    evaluated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
