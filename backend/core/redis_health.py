"""Redis reachability guard untuk dev environment.

Tujuan: kalau `REDIS_URL` tidak reachable saat `APP_ENV` non-production,
scheduler skip enqueue task ke Celery dan log warning sekali (bukan
tiap interval) supaya log dev tidak banjir.

Strategi:
- `is_redis_reachable()` membuka koneksi `redis.from_url` dengan timeout
  pendek, panggil `ping()` lalu close. Return bool.
- `should_skip_enqueue()` dipanggil dari scheduler trigger. Kalau
  production, selalu False (jangan skip — biarkan error muncul agar
  observability eksternal yang menangkap). Kalau dev dan ping fail,
  return True dan tulis warning sekali per session.
"""

from __future__ import annotations

import logging
from typing import Optional

from core.config import settings, PRODUCTION_ENV_VALUES

logger = logging.getLogger("RedisHealth")

_REDIS_PING_TIMEOUT_SECONDS = 1.0
_dev_warning_logged: bool = False

def is_redis_reachable(redis_url: Optional[str] = None) -> bool:
    """Ping Redis dengan timeout pendek. Return True kalau bisa connect."""
    target = redis_url if redis_url is not None else settings.REDIS_URL
    if not target:
        return False
    try:
        import redis  # type: ignore
    except Exception:  # pragma: no cover
        return False
    try:
        client = redis.from_url(
            target,
            socket_connect_timeout=_REDIS_PING_TIMEOUT_SECONDS,
            socket_timeout=_REDIS_PING_TIMEOUT_SECONDS,
        )
        try:
            return bool(client.ping())
        finally:
            try:
                client.close()
            except Exception:
                pass
    except Exception:
        return False

def is_production() -> bool:
    return settings.APP_ENV.strip().lower() in PRODUCTION_ENV_VALUES

def should_skip_enqueue() -> bool:
    """True kalau dev tanpa Redis (skip + warn-once); False kalau production."""
    global _dev_warning_logged
    if is_production():
        return False
    if is_redis_reachable():
        return False
    if not _dev_warning_logged:
        logger.warning(
            "[RedisHealth] REDIS_URL=%s tidak reachable di dev. "
            "Scheduler skip enqueue task ke Celery; warning ini hanya muncul sekali per session.",
            settings.REDIS_URL or "<empty>",
        )
        _dev_warning_logged = True
    return True

def reset_warning_state_for_test() -> None:
    """Pytest helper: reset memo agar test independen."""
    global _dev_warning_logged
    _dev_warning_logged = False

__all__ = [
    "is_production",
    "is_redis_reachable",
    "reset_warning_state_for_test",
    "should_skip_enqueue",
]
