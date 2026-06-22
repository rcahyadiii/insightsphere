"""Development-only script to recreate the AI prediction log table."""

from __future__ import annotations

from core.database import engine
from domains.intelligence.models import AIPredictionLog
from scripts.dev.dev_script_guard import require_development_env


def main() -> None:
    require_development_env("recreate_prediction_log_table")

    AIPredictionLog.__table__.drop(engine, checkfirst=True)
    AIPredictionLog.__table__.create(engine, checkfirst=True)
    print("AIPredictionLog table dropped and recreated successfully with the current schema.")


if __name__ == "__main__":
    main()
