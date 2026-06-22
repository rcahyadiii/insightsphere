"""Phase 6: Redis dev guard tests.

Memastikan `should_skip_enqueue()` skip + warn-once saat dev tanpa Redis,
dan tidak skip saat production (biar error naik ke observability).
"""

from __future__ import annotations

import logging

import pytest

from core import redis_health

@pytest.fixture(autouse=True)
def _reset_redis_health_state():
    redis_health.reset_warning_state_for_test()
    yield
    redis_health.reset_warning_state_for_test()

def test_dev_skips_enqueue_and_warns_once_when_redis_unreachable(
    monkeypatch: pytest.MonkeyPatch,
    caplog: pytest.LogCaptureFixture,
) -> None:
    monkeypatch.setattr(redis_health.settings, "APP_ENV", "development")
    monkeypatch.setattr(redis_health, "is_redis_reachable", lambda *args, **kwargs: False)

    caplog.set_level(logging.WARNING, logger="RedisHealth")

    assert redis_health.should_skip_enqueue() is True
    assert redis_health.should_skip_enqueue() is True  # idempotent skip

    warnings = [r for r in caplog.records if r.name == "RedisHealth" and r.levelno == logging.WARNING]
    assert len(warnings) == 1, "warn-once: harus persis sekali per session"

def test_dev_does_not_skip_when_redis_reachable(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(redis_health.settings, "APP_ENV", "development")
    monkeypatch.setattr(redis_health, "is_redis_reachable", lambda *args, **kwargs: True)

    assert redis_health.should_skip_enqueue() is False

def test_production_never_skips_even_when_redis_unreachable(
    monkeypatch: pytest.MonkeyPatch,
    caplog: pytest.LogCaptureFixture,
) -> None:
    monkeypatch.setattr(redis_health.settings, "APP_ENV", "production")
    monkeypatch.setattr(redis_health, "is_redis_reachable", lambda *args, **kwargs: False)

    caplog.set_level(logging.WARNING, logger="RedisHealth")

    assert redis_health.should_skip_enqueue() is False
    warnings = [r for r in caplog.records if r.name == "RedisHealth" and r.levelno == logging.WARNING]
    assert warnings == [], "production tidak boleh log warning skip — error harus naik ke observability"
