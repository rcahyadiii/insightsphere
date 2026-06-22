"""Domain Branches - operational branch master data."""

from sqlalchemy import Boolean, Column, Index, Integer, String, Text, Time, UniqueConstraint

from core.base_model import AbstractBase


class Branch(AbstractBase):
    """Operational branch managed by InsightSphere users.

    This is separate from dataset `stores`, which remains read-only legacy data.
    `store_nbr` is kept as a compatibility key for existing branch-scoped flows.
    """

    __tablename__ = "branches"

    store_nbr = Column(Integer, nullable=False, index=True)
    branch_code = Column(String(50), nullable=False, index=True)
    name = Column(String(150), nullable=False, index=True)
    address = Column(Text, nullable=False)
    phone = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    opening_time = Column(Time, nullable=True)
    closing_time = Column(Time, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True, index=True)

    __table_args__ = (
        UniqueConstraint("store_nbr", name="uq_branches_store_nbr"),
        UniqueConstraint("branch_code", name="uq_branches_branch_code"),
        Index("ix_branches_active_store", "is_active", "store_nbr"),
    )
