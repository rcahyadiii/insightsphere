"""
Domain Observability — Audit Trail, ETL Job Logs, Dead Letter Queue.
Infrastruktur pendukung untuk pelacakan aktivitas dan pemrosesan error.
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from core.base_model import AbstractBase, get_utc_now


class AuditEvent(AbstractBase):
    __tablename__ = "audit_events"
    
    store_nbr = Column(Integer, ForeignKey("stores.store_nbr"), nullable=True, index=True)
    event_type = Column(String, nullable=False, index=True)
    event_data = Column(JSONB, nullable=True)
    timestamp = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)


class ETLJobLog(AbstractBase):
    """Mencatat aktivitas job ETL harian (Success / Failed)."""
    __tablename__ = "etl_job_logs"
    
    job_name = Column(String, nullable=False, index=True)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=True)
    records_processed = Column(Integer, default=0, nullable=False)
    records_failed = Column(Integer, default=0, nullable=False)
    status = Column(String, nullable=False)  # 'running', 'success', 'failed'

    dead_letters = relationship("DeadLetterQueue", back_populates="job", uselist=True)


class DeadLetterQueue(AbstractBase):
    """Menyimpan data kotor mentah dari Pipeline sehingga tidak menghentikan arus insert data bersih."""
    __tablename__ = "dead_letter_queue"
    
    job_id = Column(UUID(as_uuid=True), ForeignKey("etl_job_logs.id"), nullable=False, index=True)
    raw_data = Column(JSONB, nullable=False)
    error_reason = Column(String, nullable=False)
    
    job = relationship("ETLJobLog", back_populates="dead_letters")
