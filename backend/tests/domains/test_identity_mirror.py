from datetime import datetime, timedelta, timezone
from uuid import UUID

from domains.identity.models import MirrorSession, User
from domains.observability.models import AuditEvent


def test_admin_can_start_read_and_stop_mirror_session(admin_client, db_session):
    start = admin_client.post(
        "/auth/mirror",
        json={"target_role": "owner"},
        headers={"User-Agent": "pytest-agent", "X-Forwarded-For": "203.0.113.10"},
    )

    assert start.status_code == 201
    payload = start.json()
    assert payload["actor_role"] == "admin"
    assert payload["target_role"] == "owner"

    active = admin_client.get("/auth/mirror")
    assert active.status_code == 200
    assert active.json()["id"] == payload["id"]

    audit_start = (
        db_session.query(AuditEvent)
        .filter(AuditEvent.event_type == "MIRROR_START")
        .one()
    )
    assert audit_start.event_data["target_role"] == "owner"
    assert audit_start.event_data["ip_address"] == "203.0.113.10"
    assert audit_start.event_data["user_agent"] == "pytest-agent"

    stop = admin_client.delete("/auth/mirror")
    assert stop.status_code == 204

    assert admin_client.get("/auth/mirror").json() is None
    session = db_session.query(MirrorSession).filter(MirrorSession.id == UUID(payload["id"])).one()
    assert session.ended_at is not None
    assert session.end_reason == "manual"

    audit_stop = (
        db_session.query(AuditEvent)
        .filter(AuditEvent.event_type == "MIRROR_STOP")
        .one()
    )
    assert audit_stop.event_data["end_reason"] == "manual"


def test_mirror_session_replaces_existing_active_session(admin_client, db_session):
    first = admin_client.post("/auth/mirror", json={"target_role": "owner"})
    assert first.status_code == 201

    second = admin_client.post("/auth/mirror", json={"target_role": "cashier"})
    assert second.status_code == 201

    sessions = db_session.query(MirrorSession).order_by(MirrorSession.started_at).all()
    assert len(sessions) == 2
    assert sessions[0].ended_at is not None
    assert sessions[0].end_reason == "manual"
    assert sessions[1].target_role == "cashier"
    assert sessions[1].ended_at is None

    event_types = [event.event_type for event in db_session.query(AuditEvent).all()]
    assert event_types.count("MIRROR_START") == 2
    assert event_types.count("MIRROR_STOP") == 1


def test_non_admin_cannot_start_mirror_session(regular_client):
    response = regular_client.post("/auth/mirror", json={"target_role": "owner"})
    assert response.status_code == 403


def test_expired_mirror_session_auto_stops(admin_client, db_session):
    admin = db_session.query(User).filter(User.username == "admin_test").one()
    expired = MirrorSession(
        actor_user_id=admin.id,
        actor_role="admin",
        target_role="owner",
        started_at=datetime.now(timezone.utc) - timedelta(hours=1),
        expires_at=datetime.now(timezone.utc) - timedelta(minutes=1),
    )
    db_session.add(expired)
    db_session.commit()

    response = admin_client.get("/auth/mirror")
    assert response.status_code == 200
    assert response.json() is None

    db_session.refresh(expired)
    assert expired.ended_at is not None
    assert expired.end_reason == "expired"
    audit = db_session.query(AuditEvent).filter(AuditEvent.event_type == "MIRROR_STOP").one()
    assert audit.event_data["end_reason"] == "expired"

def test_mirror_session_blocks_write_requests_but_allows_exit(admin_client):
    from datetime import timedelta
    from domains.identity.service import create_access_token

    token = create_access_token(
        data={"sub": "admin_test", "role": "admin", "store_nbr": None},
        expires_delta=timedelta(minutes=30),
    )
    headers = {"Authorization": f"Bearer {token}"}

    start = admin_client.post("/auth/mirror", json={"target_role": "owner"}, headers=headers)
    assert start.status_code == 201

    blocked = admin_client.patch(
        "/auth/me",
        json={"full_name": "Should Not Persist"},
        headers=headers,
    )
    assert blocked.status_code == 403
    assert blocked.json()["code"] == "MIRROR_READ_ONLY"
    assert blocked.json()["target_role"] == "owner"

    stop = admin_client.delete("/auth/mirror", headers=headers)
    assert stop.status_code == 204

    allowed_after_exit = admin_client.patch(
        "/auth/me",
        json={"full_name": "Allowed After Exit"},
        headers=headers,
    )
    assert allowed_after_exit.status_code == 200
    assert allowed_after_exit.json()["full_name"] == "Allowed After Exit"

def test_blocked_write_records_mirror_blocked_audit(admin_client, db_session):
    from datetime import timedelta
    from domains.identity.service import create_access_token

    token = create_access_token(
        data={"sub": "admin_test", "role": "admin", "store_nbr": None},
        expires_delta=timedelta(minutes=30),
    )
    headers = {
        "Authorization": f"Bearer {token}",
        "User-Agent": "pytest-block-agent",
        "X-Forwarded-For": "203.0.113.55, 10.0.0.1",
    }

    start = admin_client.post("/auth/mirror", json={"target_role": "owner"}, headers=headers)
    assert start.status_code == 201

    blocked = admin_client.patch(
        "/auth/me",
        json={"full_name": "Blocked Mutation"},
        headers=headers,
    )
    assert blocked.status_code == 403
    assert blocked.json()["code"] == "MIRROR_READ_ONLY"

    audit_blocked = (
        db_session.query(AuditEvent)
        .filter(AuditEvent.event_type == "MIRROR_BLOCKED")
        .one()
    )
    data = audit_blocked.event_data
    assert data["method"] == "PATCH"
    assert data["path"] == "/auth/me"
    assert data["block_ip"] == "203.0.113.55"
    assert data["block_user_agent"] == "pytest-block-agent"
    assert data["target_role"] == "owner"
