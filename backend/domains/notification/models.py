"""
Domain Notification — Models.
"""
import enum
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, JSON, Enum as SQLAlchemyEnum
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from core.base_model import AbstractBase


class NotificationCategory(str, enum.Enum):
    SYSTEM = "SYSTEM"
    INVENTORY = "INVENTORY"
    SALES = "SALES"
    AI_INSIGHT = "AI_INSIGHT"


class NotificationPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class Notification(AbstractBase):
    __tablename__ = "notifications"

    recipient_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(SQLAlchemyEnum(NotificationCategory, name="notification_category", native_enum=False), nullable=False, default=NotificationCategory.SYSTEM)
    priority = Column(SQLAlchemyEnum(NotificationPriority, name="notification_priority", native_enum=False), nullable=False, default=NotificationPriority.MEDIUM)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    action_link = Column(String(512), nullable=True)
    meta_data = Column(JSON, nullable=True)
    is_read = Column(Boolean, nullable=False, default=False, index=True)
    read_at = Column(DateTime(timezone=True), nullable=True)
