"""Tests for `domains.identity.mirror_observability` (Phase 6 future-work)."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest

from domains.identity.mirror_observability import (
    DEFAULT_BLOCKED_THRESHOLD,
    DEFAULT_BLOCKED_WINDOW_MINUTES,
    DEFAULT_RETENTION_DAYS,
    MIRROR_EVENT_TYPES,
    count_recent_blocked,
    evaluate_blocked_alert,
    find_audit_events_older_than,
)
from domains.identity.mirror_service import (
    EVENT_MIRROR_BLOCKED,
    EVENT_MIRROR_START,
    EVENT_MIRROR_STOP,
)
from domains.observability.models import AuditEvent

NOW = datetime(2026, 5, 19, 12, 0, tzinfo=timezone.utc)

def _seed(db_session, *, event_type: str, minutes_ago: int = 0, days_ago: int = 0):
    timestamp = NOW - timedelta(minutes=minutes_ago, days=days_ago)
    db_session.add(AuditEvent(event_type=event_type, event_data={}, timestamp=timestamp))
    db_session.commit()

def test_count_recent_blocked_only_counts_window(db_session):
    _seed(db_session, event_type=EVENT_MIRROR_BLOCKED, minutes_ago=10)
    _seed(db_session, event_type=EVENT_MIRROR_BLOCKED, minutes_ago=30)
    _seed(db_session, event_type=EVENT_MIRROR_BLOCKED, minutes_ago=120)  # outside window
    _seed(db_session, event_type=EVENT_MIRROR_START, minutes_ago=5)  # different event type

    count = count_recent_blocked(db_session, window_minutes=60, now=NOW)
    assert count == 2

def test_count_recent_blocked_validates_window():
    with pytest.raises(ValueError):
        count_recent_blocked(None, window_minutes=0, now=NOW)  # type: ignore[arg-type]

def test_evaluate_blocked_alert_below_threshold(db_session):
    for minutes_ago in (5, 10, 15):
        _seed(db_session, event_type=EVENT_MIRROR_BLOCKED, minutes_ago=minutes_ago)

    alert = evaluate_blocked_alert(db_session, threshold=10, window_minutes=60, now=NOW)
    assert alert.count == 3
    assert alert.threshold == 10
    assert alert.window_minutes == 60
    assert alert.triggered is False

def test_evaluate_blocked_alert_triggered(db_session):
    for minutes_ago in range(0, 50, 2):
        _seed(db_session, event_type=EVENT_MIRROR_BLOCKED, minutes_ago=minutes_ago)

    alert = evaluate_blocked_alert(db_session, threshold=20, window_minutes=60, now=NOW)
    assert alert.count >= 20
    assert alert.triggered is True

def test_evaluate_blocked_alert_validates_threshold(db_session):
    with pytest.raises(ValueError):
        evaluate_blocked_alert(db_session, threshold=0, now=NOW)

def test_find_audit_events_older_than_default_scope(db_session):
    _seed(db_session, event_type=EVENT_MIRROR_START, days_ago=120)
    _seed(db_session, event_type=EVENT_MIRROR_STOP, days_ago=95)
    _seed(db_session, event_type=EVENT_MIRROR_BLOCKED, days_ago=10)  # within retention
    _seed(db_session, event_type="LOGIN_SUCCESS", days_ago=120)  # outside default scope

    stale = find_audit_events_older_than(db_session, retention_days=90, now=NOW)
    assert len(stale) == 2
    assert {ev.event_type for ev in stale} == {EVENT_MIRROR_START, EVENT_MIRROR_STOP}

def test_find_audit_events_older_than_custom_event_types(db_session):
    _seed(db_session, event_type="LOGIN_SUCCESS", days_ago=120)
    _seed(db_session, event_type=EVENT_MIRROR_START, days_ago=120)

    stale = find_audit_events_older_than(
        db_session,
        retention_days=90,
        event_types=("LOGIN_SUCCESS",),
        now=NOW,
    )
    assert {ev.event_type for ev in stale} == {"LOGIN_SUCCESS"}

def test_find_audit_events_older_than_validates_retention(db_session):
    with pytest.raises(ValueError):
        find_audit_events_older_than(db_session, retention_days=0, now=NOW)

def test_defaults_match_documented_thresholds():
    assert DEFAULT_BLOCKED_WINDOW_MINUTES == 60
    assert DEFAULT_BLOCKED_THRESHOLD == 25
    assert DEFAULT_RETENTION_DAYS == 90
    assert MIRROR_EVENT_TYPES == (
        EVENT_MIRROR_START,
        EVENT_MIRROR_STOP,
        EVENT_MIRROR_BLOCKED,
    )
