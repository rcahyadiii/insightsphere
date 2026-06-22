"""Consolidate manual migrations: 2FA, tax, inventory version, offline sync

Revision ID: b2f9c1a3d4e5
Revises: a155786af199
Create Date: 2026-05-13 01:30:00.000000

Konsolidasi dari skrip migrasi manual yang sebelumnya berada di backend/scripts/:
  - migrate_2fa.py: tambah kolom 2FA pada users
  - migrate_add_tax_columns.py: tambah tax_rate & tax_amount pada transactions
  - migrate_inventory_version.py: tambah version pada inventory (optimistic locking)
  - migrate_offline_sync.py: tambah client_txn_id pada transactions (idempotency POS offline)

Semua operasi idempotent dengan ADD COLUMN IF NOT EXISTS / CREATE INDEX IF NOT EXISTS,
sehingga aman dijalankan ulang di environment yang sudah pernah menerapkan skrip manual.
"""
from typing import Sequence, Union

from alembic import op


revision: str = "b2f9c1a3d4e5"
down_revision: Union[str, Sequence[str], None] = "a155786af199"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 2FA columns on users
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE NOT NULL")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255)")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS backup_codes TEXT")

    # Tax columns on transactions
    op.execute("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS tax_rate FLOAT DEFAULT 0 NOT NULL")
    op.execute("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS tax_amount FLOAT DEFAULT 0 NOT NULL")

    # Optimistic locking version on inventory
    op.execute("ALTER TABLE inventory ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1 NOT NULL")
    op.execute("UPDATE inventory SET version = 1 WHERE version IS NULL")

    # Offline sync idempotency on transactions
    op.execute("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS client_txn_id VARCHAR(64)")
    op.execute(
        """
        CREATE UNIQUE INDEX IF NOT EXISTS ix_transactions_client_txn_id
        ON transactions (client_txn_id)
        WHERE client_txn_id IS NOT NULL
        """
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_transactions_client_txn_id")
    op.execute("ALTER TABLE transactions DROP COLUMN IF EXISTS client_txn_id")
    op.execute("ALTER TABLE inventory DROP COLUMN IF EXISTS version")
    op.execute("ALTER TABLE transactions DROP COLUMN IF EXISTS tax_amount")
    op.execute("ALTER TABLE transactions DROP COLUMN IF EXISTS tax_rate")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS backup_codes")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS two_factor_secret")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS two_factor_enabled")
