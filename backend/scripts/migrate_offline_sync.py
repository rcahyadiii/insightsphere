"""
Migration: Add columns for offline sync support
- transactions.client_txn_id (VARCHAR(64), UNIQUE, NULLABLE)

Dijalankan sekali saja. Idempotent: aman di-run ulang.
Usage:
    .venv\\Scripts\\python.exe backend\\migrate_offline_sync.py
"""
import sys
from pathlib import Path

# Tambahkan parent folder ke path supaya bisa import core
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import text
from core.database import engine


def column_exists(connection, table_name: str, column_name: str) -> bool:
    """Cek apakah kolom sudah ada di tabel (idempotent)."""
    result = connection.execute(
        text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = :table AND column_name = :column
        """),
        {"table": table_name, "column": column_name},
    )
    return result.fetchone() is not None


def index_exists(connection, index_name: str) -> bool:
    """Cek apakah index sudah ada (idempotent)."""
    result = connection.execute(
        text("SELECT indexname FROM pg_indexes WHERE indexname = :name"),
        {"name": index_name},
    )
    return result.fetchone() is not None


def run_migration():
    print("=" * 60)
    print("Migration: Add client_txn_id for offline sync idempotency")
    print("=" * 60)

    with engine.begin() as conn:
        # 1. Tambah kolom client_txn_id kalau belum ada
        if column_exists(conn, "transactions", "client_txn_id"):
            print("[SKIP] Column 'transactions.client_txn_id' already exists")
        else:
            conn.execute(
                text("""
                    ALTER TABLE transactions
                    ADD COLUMN client_txn_id VARCHAR(64)
                """)
            )
            print("[OK] Added column 'transactions.client_txn_id'")

        # 2. Buat unique index (UNIQUE + partial: hanya non-null)
        if index_exists(conn, "ix_transactions_client_txn_id"):
            print("[SKIP] Index 'ix_transactions_client_txn_id' already exists")
        else:
            conn.execute(
                text("""
                    CREATE UNIQUE INDEX ix_transactions_client_txn_id
                    ON transactions (client_txn_id)
                    WHERE client_txn_id IS NOT NULL
                """)
            )
            print("[OK] Created unique partial index on client_txn_id")

    print("=" * 60)
    print("Migration completed successfully!")
    print("=" * 60)


if __name__ == "__main__":
    try:
        run_migration()
    except Exception as e:
        print(f"[ERROR] Migration failed: {e}")
        sys.exit(1)
