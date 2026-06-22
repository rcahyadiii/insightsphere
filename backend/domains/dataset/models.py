"""
Domain Dataset — Data Read-Only dari Kaggle (Store Sales Time Series Forecasting).
Tabel ini di-seed sekali saat setup awal dan tidak dimodifikasi oleh aplikasi.
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, Date, Index, ForeignKey
from sqlalchemy.orm import relationship
from core.base_model import AbstractBase


class Store(AbstractBase):
    __tablename__ = "stores"
    
    store_nbr = Column(Integer, unique=True, index=True, nullable=False)
    city = Column(String, nullable=False)
    state = Column(String, nullable=False)
    type = Column(String, nullable=False)
    cluster = Column(Integer, nullable=False)

    sales = relationship("SalesTransaction", back_populates="store", uselist=True)


class SalesTransaction(AbstractBase):
    __tablename__ = "sales_transactions"
    
    kaggle_id = Column(Integer, unique=True, index=True, nullable=False)
    date = Column(Date, nullable=False, index=True)
    store_nbr = Column(Integer, ForeignKey("stores.store_nbr"), nullable=False, index=True)
    family = Column(String, nullable=False, index=True)
    sales = Column(Float, nullable=False)
    onpromotion = Column(Integer, nullable=False)

    store = relationship("Store", back_populates="sales")
    
    __table_args__ = (
        Index('idx_sales_date_store_family', 'date', 'store_nbr', 'family'),
    )


class HolidayEvent(AbstractBase):
    __tablename__ = "holiday_events"
    
    date = Column(Date, index=True, nullable=False)
    type = Column(String, nullable=False)
    locale = Column(String, nullable=False)
    locale_name = Column(String, nullable=False)
    description = Column(String, nullable=False)
    transferred = Column(Boolean, default=False)


class OilPrice(AbstractBase):
    __tablename__ = "oil_prices"
    
    date = Column(Date, unique=True, index=True, nullable=False)
    dcoilwtico = Column(Float, nullable=True)
