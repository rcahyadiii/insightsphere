import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, text
from sqlalchemy.dialects.postgresql import UUID
from core.database import Base

def get_utc_now():
    return datetime.now(timezone.utc)

class AbstractBase(Base):
    __abstract__ = True
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()"), index=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, server_default=text("now()"), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now, server_default=text("now()"), nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
