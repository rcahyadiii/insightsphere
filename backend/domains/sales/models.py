"""
Domain Sales — Transaction & Transaction Items.
Kernel POS: mencatat setiap keranjang belanja beserta detail item-nya.
"""
from sqlalchemy import Column, Integer, String, Float, Date, Time, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from core.base_model import AbstractBase


class Transaction(AbstractBase):
    __tablename__ = "transactions"
    
    branch_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    time = Column(Time, nullable=False)
    total_amount = Column(Float, nullable=False)
    payment_method = Column(String, nullable=False)
    cashier_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    cash_session_id = Column(UUID(as_uuid=True), ForeignKey("cash_sessions.id"), nullable=True, index=True)
    client_txn_id = Column(String(64), unique=True, nullable=True, index=True)
    
    # Tax details (Inclusive/Exclusive structure)
    tax_rate = Column(Float, default=0, nullable=False)
    tax_amount = Column(Float, default=0, nullable=False)
    
    items = relationship("TransactionItem", back_populates="transaction")


class TransactionItem(AbstractBase):
    __tablename__ = "transaction_items"
    
    transaction_id = Column(UUID(as_uuid=True), ForeignKey("transactions.id"), nullable=False, index=True)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False)
    unit_price_at_time = Column(Float, nullable=False)
    subtotal = Column(Float, nullable=False)

    transaction = relationship("Transaction", back_populates="items")
