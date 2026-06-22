"""Helper observability untuk Mode Cermin.

Future-work item dari `docs/Mirror Mode.md` §11:
- Monitoring alert kalau `MIRROR_BLOCKED` di production lewat threshold.
- Retention policy `audit_events` (default 90 hari rolling).

Helper di sini *pure query* (tidak commit) supaya gampang dipanggil dari
scheduler, route admin, atau script dev.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Iterable, Optional

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from domains.observability.models import AuditEvent
from domains.identity.mirror_service import (
    EVENT_MIRROR_BLOCKED,
    EVENT_MIRROR_START,
    EVENT_MIRROR_STOP,
)

DEFAULT_BLOCKED_WINDOW_MINUTES = 60
DEFAULT_BLOCKED_THRESHOLD = 25
DEFAULT_RETENTION_DAYS = 90
MIRROR_EVENT_TYPES: tuple[str, ...] = (
    EVENT_MIRROR_START,
    EVENT_MIRROR_STOP,
    EVENT_MIRROR_BLOCKED,
)

@dataclass(frozen=True)
class BlockedAlert:
    """Hasil cek `MIRROR_BLOCKED` melebihi threshold dalam window."""

    count: int
    threshold: int
    window_minutes: int
    since: datetime

    @property
    def triggered(self) -> bool:
        return self.count >= self.threshold

def count_recent_blocked(
    db: Session,
    *,
    window_minutes: int = DEFAULT_BLOCKED_WINDOW_MINUTES,
    now: Optional[datetime] = None,
) -> int:
    """Hitung event `MIRROR_BLOCKED` di window terakhir (default 60 menit)."""
    if window_minutes <= 0:
        raise ValueError("window_minutes harus > 0")
    reference = now or datetime.now(timezone.utc)
    since = reference - timedelta(minutes=window_minutes)
    stmt = select(func.count(AuditEvent.id)).where(
        AuditEvent.event_type == EVENT_MIRROR_BLOCKED,
        AuditEvent.timestamp >= since,
    )
    return int(db.execute(stmt).scalar_one())

def evaluate_blocked_alert(
    db: Session,
    *,
    window_minutes: int = DEFAULT_BLOCKED_WINDOW_MINUTES,
    threshold: int = DEFAULT_BLOCKED_THRESHOLD,
    now: Optional[datetime] = None,
) -> BlockedAlert:
    """Bandingkan jumlah `MIRROR_BLOCKED` baru-baru ini dengan threshold."""
    if threshold <= 0:
        raise ValueError("threshold harus > 0")
    reference = now or datetime.now(timezone.utc)
    since = reference - timedelta(minutes=window_minutes)
    count = count_recent_blocked(db, window_minutes=window_minutes, now=reference)
    return BlockedAlert(
        count=count,
        threshold=threshold,
        window_minutes=window_minutes,
        since=since,
    )

def find_audit_events_older_than(
    db: Session,
    *,
    retention_days: int = DEFAULT_RETENTION_DAYS,
    event_types: Optional[Iterable[str]] = None,
    now: Optional[datetime] = None,
) -> list[AuditEvent]:
    """List audit events di luar window retention (default 90 hari).

    Default scope hanya event Mode Cermin supaya helper ini aman dipanggil
    sebagai scheduled job tanpa risiko menyentuh event domain lain.
    Caller eksplisit boleh override `event_types`.
    """
    if retention_days <= 0:
        raise ValueError("retention_days harus > 0")
    reference = now or datetime.now(timezone.utc)
    cutoff = reference - timedelta(days=retention_days)
    types = tuple(event_types) if event_types is not None else MIRROR_EVENT_TYPES
    if not types:
        return []
    stmt = (
        select(AuditEvent)
        .where(
            AuditEvent.event_type.in_(types),
            AuditEvent.timestamp < cutoff,
        )
        .order_by(AuditEvent.timestamp.asc())
    )
    return list(db.execute(stmt).scalars().all())

__all__ = [
    "BlockedAlert",
    "DEFAULT_BLOCKED_THRESHOLD",
    "DEFAULT_BLOCKED_WINDOW_MINUTES",
    "DEFAULT_RETENTION_DAYS",
    "MIRROR_EVENT_TYPES",
    "count_recent_blocked",
    "evaluate_blocked_alert",
    "find_audit_events_older_than",
]
