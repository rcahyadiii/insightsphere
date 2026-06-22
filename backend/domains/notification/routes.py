"""
Domain Notification — HTTP Router.

Endpoint:
    GET    /notifications              List notifikasi milik user yg login
    PATCH  /notifications/{id}/read    Mark single notifikasi as read
    POST   /notifications/test-trigger Admin-only: kirim notif manual (debug/dev)
"""
from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import get_current_user, require_roles
from domains.identity.constants import ROLE_ADMIN
from domains.identity.models import User
from domains.notification.models import NotificationCategory, NotificationPriority
from domains.notification.schemas import (
    NotificationCreate,
    NotificationRead,
    NotificationListResponse,
)
from domains.notification.service import NotificationService

router = APIRouter(prefix="/notifications", tags=["Notifications"])


# ============================================================
# DEPENDENCY — service factory (DI) untuk hindari circular import
# ============================================================

def get_notification_service(db: Session = Depends(get_db)) -> NotificationService:
    """Factory: membuat NotificationService per-request dgn Session yg sudah dikelola."""
    return NotificationService(db)


# ============================================================
# ENDPOINTS
# ============================================================

@router.get(
    "",
    response_model=NotificationListResponse,
    summary="List notifikasi milik user yang sedang login",
)
def list_my_notifications(
    is_read: Optional[bool] = Query(None, description="Filter status baca (true/false)"),
    category: Optional[NotificationCategory] = Query(None, description="Filter kategori"),
    priority: Optional[NotificationPriority] = Query(None, description="Filter prioritas"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    service: NotificationService = Depends(get_notification_service),
):
    items, total, unread_count = service.get_user_notifications(
        user_id=current_user.id,
        is_read=is_read,
        category=category,
        priority=priority,
        skip=skip,
        limit=limit,
    )
    return NotificationListResponse(
        total=total,
        unread_count=unread_count,
        items=[NotificationRead.model_validate(n) for n in items],
    )


@router.patch(
    "/{notification_id}/read",
    response_model=NotificationRead,
    summary="Tandai notifikasi sebagai sudah dibaca",
)
def mark_notification_read(
    notification_id: UUID,
    current_user: User = Depends(get_current_user),
    service: NotificationService = Depends(get_notification_service),
):
    notification = service.mark_as_read(
        notification_id=notification_id,
        user_id=current_user.id,
    )
    return NotificationRead.model_validate(notification)


@router.post(
    "/test-trigger",
    response_model=NotificationRead,
    status_code=status.HTTP_201_CREATED,
    summary="[ADMIN] Trigger notifikasi manual untuk testing",
    dependencies=[Depends(require_roles([ROLE_ADMIN]))],
)
def test_trigger_notification(
    payload: NotificationCreate,
    service: NotificationService = Depends(get_notification_service),
):
    """
    Endpoint debug/dev untuk men-trigger notifikasi manual.
    Hanya role `admin` yang bisa mengakses.

    Catatan: `recipient_id` di payload harus UUID user yg valid.
    """
    notification = service.create_notification(payload)
    return NotificationRead.model_validate(notification)
