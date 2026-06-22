"""Create operational branches table

Revision ID: e5f6a7b8c9d0
Revises: c3d4e5f6a7b8
Create Date: 2026-06-15 11:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "e5f6a7b8c9d0"
down_revision: Union[str, Sequence[str], None] = "c3d4e5f6a7b8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    has_branches = inspector.has_table("branches")

    if not has_branches:
        op.create_table(
            "branches",
            sa.Column(
                "id",
                postgresql.UUID(as_uuid=True),
                primary_key=True,
                server_default=sa.text("gen_random_uuid()"),
                nullable=False,
            ),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("store_nbr", sa.Integer(), nullable=False),
            sa.Column("branch_code", sa.String(length=50), nullable=False),
            sa.Column("name", sa.String(length=150), nullable=False),
            sa.Column("address", sa.Text(), nullable=False),
            sa.Column("phone", sa.String(length=50), nullable=True),
            sa.Column("email", sa.String(length=255), nullable=True),
            sa.Column("opening_time", sa.Time(), nullable=True),
            sa.Column("closing_time", sa.Time(), nullable=True),
            sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
            sa.UniqueConstraint("store_nbr", name="uq_branches_store_nbr"),
            sa.UniqueConstraint("branch_code", name="uq_branches_branch_code"),
        )

    existing_indexes = {
        index["name"]
        for index in sa.inspect(op.get_bind()).get_indexes("branches")
    }
    if op.f("ix_branches_store_nbr") not in existing_indexes:
        op.create_index(op.f("ix_branches_store_nbr"), "branches", ["store_nbr"], unique=False)
    if op.f("ix_branches_branch_code") not in existing_indexes:
        op.create_index(op.f("ix_branches_branch_code"), "branches", ["branch_code"], unique=False)
    if op.f("ix_branches_name") not in existing_indexes:
        op.create_index(op.f("ix_branches_name"), "branches", ["name"], unique=False)
    if op.f("ix_branches_is_active") not in existing_indexes:
        op.create_index(op.f("ix_branches_is_active"), "branches", ["is_active"], unique=False)
    if "ix_branches_active_store" not in existing_indexes:
        op.create_index("ix_branches_active_store", "branches", ["is_active", "store_nbr"], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if not inspector.has_table("branches"):
        return

    existing_indexes = {index["name"] for index in inspector.get_indexes("branches")}
    if "ix_branches_active_store" in existing_indexes:
        op.drop_index("ix_branches_active_store", table_name="branches")
    if op.f("ix_branches_is_active") in existing_indexes:
        op.drop_index(op.f("ix_branches_is_active"), table_name="branches")
    if op.f("ix_branches_name") in existing_indexes:
        op.drop_index(op.f("ix_branches_name"), table_name="branches")
    if op.f("ix_branches_branch_code") in existing_indexes:
        op.drop_index(op.f("ix_branches_branch_code"), table_name="branches")
    if op.f("ix_branches_store_nbr") in existing_indexes:
        op.drop_index(op.f("ix_branches_store_nbr"), table_name="branches")
    op.drop_table("branches")
