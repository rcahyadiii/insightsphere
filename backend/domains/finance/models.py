"""
Domain Finance — Cash Session & Petty Cash.
Manajemen shift kasir: buka/tutup laci + pencatatan pengeluaran operasional.
"""
from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from core.base_model import AbstractBase, get_utc_now


class CashSession(AbstractBase):
    __tablename__ = "cash_sessions"
    
    cashier_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    store_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    start_time = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=True)
    opening_balance = Column(Float, nullable=False)
    expected_closing_balance = Column(Float, nullable=True)
    actual_closing_balance = Column(Float, nullable=True)
    difference = Column(Float, nullable=True)
    status = Column(String, nullable=False, default="open")  # 'open', 'closed'


class PettyCashTransaction(AbstractBase):
    __tablename__ = "petty_cash_transactions"
    
    cash_session_id = Column(UUID(as_uuid=True), ForeignKey("cash_sessions.id"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    description = Column(String, nullable=False)
    type = Column(String, nullable=False, default="expense")  # 'expense', 'income'
