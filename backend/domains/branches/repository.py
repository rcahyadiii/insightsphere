"""Query helpers for operational branches."""

from typing import Optional
from uuid import UUID

from sqlalchemy import String, cast, or_
from sqlalchemy.orm import Session

from domains.branches.models import Branch
from domains.branches.schemas import BranchStatus


def get_branch_by_id(db: Session, branch_id: UUID) -> Optional[Branch]:
    return db.query(Branch).filter(Branch.id == branch_id).first()


def get_branch_by_store_nbr(db: Session, store_nbr: int) -> Optional[Branch]:
    return db.query(Branch).filter(Branch.store_nbr == store_nbr).first()


def get_branch_by_code(db: Session, branch_code: str) -> Optional[Branch]:
    return db.query(Branch).filter(Branch.branch_code == branch_code).first()


def list_branches(
    db: Session,
    *,
    status: BranchStatus = "active",
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    store_nbr: Optional[int] = None,
) -> list[Branch]:
    query = db.query(Branch)

    if store_nbr is not None:
        query = query.filter(Branch.store_nbr == store_nbr)

    if status == "active":
        query = query.filter(Branch.is_active.is_(True), Branch.deleted_at.is_(None))
    elif status == "inactive":
        query = query.filter(Branch.is_active.is_(False))

    if search:
        needle = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Branch.name.ilike(needle),
                Branch.branch_code.ilike(needle),
                cast(Branch.store_nbr, String).like(needle),
            )
        )

    return (
        query.order_by(Branch.is_active.desc(), Branch.store_nbr.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )
