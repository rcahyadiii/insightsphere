"""Business logic for operational branch management."""

from datetime import datetime, time, timezone
from typing import Any, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from domains.branches import repository as branch_repo
from domains.branches.models import Branch
from domains.branches.schemas import BranchCreate, BranchStatus, BranchUpdate
from domains.identity.constants import ADMIN_OWNER_ROLES, STORE_SCOPED_ROLES
from domains.identity.models import User
from domains.observability.models import AuditEvent


class BranchNotFoundError(ValueError):
    pass


class BranchConflictError(ValueError):
    def __init__(self, detail: Any):
        super().__init__(str(detail))
        self.detail = detail


class BranchForbiddenError(ValueError):
    pass


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _as_json(value: Any) -> Any:
    if value is None or isinstance(value, (bool, int, float, str)):
        return value
    if isinstance(value, (datetime, time)):
        return value.isoformat()
    return str(value)


def _actor_id(actor: User) -> Optional[str]:
    return str(actor.id) if getattr(actor, "id", None) else None


def _record_audit(
    db: Session,
    *,
    branch: Branch,
    actor: User,
    event_type: str,
    changed_fields: dict[str, dict[str, Any]],
) -> None:
    db.add(
        AuditEvent(
            store_nbr=None,
            event_type=event_type,
            event_data={
                "branch_id": str(branch.id),
                "branch_store_nbr": branch.store_nbr,
                "actor_user_id": _actor_id(actor),
                "changed_fields": changed_fields,
            },
        )
    )


def _require_mutation_role(actor: User) -> None:
    if actor.role not in ADMIN_OWNER_ROLES:
        raise BranchForbiddenError("Requires owner or admin privileges")


def _payload_store_nbr(payload: dict[str, Any]) -> Optional[int]:
    value = payload.get("store_nbr")
    if value is None:
        return None
    return int(value)


def _scope_store_nbr(payload: dict[str, Any]) -> Optional[int]:
    role = payload.get("role")
    if role in ADMIN_OWNER_ROLES:
        return None
    if role in STORE_SCOPED_ROLES:
        store_nbr = _payload_store_nbr(payload)
        if store_nbr is None:
            raise BranchForbiddenError("Store-scoped user has no branch assignment")
        return store_nbr
    raise BranchForbiddenError("Operation not permitted for this role")


def _check_unique_store_nbr(
    db: Session,
    *,
    store_nbr: int,
    exclude_branch_id: Optional[UUID] = None,
) -> None:
    existing = branch_repo.get_branch_by_store_nbr(db, store_nbr)
    if existing and existing.id != exclude_branch_id:
        raise BranchConflictError(
            {
                "code": "BRANCH_STORE_NBR_EXISTS",
                "message": "store_nbr already exists",
                "store_nbr": store_nbr,
            }
        )


def _check_unique_branch_code(
    db: Session,
    *,
    branch_code: str,
    exclude_branch_id: Optional[UUID] = None,
) -> None:
    existing = branch_repo.get_branch_by_code(db, branch_code)
    if existing and existing.id != exclude_branch_id:
        raise BranchConflictError(
            {
                "code": "BRANCH_CODE_EXISTS",
                "message": "branch_code already exists",
                "branch_code": branch_code,
            }
        )


def _active_user_count(db: Session, store_nbr: int) -> int:
    return (
        db.query(User)
        .filter(User.store_nbr == store_nbr, User.is_active.is_(True))
        .count()
    )


def _changed_fields_for_create(payload: BranchCreate) -> dict[str, dict[str, Any]]:
    return {
        key: {"old": None, "new": _as_json(value)}
        for key, value in payload.model_dump().items()
    }


def _changed_fields_for_update(
    branch: Branch,
    values: dict[str, Any],
) -> dict[str, dict[str, Any]]:
    changed: dict[str, dict[str, Any]] = {}
    for key, new_value in values.items():
        old_value = getattr(branch, key)
        if _as_json(old_value) != _as_json(new_value):
            changed[key] = {"old": _as_json(old_value), "new": _as_json(new_value)}
    return changed


def list_branches(
    db: Session,
    *,
    payload: dict[str, Any],
    status: BranchStatus = "active",
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
) -> list[Branch]:
    return branch_repo.list_branches(
        db,
        status=status,
        search=search,
        skip=skip,
        limit=limit,
        store_nbr=_scope_store_nbr(payload),
    )


def get_branch(db: Session, *, branch_id: UUID, payload: dict[str, Any]) -> Branch:
    branch = branch_repo.get_branch_by_id(db, branch_id)
    if not branch:
        raise BranchNotFoundError("Branch not found")

    scoped_store_nbr = _scope_store_nbr(payload)
    if scoped_store_nbr is not None:
        if branch.store_nbr != scoped_store_nbr or not branch.is_active:
            raise BranchForbiddenError("Branch is outside the user's scope")

    return branch


def create_branch(db: Session, *, payload: BranchCreate, actor: User) -> Branch:
    _require_mutation_role(actor)
    _check_unique_store_nbr(db, store_nbr=payload.store_nbr)
    _check_unique_branch_code(db, branch_code=payload.branch_code)

    branch = Branch(**payload.model_dump())
    db.add(branch)
    db.flush()
    _record_audit(
        db,
        branch=branch,
        actor=actor,
        event_type="BRANCH_CREATED",
        changed_fields=_changed_fields_for_create(payload),
    )
    db.commit()
    db.refresh(branch)
    return branch


def update_branch(
    db: Session,
    *,
    branch_id: UUID,
    payload: BranchUpdate,
    actor: User,
) -> Branch:
    _require_mutation_role(actor)
    branch = branch_repo.get_branch_by_id(db, branch_id)
    if not branch:
        raise BranchNotFoundError("Branch not found")

    values = payload.model_dump(exclude_unset=True)
    if not values:
        return branch

    if values.get("store_nbr") is not None:
        _check_unique_store_nbr(
            db,
            store_nbr=values["store_nbr"],
            exclude_branch_id=branch.id,
        )
    if values.get("branch_code") is not None:
        _check_unique_branch_code(
            db,
            branch_code=values["branch_code"],
            exclude_branch_id=branch.id,
        )

    if values.get("is_active") is False and branch.is_active:
        return deactivate_branch(db, branch_id=branch.id, actor=actor)

    if values.get("is_active") is True and not branch.is_active:
        values["deleted_at"] = None

    changed_fields = _changed_fields_for_update(branch, values)
    for key, value in values.items():
        setattr(branch, key, value)

    if changed_fields:
        event_type = "BRANCH_REACTIVATED" if values.get("is_active") is True else "BRANCH_UPDATED"
        _record_audit(
            db,
            branch=branch,
            actor=actor,
            event_type=event_type,
            changed_fields=changed_fields,
        )
        db.commit()
        db.refresh(branch)

    return branch


def deactivate_branch(db: Session, *, branch_id: UUID, actor: User) -> Branch:
    _require_mutation_role(actor)
    branch = branch_repo.get_branch_by_id(db, branch_id)
    if not branch:
        raise BranchNotFoundError("Branch not found")

    if not branch.is_active:
        return branch

    active_users = _active_user_count(db, branch.store_nbr)
    if active_users:
        raise BranchConflictError(
            {
                "code": "BRANCH_HAS_ACTIVE_USERS",
                "message": "Branch has active users",
                "active_user_count": active_users,
            }
        )

    now = _utc_now()
    changed_fields = {
        "is_active": {"old": True, "new": False},
        "deleted_at": {"old": _as_json(branch.deleted_at), "new": _as_json(now)},
    }
    branch.is_active = False
    branch.deleted_at = now
    _record_audit(
        db,
        branch=branch,
        actor=actor,
        event_type="BRANCH_DEACTIVATED",
        changed_fields=changed_fields,
    )
    db.commit()
    db.refresh(branch)
    return branch
