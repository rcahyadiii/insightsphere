"""
Domain Notification — Service Layer.

Berisi seluruh business logic & data-access untuk notifikasi.
Router HANYA boleh memanggil method publik dari `NotificationService`.

Catatan arsitektur:
- Codebase saat ini memakai SQLAlchemy SYNC (`Session`), konsisten dgn domain lain.
- Bila nanti migrasi ke AsyncSession, hanya signature method ini yang berubah.
- Trigger Celery / WebSocket akan ditambahkan via TODO marker.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import List, Optional, Tuple
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from domains.notification.models import (
    Notification,
    NotificationCategory,
    NotificationPriority,
)
from domains.notification.schemas import NotificationCreate

logger = logging.getLogger(__name__)


class NotificationService:
    """Service object — stateless, di-instantiate per-request via dependency injection."""

    def __init__(self, db: Session) -> None:
        self.db = db

    # ============================================================
    # WRITE OPERATIONS
    # ============================================================

    def create_notification(self, payload: NotificationCreate) -> Notification:
        """
        Persist notifikasi baru ke database.

        Args:
            payload: Validated `NotificationCreate` schema.

        Returns:
            ORM `Notification` instance yang sudah ter-flush (memiliki id & timestamps).

        Side-effects:
            - INSERT row ke tabel `notifications`.
            - (Future) Akan trigger Celery task untuk push email / WebSocket broadcast.
        """
        notification = Notification(
            recipient_id=payload.recipient_id,
            category=payload.category,
            priority=payload.priority,
            title=payload.title,
            message=payload.message,
            action_link=payload.action_link,
            meta_data=payload.meta_data,
            is_read=False,
        )
        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)

        logger.info(
            "Notification created id=%s recipient=%s category=%s priority=%s",
            notification.id, notification.recipient_id,
            notification.category, notification.priority,
        )

        # TODO: Trigger Celery task here
        # contoh:
        #   from domains.notification.tasks import dispatch_notification_task
        #   dispatch_notification_task.delay(str(notification.id))
        # Task tersebut nantinya menangani:
        #   - Kirim email via SMTP (Phase 3 item #9)
        #   - Push WebSocket realtime (Phase 4 item #11)

        return notification

    def mark_as_read(self, notification_id: UUID, user_id: UUID) -> Notification:
        """
        Tandai notifikasi sebagai dibaca. Idempoten (aman dipanggil ulang).

        Args:
            notification_id: PK notifikasi.
            user_id: User yg melakukan aksi (harus = recipient_id, kecuali admin).

        Raises:
            HTTPException 404 jika notifikasi tidak ditemukan.
            HTTPException 403 jika bukan milik user.
        """
        notification = self.db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.deleted_at.is_(None),
        ).first()

        if notification is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found",
            )

        if notification.recipient_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot modify another user's notification",
            )

        # Idempoten — kalau sudah read, jangan overwrite read_at
        if not notification.is_read:
            notification.is_read = True
            notification.read_at = datetime.now(timezone.utc)
            self.db.commit()
            self.db.refresh(notification)

        return notification

    # ============================================================
    # READ OPERATIONS
    # ============================================================

    def get_user_notifications(
        self,
        user_id: UUID,
        is_read: Optional[bool] = None,
        category: Optional[NotificationCategory] = None,
        priority: Optional[NotificationPriority] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> Tuple[List[Notification], int, int]:
        """
        Ambil notifikasi milik user dengan pagination & filter opsional.

        Returns:
            Tuple `(items, total, unread_count)`:
              - `items`: page hasil sesuai filter, sorted by created_at DESC.
              - `total`: total row sesuai filter (untuk pagination UI).
              - `unread_count`: total notifikasi user yg belum dibaca (tanpa filter is_read).
        """
        base_query = self.db.query(Notification).filter(
            Notification.recipient_id == user_id,
            Notification.deleted_at.is_(None),
        )

        # Filter dinamis
        filtered = base_query
        if is_read is not None:
            filtered = filtered.filter(Notification.is_read == is_read)
        if category is not None:
            filtered = filtered.filter(Notification.category == category)
        if priority is not None:
            filtered = filtered.filter(Notification.priority == priority)

        total = filtered.count()
        unread_count = base_query.filter(Notification.is_read.is_(False)).count()

        items = (
            filtered
            .order_by(Notification.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

        return items, total, unread_count
