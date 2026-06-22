"""Mirror Mode (Mode Cermin) — server-side session helpers.

Admin satu-satunya role yang boleh impersonate role lain. Setiap aktivasi
dan deaktivasi dicatat di tabel `mirror_sessions` plus `audit_events`
(event_type=MIRROR_START/MIRROR_STOP) untuk governance.

API:
  - get_active_session(db, user)
  - start_session(db, user, target_role, ip, user_agent)
  - end_session(db, user, reason="manual")
  - end_expired_session(db, session)

Constraints:
  - Hanya `admin` yang bisa start.
  - Target role harus salah satu dari `MIRROR_TARGET_ROLES` dan != admin.
  - Hanya satu sesi aktif per user (di-enforce DB unique partial index).
  - TTL default 30 menit (`MIRROR_SESSION_TTL_MINUTES`).
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID as UUIDType

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from domains.identity.constants import (
    ROLE_ADMIN,
    ROLE_CASHIER,
    ROLE_INVENTORY_MANAGER,
    ROLE_OWNER,
)
from domains.identity.models import MirrorSession, User
from domains.observability.models import AuditEvent

MIRROR_SESSION_TTL_MINUTES = 30
MIRROR_TARGET_ROLES: tuple[str, ...] = (
    ROLE_OWNER,
    ROLE_INVENTORY_MANAGER,
    ROLE_CASHIER,
)

EVENT_MIRROR_START = "MIRROR_START"
EVENT_MIRROR_STOP = "MIRROR_STOP"
EVENT_MIRROR_BLOCKED = "MIRROR_BLOCKED"

END_REASON_MANUAL = "manual"
END_REASON_EXPIRED = "expired"


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _record_audit(
    db: Session,
    *,
    event_type: str,
    actor: User,
    session: MirrorSession,
    extra: Optional[dict] = None,
) -> None:
    payload: dict = {
        "actor_user_id": str(actor.id),
        "actor_username": actor.username,
        "actor_role": session.actor_role,
        "target_role": session.target_role,
        "session_id": str(session.id),
    }
    if session.ip_address:
        payload["ip_address"] = session.ip_address
    if session.user_agent:
        payload["user_agent"] = session.user_agent
    if extra:
        payload.update(extra)

    db.add(
        AuditEvent(
            store_nbr=actor.store_nbr,
            event_type=event_type,
            event_data=payload,
        )
    )


def _serialize(session: MirrorSession) -> dict:
    return {
        "id": str(session.id),
        "actor_user_id": str(session.actor_user_id),
        "actor_role": session.actor_role,
        "target_role": session.target_role,
        "started_at": session.started_at.isoformat() if session.started_at else None,
        "expires_at": session.expires_at.isoformat() if session.expires_at else None,
    }


def _is_expired(session: MirrorSession) -> bool:
    expires = session.expires_at
    if expires is None:
        return False
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    return _now() >= expires


def get_active_session(db: Session, user: User) -> Optional[MirrorSession]:
    """Return active mirror session untuk user. Auto-end jika sudah expire."""
    session: Optional[MirrorSession] = (
        db.query(MirrorSession)
        .filter(MirrorSession.actor_user_id == user.id)
        .filter(MirrorSession.ended_at.is_(None))
        .one_or_none()
    )
    if session is None:
        return None
    if _is_expired(session):
        end_session_record(db, user=user, session=session, reason=END_REASON_EXPIRED)
        return None
    return session


def start_session(
    db: Session,
    *,
    user: User,
    target_role: str,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> MirrorSession:
    if user.role != ROLE_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hanya admin yang dapat mengaktifkan Mode Cermin",
        )
    if target_role not in MIRROR_TARGET_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"target_role tidak valid: {target_role}",
        )

    existing = get_active_session(db, user)
    if existing is not None:
        end_session_record(db, user=user, session=existing, reason=END_REASON_MANUAL)

    now = _now()
    session = MirrorSession(
        actor_user_id=user.id,
        actor_role=user.role,
        target_role=target_role,
        started_at=now,
        expires_at=now + timedelta(minutes=MIRROR_SESSION_TTL_MINUTES),
        ip_address=ip_address,
        user_agent=user_agent,
    )
    db.add(session)
    db.flush()  # need session.id for audit
    _record_audit(db, event_type=EVENT_MIRROR_START, actor=user, session=session)
    db.commit()
    db.refresh(session)
    return session


def end_session_record(
    db: Session,
    *,
    user: User,
    session: MirrorSession,
    reason: str = END_REASON_MANUAL,
) -> MirrorSession:
    if session.ended_at is not None:
        return session
    session.ended_at = _now()
    session.end_reason = reason
    _record_audit(
        db,
        event_type=EVENT_MIRROR_STOP,
        actor=user,
        session=session,
        extra={"end_reason": reason},
    )
    db.commit()
    db.refresh(session)
    return session


def end_active_session(
    db: Session,
    *,
    user: User,
    reason: str = END_REASON_MANUAL,
) -> Optional[MirrorSession]:
    session = (
        db.query(MirrorSession)
        .filter(MirrorSession.actor_user_id == user.id)
        .filter(MirrorSession.ended_at.is_(None))
        .one_or_none()
    )
    if session is None:
        return None
    return end_session_record(db, user=user, session=session, reason=reason)


def serialize(session: Optional[MirrorSession]) -> Optional[dict]:
    return _serialize(session) if session else None


def record_block_audit(
    db: Session,
    *,
    user: User,
    session: MirrorSession,
    method: str,
    path: str,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> None:
    """Catat upaya write yang diblokir saat Mode Cermin aktif."""
    extra = {
        "method": method,
        "path": path,
        "block_ip": ip_address,
        "block_user_agent": user_agent,
    }
    _record_audit(
        db,
        event_type=EVENT_MIRROR_BLOCKED,
        actor=user,
        session=session,
        extra=extra,
    )
    db.commit()


__all__ = [
    "EVENT_MIRROR_BLOCKED",
    "EVENT_MIRROR_START",
    "EVENT_MIRROR_STOP",
    "END_REASON_EXPIRED",
    "END_REASON_MANUAL",
    "MIRROR_SESSION_TTL_MINUTES",
    "MIRROR_TARGET_ROLES",
    "end_active_session",
    "end_session_record",
    "get_active_session",
    "record_block_audit",
    "serialize",
    "start_session",
]