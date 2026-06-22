"""
Domain Intelligence — MLOps & AI Models.
Tabel-tabel pendukung pipeline Machine Learning.
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, Date, DateTime, ForeignKey, Index, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from core.base_model import AbstractBase, get_utc_now


class MLFeatureStore(AbstractBase):
    __tablename__ = "ml_feature_store"
    
    store_nbr = Column(Integer, ForeignKey("stores.store_nbr"), nullable=False, index=True)
    family = Column(String, nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    rolling_7d_sales = Column(Float, default=0.0)
    is_weekend = Column(Boolean, default=False)
    days_since_payday = Column(Integer, default=0)
    lag_1 = Column(Float, default=0.0)
    lag_2 = Column(Float, default=0.0)
    lag_3 = Column(Float, default=0.0)
    lag_7 = Column(Float, default=0.0)
    day_of_week = Column(Integer, default=0)
    is_month_end = Column(Boolean, default=False)
    is_holiday_or_event = Column(Boolean, default=False)
    oil_price = Column(Float, default=0.0)
    cluster = Column(Integer, default=0)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    last_updated = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now, nullable=False)
    
    # v10 Aggressive Features
    onpromotion = Column(Float, default=0.0)             # Jumlah item dalam promosi
    rolling_7d_std = Column(Float, default=0.0)           # Volatilitas penjualan 7 hari
    lag_14 = Column(Float, default=0.0)                   # Medium-term lag
    lag_30 = Column(Float, default=0.0)                   # Monthly lag
    rolling_14d_sales = Column(Float, default=0.0)        # 2-week rolling mean
    rolling_30d_sales = Column(Float, default=0.0)        # Monthly rolling mean
    days_to_next_holiday = Column(Integer, default=0)     # Jarak ke liburan berikutnya
    store_type = Column(String, nullable=True)            # Tipe toko (A/B/C/D/E)
    
    # Multi-Horizon Targets — rata-rata demand N hari ke depan (diisi oleh feature_engineering)
    avg_demand_7d = Column(Float, nullable=True)
    avg_demand_14d = Column(Float, nullable=True)
    avg_demand_21d = Column(Float, nullable=True)
    avg_demand_28d = Column(Float, nullable=True)
    
    __table_args__ = (
        Index('idx_ml_features_store_family_date', 'store_nbr', 'family', 'date'),
        UniqueConstraint('store_nbr', 'family', 'date', name='uix_ml_store_family_date'),
    )


class AIModelMetric(AbstractBase):
    """Menyimpan hasil evaluasi performa model ML (mencegah Model Drift)."""
    __tablename__ = "ai_model_metrics"
    
    store_nbr = Column(Integer, nullable=True, index=True)
    model_name = Column(String, nullable=False, index=True)
    metric_name = Column(String, nullable=False)
    metric_value = Column(Float, nullable=False)
    evaluated_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)


class AIPredictionLog(AbstractBase):
    __tablename__ = "ai_prediction_logs"
    
    store_nbr = Column(Integer, nullable=True, index=True)
    branch_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    family = Column(String, nullable=True)
    predicted_for_date = Column(Date, nullable=False, index=True)
    prediction_type = Column(String, nullable=False)
    predicted_value = Column(Float, nullable=False)
    actual_value = Column(Float, nullable=True)
    recommended_stock = Column(Integer, nullable=True)
    safety_stock_buffer = Column(Float, nullable=True)
    safety_stock_source = Column(String, nullable=True)
    reasoning_text = Column(String, nullable=False)
    model_version = Column(String, nullable=True)
    
    # Multi-Horizon + Per-Item Disaggregation
    horizon_days = Column(Integer, nullable=True, index=True)       # 7, 14, 21, 28
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=True, index=True)
    prediction_level = Column(String, nullable=True)                # "family" atau "product"


class FeatureFlag(AbstractBase):
    __tablename__ = "feature_flags"
    
    store_nbr = Column(Integer, ForeignKey("stores.store_nbr"), nullable=False, index=True)
    feature_name = Column(String, nullable=False)
    is_active = Column(Boolean, default=False, nullable=False)
    
    __table_args__ = (UniqueConstraint('store_nbr', 'feature_name', name='uix_store_feature_name'),)
