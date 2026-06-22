"""Initial migration

Revision ID: a155786af199
Revises: 
Create Date: 2026-04-19 04:21:16.891695

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'a155786af199'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _bootstrap_empty_database_if_needed() -> bool:
    """Return True and create all tables if the database is completely empty.

    On a fresh PostgreSQL database there are no application tables, so we
    skip the legacy pre-cleanup ALTER/DROP steps and create the full schema
    in one shot via SQLAlchemy metadata.  Existing databases (pre-Alembic)
    still have their tables and will take the legacy path below.
    """
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    application_tables = set(inspector.get_table_names()) - {"alembic_version"}
    if application_tables:
        return False

    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")

    from core.database import Base
    import domains.dataset.models  # noqa: F401
    import domains.observability.models  # noqa: F401
    import domains.identity.models  # noqa: F401
    import domains.sales.models  # noqa: F401
    import domains.finance.models  # noqa: F401
    import domains.intelligence.models  # noqa: F401
    import domains.inventory.models  # noqa: F401
    import domains.notification.models  # noqa: F401
    import domains.reporting.models  # noqa: F401
    import domains.branches.models  # noqa: F401

    Base.metadata.create_all(bind=bind)
    return True


def upgrade() -> None:
    """Upgrade schema."""
    # Fresh-empty database: create all tables in one shot and skip legacy cleanup.
    if _bootstrap_empty_database_if_needed():
        return

    # --- 1. PRE-CLEANUP: Hapus constraint yang menghalangi dropping/altering ---
    op.execute("ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_branch_id_fkey")
    op.execute("ALTER TABLE ai_prediction_logs DROP CONSTRAINT IF EXISTS ai_prediction_logs_store_nbr_fkey")
    
    # --- 2. DATA CONSISTENCY: Bersihkan data yang akan melanggar FK baru ---
    op.execute("DELETE FROM transactions WHERE cashier_id NOT IN (SELECT id FROM users)")
    op.execute("DELETE FROM petty_cash_transactions WHERE cash_session_id IN (SELECT id FROM cash_sessions WHERE cashier_id NOT IN (SELECT id FROM users))")
    op.execute("DELETE FROM cash_sessions WHERE cashier_id NOT IN (SELECT id FROM users)")
    
    # Isi nilai default untuk kolom yang akan diubah menjadi NOT NULL di tabel products
    op.execute("UPDATE products SET sku = substring(id::text, 1, 10) WHERE sku IS NULL")
    op.execute("UPDATE products SET family = 'UNKNOWN' WHERE family IS NULL")
    op.execute("UPDATE products SET category = 'General' WHERE category IS NULL")
    op.execute("UPDATE products SET unit = 'pcs' WHERE unit IS NULL")
    op.execute("UPDATE products SET base_price = 0.0 WHERE base_price IS NULL")
    op.execute("UPDATE products SET cost_price = 0.0 WHERE cost_price IS NULL")
    op.execute("UPDATE products SET is_active = true WHERE is_active IS NULL")

    # --- 3. DROP TABLES & INDICES ---
    op.drop_index(op.f('ix_branches_id'), table_name='branches')
    op.drop_index(op.f('ix_branches_name'), table_name='branches')
    op.drop_table('branches')
    
    # --- 4. ALTER TABLES ---
    
    # Identity / User related
    op.alter_column('users', 'is_active',
               existing_type=sa.VARCHAR(),
               type_=sa.Boolean(),
               postgresql_using="is_active::boolean",
               existing_nullable=True)
    op.alter_column('users', 'avatar_url',
               existing_type=sa.TEXT(),
               type_=sa.String(),
               existing_nullable=True)
    op.alter_column('users', 'two_factor_enabled',
               existing_type=sa.BOOLEAN(),
               nullable=False,
               existing_server_default=sa.text('false'))
    op.drop_index(op.f('ix_users_store_nbr'), table_name='users')
    op.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key")
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # Notifications
    op.alter_column('notifications', 'category',
               existing_type=sa.VARCHAR(length=6),
               type_=sa.Enum('SYSTEM', 'INVENTORY', 'SALES', 'AI_INSIGHT', name='notification_category', native_enum=False),
               existing_nullable=False)
    op.alter_column('notifications', 'meta_data',
               existing_type=postgresql.JSONB(astext_type=sa.Text()),
               type_=sa.JSON(),
               existing_nullable=True)
    op.drop_index(op.f('ix_notifications_category'), table_name='notifications')
    op.drop_index(op.f('ix_notifications_priority'), table_name='notifications')
    op.drop_index(op.f('ix_notifications_recipient_unread'), table_name='notifications')

    # Products
    op.alter_column('products', 'sku', existing_type=sa.VARCHAR(), nullable=False)
    op.alter_column('products', 'family', existing_type=sa.VARCHAR(length=50), nullable=False)
    op.alter_column('products', 'category', existing_type=sa.VARCHAR(), nullable=False)
    op.alter_column('products', 'unit', existing_type=sa.VARCHAR(length=20), nullable=False)
    op.alter_column('products', 'base_price', existing_type=sa.FLOAT(), nullable=False)
    op.alter_column('products', 'cost_price', existing_type=sa.FLOAT(), nullable=False)
    op.alter_column('products', 'is_active', existing_type=sa.BOOLEAN(), nullable=False)
    
    op.drop_index(op.f('ix_products_name'), table_name='products')
    op.create_index(op.f('ix_products_name'), 'products', ['name'], unique=False)
    op.create_index('idx_product_family_category', 'products', ['family', 'category'], unique=False)
    op.create_index(op.f('ix_products_family'), 'products', ['family'], unique=False)
    op.create_index(op.f('ix_products_sku'), 'products', ['sku'], unique=True)

    # Transactions & Sessions
    op.create_foreign_key(None, 'cash_sessions', 'users', ['cashier_id'], ['id'])
    op.create_foreign_key(None, 'stock_movements', 'users', ['performed_by'], ['id'])
    
    op.execute("ALTER TABLE transaction_items DROP CONSTRAINT IF EXISTS uix_transaction_product")
    op.execute("DROP INDEX IF EXISTS idx_txn_branch_date")
    op.execute("ALTER TABLE transactions DROP CONSTRAINT IF EXISTS uix_branch_date_time")
    
    op.create_index(op.f('ix_transactions_cash_session_id'), 'transactions', ['cash_session_id'], unique=False)
    op.create_index(op.f('ix_transactions_cashier_id'), 'transactions', ['cashier_id'], unique=False)
    op.create_foreign_key(None, 'transactions', 'users', ['cashier_id'], ['id'])
    op.create_foreign_key(None, 'transactions', 'cash_sessions', ['cash_session_id'], ['id'])


def downgrade() -> None:
    """Downgrade schema."""
    pass
