"""DB health monitor — periodic SELECT 1 + audit fail event."""

from __future__ import annotations

import logging

from sqlalchemy import text

from core.database import SessionLocal
from domains.observability.models import AuditEvent

EVENT_DB_HEALTH_FAIL = "DB_HEALTH_FAIL"

logger = logging.getLogger("SystemHealth.DB")


def db_healthcheck_tick() -> None:
    """Coba SELECT 1. Kalau gagal, tulis AuditEvent dan log."""
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        return
    except Exception as exc:  # pragma: no cover - log path saja
        logger.error("DB healthcheck failed: %s", exc)
        try:
            audit = AuditEvent(
                store_nbr=None,
                event_type=EVENT_DB_HEALTH_FAIL,
                event_data={"error": str(exc)[:500]},
            )
            db.add(audit)
            db.commit()
        except Exception as audit_exc:  # pragma: no cover
            logger.error("Failed to record DB_HEALTH_FAIL audit: %s", audit_exc)
            db.rollback()
    finally:
        db.close()


__all__ = ["EVENT_DB_HEALTH_FAIL", "db_healthcheck_tick"]