"""Add mirror sessions for server-side Mode Cermin

Revision ID: c3d4e5f6a7b8
Revises: b2f9c1a3d4e5
Create Date: 2026-05-19 14:45:00.000000
"""
from typing import Sequence, Union

from alembic import op

revision: str = "c3d4e5f6a7b8"
down_revision: Union[str, Sequence[str], None] = "b2f9c1a3d4e5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS mirror_sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            actor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            actor_role VARCHAR(50) NOT NULL,
            target_role VARCHAR(50) NOT NULL,
            started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            expires_at TIMESTAMPTZ NOT NULL,
            ended_at TIMESTAMPTZ,
            end_reason VARCHAR(32),
            ip_address VARCHAR(45),
            user_agent TEXT
        )
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_mirror_sessions_actor_user_id ON mirror_sessions (actor_user_id)")
    op.execute(
        """
        CREATE UNIQUE INDEX IF NOT EXISTS ix_mirror_sessions_actor_active
        ON mirror_sessions (actor_user_id)
        WHERE ended_at IS NULL
        """
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_mirror_sessions_actor_active")
    op.execute("DROP INDEX IF EXISTS ix_mirror_sessions_actor_user_id")
    op.execute("DROP TABLE IF EXISTS mirror_sessions")