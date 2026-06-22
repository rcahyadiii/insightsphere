"""
Domain Notification — Pydantic Schemas.

Layer kontrak data antara HTTP / Service / ORM.
Enum di-reuse dari models untuk single source of truth.
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional, Any, Dict
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict

from domains.notification.models import NotificationCategory, NotificationPriority


# ============================================================
# INPUT SCHEMAS
# ============================================================

class NotificationCreate(BaseModel):
    """
    Payload internal untuk membuat notifikasi.
    Dipanggil dari service domain lain (mis. inventory saat stok kritis)
    atau dari endpoint test-trigger.
    """
    recipient_id: UUID = Field(..., description="UUID user penerima notifikasi")
    category: NotificationCategory = Field(default=NotificationCategory.SYSTEM)
    priority: NotificationPriority = Field(default=NotificationPriority.MEDIUM)
    title: str = Field(..., min_length=1, max_length=255)
    message: str = Field(..., min_length=1)
    action_link: Optional[str] = Field(
        default=None,
        max_length=512,
        description="Deep-link relatif ke frontend, contoh: /inventory/item/123",
    )
    meta_data: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Payload bebas untuk konteks tambahan (product_id, delta, dsb)",
    )


class NotificationUpdate(BaseModel):
    """
    Update terbatas — hanya status `is_read` yang boleh diubah end-user.
    Field lain bersifat immutable setelah dibuat sistem.
    """
    is_read: bool = Field(..., description="Tandai notifikasi telah dibaca (true/false)")


# ============================================================
# OUTPUT SCHEMAS
# ============================================================

class NotificationRead(BaseModel):
    """Representasi notifikasi yang dikirim ke client."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    recipient_id: UUID
    category: NotificationCategory
    priority: NotificationPriority
    title: str
    message: str
    is_read: bool
    action_link: Optional[str] = None
    meta_data: Optional[Dict[str, Any]] = None
    created_at: datetime
    read_at: Optional[datetime] = None


class NotificationListResponse(BaseModel):
    """Wrapper list dengan metadata pagination ringan."""
    total: int = Field(..., description="Total notifikasi (sesuai filter)")
    unread_count: int = Field(..., description="Jumlah notifikasi belum dibaca milik user")
    items: list[NotificationRead]
