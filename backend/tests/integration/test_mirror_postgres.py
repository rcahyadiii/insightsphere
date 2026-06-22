"""Postgres-only behavior untuk Mirror Mode (real DB, tanpa Docker)."""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session


def _make_user(session: Session, role: str = "admin") -> uuid.UUID:
    user_id = uuid.uuid4()
    session.execute(
        text(
            """
            INSERT INTO users (id, username, pin_hash, role, full_name, is_active, two_factor_enabled, created_at, updated_at)
            VALUES (:id, :username, :pin_hash, :role, :full_name, true, false, now(), now())
            """
        ),
        {
            "id": str(user_id),
            "username": f"pytest_admin_{user_id.hex[:8]}",
            "pin_hash": "x",
            "role": role,
            "full_name": "Pytest Admin",
        },
    )
    session.commit()
    return user_id


def _start_session(session: Session, user_id: uuid.UUID, target: str) -> uuid.UUID:
    session_id = uuid.uuid4()
    now = datetime.now(timezone.utc)
    session.execute(
        text(
            """
            INSERT INTO mirror_sessions
                (id, actor_user_id, actor_role, target_role, started_at, expires_at)
            VALUES (:id, :actor, 'admin', :target, :started, :expires)
            """
        ),
        {
            "id": str(session_id),
            "actor": str(user_id),
            "target": target,
            "started": now,
            "expires": now + timedelta(minutes=30),
        },
    )
    session.commit()
    return session_id


def test_partial_unique_index_allows_only_one_active_session(pg_session: Session) -> None:
    user_id = _make_user(pg_session)
    _start_session(pg_session, user_id, "owner")

    with pytest.raises(IntegrityError):
        _start_session(pg_session, user_id, "cashier")
    pg_session.rollback()


def test_partial_unique_index_allows_after_session_ends(pg_session: Session) -> None:
    user_id = _make_user(pg_session)
    first = _start_session(pg_session, user_id, "owner")

    pg_session.execute(
        text(
            "UPDATE mirror_sessions SET ended_at = now(), end_reason = 'manual' WHERE id = :id"
        ),
        {"id": str(first)},
    )
    pg_session.commit()

    second = _start_session(pg_session, user_id, "cashier")
    assert second != first


def test_audit_event_jsonb_filter_matches_target_role(pg_session: Session) -> None:
    user_id = _make_user(pg_session)
    pg_session.execute(
        text(
            """
            INSERT INTO audit_events (event_type, event_data, timestamp)
            VALUES ('MIRROR_START', :payload, now())
            """
        ),
        {
            "payload": '{"actor_user_id": "'
            + str(user_id)
            + '", "target_role": "owner", "session_id": "'
            + uuid.uuid4().hex
            + '"}'
        },
    )
    pg_session.commit()

    rows = pg_session.execute(
        text(
            "SELECT event_data->>'target_role' AS target FROM audit_events "
            "WHERE event_type = 'MIRROR_START' AND event_data->>'target_role' = 'owner'"
        )
    ).all()
    assert any(row.target == "owner" for row in rows)