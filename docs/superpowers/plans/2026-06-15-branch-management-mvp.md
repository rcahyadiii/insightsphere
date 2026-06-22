# Branch Management MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build operational branch master management so owner/admin users can create, list, edit, deactivate, and reactivate branches from `Pengaturan > Informasi Toko`.

**Architecture:** Add a new backend `branches` domain and table while leaving legacy dataset `stores` untouched. The frontend keeps the existing settings tab but replaces the static store form with API-backed branch management UI. Audit events store branch details in `event_data` because `audit_events.store_nbr` still points to dataset `stores.store_nbr`.

**Tech Stack:** FastAPI, SQLAlchemy, Pydantic v2, Alembic, pytest, Next.js App Router, React, TypeScript strict mode, Tailwind token utilities, node:test static checks.

---

## Scope Check

Use the approved spec at `docs/superpowers/specs/2026-06-15-branch-management-mvp-design.md`.

This plan implements only scope A: master cabang. It does not import product CSV data, connect ML models, add forecast mapping, or migrate sales/dashboard/reporting/inventory flows away from legacy dataset `stores`.
1
## File Structure

Backend files:

- Create `backend/domains/branches/__init__.py`: package marker.
- Create `backend/domains/branches/models.py`: SQLAlchemy `Branch` model.
- Create `backend/domains/branches/schemas.py`: Pydantic schemas and request validation.
- Create `backend/domains/branches/repository.py`: query helpers.
- Create `backend/domains/branches/service.py`: business rules, uniqueness, soft deactivate/reactivate, audit.
- Create `backend/domains/branches/router.py`: FastAPI endpoints.
- Modify `backend/main.py`: import branch models and include branch router.
- Create `backend/alembic/versions/e5f6a7b8c9d0_create_operational_branches.py`: table migration.
- Create `backend/tests/domains/test_branches.py`: branch API/domain tests.

Frontend files:

- Create `frontend/src/app/lib/branch-client.ts`: typed branch API client.
- Modify `frontend/src/app/lib/api.ts`: support structured `detail.message` error bodies.
- Modify `frontend/src/app/components/settings/StoreSettingsPanel.tsx`: API-backed branch management panel.
- Create `frontend/src/app/components/settings/BranchFormModal.tsx`: create/edit dialog.
- Create `frontend/src/app/components/settings/BranchDeactivateDialog.tsx`: confirmation dialog.
- Modify `frontend/src/app/i18n.tsx`: branch-management copy in ID and EN dictionaries.
- Create `frontend/tests/branch-client.test.mjs`: static API client contract test.
- Create `frontend/tests/ui/branch-management-panel.test.mjs`: static UI/accessibility contract test.

Do not commit in this repository unless the user explicitly asks. Treat every "Commit" checkpoint below as a local review checkpoint only.

---

### Task 1: Backend Branch API Contract Tests

**Files:**
- Create: `backend/tests/domains/test_branches.py`
- Depends on existing fixtures in `backend/tests/conftest.py`

- [x] **Step 1: Write the failing backend branch tests**

Create `backend/tests/domains/test_branches.py` with this content:

```python
import uuid

from core.security import get_current_user_payload
from domains.identity.models import User
from domains.observability.models import AuditEvent
from main import app


def _payload(
    store_nbr: int = 101,
    branch_code: str = "jkt-pst-01",
    name: str = "Jakarta Pusat 01",
):
    return {
        "store_nbr": store_nbr,
        "branch_code": branch_code,
        "name": name,
        "address": "Jl. Merdeka Barat No. 45, Gambir, Jakarta Pusat",
        "phone": "+62 812 0000 0000",
        "email": f"branch-{store_nbr}@example.com",
        "opening_time": "08:00:00",
        "closing_time": "21:00:00",
    }


def test_create_branch_admin_records_audit_event(admin_client, db_session):
    response = admin_client.post("/branches", json=_payload())

    assert response.status_code == 201, response.text
    data = response.json()
    assert data["store_nbr"] == 101
    assert data["branch_code"] == "JKT-PST-01"
    assert data["name"] == "Jakarta Pusat 01"
    assert data["is_active"] is True
    assert data["deleted_at"] is None

    audit = (
        db_session.query(AuditEvent)
        .filter(AuditEvent.event_type == "BRANCH_CREATED")
        .one()
    )
    assert audit.store_nbr is None
    assert audit.event_data["branch_store_nbr"] == 101
    assert audit.event_data["changed_fields"]["branch_code"]["new"] == "JKT-PST-01"


def test_create_branch_rejects_non_owner_admin(regular_client):
    response = regular_client.post("/branches", json=_payload(store_nbr=102))

    assert response.status_code == 403


def test_create_branch_rejects_duplicate_store_nbr(admin_client):
    first = admin_client.post("/branches", json=_payload(store_nbr=103, branch_code="JKT-BRT-01"))
    assert first.status_code == 201, first.text

    second = admin_client.post("/branches", json=_payload(store_nbr=103, branch_code="JKT-BRT-02"))

    assert second.status_code == 409
    assert "store_nbr" in second.text


def test_create_branch_rejects_duplicate_branch_code_after_normalization(admin_client):
    first = admin_client.post("/branches", json=_payload(store_nbr=104, branch_code="jkt-ut-01"))
    assert first.status_code == 201, first.text

    second = admin_client.post("/branches", json=_payload(store_nbr=105, branch_code=" JKT-UT-01 "))

    assert second.status_code == 409
    assert "branch_code" in second.text


def test_list_branches_filters_active_and_inactive(admin_client):
    active = admin_client.post("/branches", json=_payload(store_nbr=106, branch_code="JKT-SL-01"))
    inactive = admin_client.post("/branches", json=_payload(store_nbr=107, branch_code="JKT-SL-02"))
    assert active.status_code == 201, active.text
    assert inactive.status_code == 201, inactive.text

    inactive_id = inactive.json()["id"]
    delete_response = admin_client.delete(f"/branches/{inactive_id}")
    assert delete_response.status_code == 200, delete_response.text

    active_list = admin_client.get("/branches?status=active")
    assert active_list.status_code == 200, active_list.text
    assert {row["store_nbr"] for row in active_list.json()} == {106}

    inactive_list = admin_client.get("/branches?status=inactive")
    assert inactive_list.status_code == 200, inactive_list.text
    assert {row["store_nbr"] for row in inactive_list.json()} == {107}


def test_store_scoped_user_only_reads_own_active_branch(client, db_session):
    from domains.branches.models import Branch

    own = Branch(
        store_nbr=108,
        branch_code="JKT-OWN-01",
        name="Own Branch",
        address="Jakarta",
        is_active=True,
    )
    other = Branch(
        store_nbr=109,
        branch_code="JKT-OTH-01",
        name="Other Branch",
        address="Jakarta",
        is_active=True,
    )
    db_session.add_all([own, other])
    db_session.commit()

    def override_get_current_user_payload():
        return {
            "sub": "cashier_scope",
            "username": "cashier_scope",
            "role": "cashier",
            "store_nbr": 108,
        }

    app.dependency_overrides[get_current_user_payload] = override_get_current_user_payload
    try:
        response = client.get("/branches")
    finally:
        app.dependency_overrides.pop(get_current_user_payload, None)

    assert response.status_code == 200, response.text
    data = response.json()
    assert len(data) == 1
    assert data[0]["store_nbr"] == 108


def test_update_branch_records_changed_fields(admin_client, db_session):
    created = admin_client.post("/branches", json=_payload(store_nbr=110, branch_code="JKT-EDT-01"))
    assert created.status_code == 201, created.text

    branch_id = created.json()["id"]
    response = admin_client.patch(
        f"/branches/{branch_id}",
        json={"name": "Jakarta Edit 01", "phone": "+62 812 1111 1111"},
    )

    assert response.status_code == 200, response.text
    data = response.json()
    assert data["name"] == "Jakarta Edit 01"
    assert data["phone"] == "+62 812 1111 1111"

    audit = (
        db_session.query(AuditEvent)
        .filter(AuditEvent.event_type == "BRANCH_UPDATED")
        .one()
    )
    assert audit.event_data["branch_id"] == branch_id
    assert audit.event_data["changed_fields"]["name"]["old"] == "Jakarta Pusat 01"
    assert audit.event_data["changed_fields"]["name"]["new"] == "Jakarta Edit 01"


def test_deactivate_branch_is_blocked_when_active_users_exist(admin_client, db_session):
    created = admin_client.post("/branches", json=_payload(store_nbr=111, branch_code="JKT-BLK-01"))
    assert created.status_code == 201, created.text

    active_user = User(
        username=f"branch-user-{uuid.uuid4()}",
        email=f"branch-user-{uuid.uuid4()}@example.com",
        role="cashier",
        store_nbr=111,
        is_active=True,
        pin_hash="hashed",
    )
    db_session.add(active_user)
    db_session.commit()

    response = admin_client.delete(f"/branches/{created.json()['id']}")

    assert response.status_code == 409
    detail = response.json()["detail"]
    assert detail["code"] == "BRANCH_HAS_ACTIVE_USERS"
    assert detail["active_user_count"] == 1


def test_deactivate_and_reactivate_branch(admin_client):
    created = admin_client.post("/branches", json=_payload(store_nbr=112, branch_code="JKT-REA-01"))
    assert created.status_code == 201, created.text
    branch_id = created.json()["id"]

    deactivated = admin_client.delete(f"/branches/{branch_id}")
    assert deactivated.status_code == 200, deactivated.text
    assert deactivated.json()["is_active"] is False
    assert deactivated.json()["deleted_at"] is not None

    reactivated = admin_client.patch(f"/branches/{branch_id}", json={"is_active": True})
    assert reactivated.status_code == 200, reactivated.text
    assert reactivated.json()["is_active"] is True
    assert reactivated.json()["deleted_at"] is None
```

- [x] **Step 2: Run the failing branch tests**

Run from repository root:

```powershell
pytest backend/tests/domains/test_branches.py -q
```

Expected result before implementation: FAIL during import or first request because `domains.branches` and `/branches` do not exist.

- [x] **Step 3: Checkpoint**

Review the failing assertions and keep the test file. Do not commit unless the user explicitly asks.

---

### Task 2: Backend Branch Model and Schemas

**Files:**
- Create: `backend/domains/branches/__init__.py`
- Create: `backend/domains/branches/models.py`
- Create: `backend/domains/branches/schemas.py`

- [x] **Step 1: Create package marker**

Create `backend/domains/branches/__init__.py`:

```python
"""Operational branch master domain."""
```

- [x] **Step 2: Create the SQLAlchemy model**

Create `backend/domains/branches/models.py`:

```python
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
```

- [x] **Step 3: Create Pydantic schemas**

Create `backend/domains/branches/schemas.py`:

```python
"""Pydantic contracts for operational branch management."""

from datetime import datetime, time
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator


BranchStatus = Literal["active", "inactive", "all"]


def _strip_required(value: str) -> str:
    stripped = value.strip()
    if not stripped:
        raise ValueError("Field cannot be empty")
    return stripped


def _strip_optional(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None


class BranchCreate(BaseModel):
    store_nbr: int = Field(..., gt=0)
    branch_code: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=150)
    address: str = Field(..., min_length=1)
    phone: Optional[str] = Field(default=None, max_length=50)
    email: Optional[EmailStr] = None
    opening_time: Optional[time] = None
    closing_time: Optional[time] = None

    @field_validator("branch_code")
    @classmethod
    def normalize_branch_code(cls, value: str) -> str:
        return _strip_required(value).upper()

    @field_validator("name", "address")
    @classmethod
    def normalize_required_text(cls, value: str) -> str:
        return _strip_required(value)

    @field_validator("phone", mode="before")
    @classmethod
    def normalize_optional_phone(cls, value: Optional[str]) -> Optional[str]:
        return _strip_optional(value)

    @model_validator(mode="after")
    def validate_operating_hours(self):
        if self.opening_time is not None and self.closing_time is not None:
            if self.opening_time == self.closing_time:
                raise ValueError("opening_time and closing_time must be different")
        return self


class BranchUpdate(BaseModel):
    store_nbr: Optional[int] = Field(default=None, gt=0)
    branch_code: Optional[str] = Field(default=None, min_length=1, max_length=50)
    name: Optional[str] = Field(default=None, min_length=1, max_length=150)
    address: Optional[str] = Field(default=None, min_length=1)
    phone: Optional[str] = Field(default=None, max_length=50)
    email: Optional[EmailStr] = None
    opening_time: Optional[time] = None
    closing_time: Optional[time] = None
    is_active: Optional[bool] = None

    @field_validator("branch_code")
    @classmethod
    def normalize_branch_code(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        return _strip_required(value).upper()

    @field_validator("name", "address")
    @classmethod
    def normalize_required_text(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        return _strip_required(value)

    @field_validator("phone", mode="before")
    @classmethod
    def normalize_optional_phone(cls, value: Optional[str]) -> Optional[str]:
        return _strip_optional(value)

    @model_validator(mode="after")
    def validate_operating_hours(self):
        if self.opening_time is not None and self.closing_time is not None:
            if self.opening_time == self.closing_time:
                raise ValueError("opening_time and closing_time must be different")
        return self


class BranchResponse(BaseModel):
    id: UUID
    store_nbr: int
    branch_code: str
    name: str
    address: str
    phone: Optional[str]
    email: Optional[str]
    opening_time: Optional[time]
    closing_time: Optional[time]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)
```

- [x] **Step 4: Run the focused tests**

Run:

```powershell
pytest backend/tests/domains/test_branches.py -q
```

Expected result: still FAIL because repository, service, router, migration registration, and app registration are not implemented.

- [x] **Step 5: Checkpoint**

Review that model and schema names match the tests and spec. Do not commit unless the user explicitly asks.

---

### Task 3: Backend Repository, Service, Router, and App Registration

**Files:**
- Create: `backend/domains/branches/repository.py`
- Create: `backend/domains/branches/service.py`
- Create: `backend/domains/branches/router.py`
- Modify: `backend/main.py`
- Test: `backend/tests/domains/test_branches.py`

- [x] **Step 1: Create repository helpers**

Create `backend/domains/branches/repository.py`:

```python
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
```

- [x] **Step 2: Create service business rules**

Create `backend/domains/branches/service.py`:

```python
"""Business logic for operational branch management."""

from datetime import datetime, timezone
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


def _as_json(value):
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value)


def _changed_fields_from_payload(payload: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {key: {"old": None, "new": _as_json(value)} for key, value in payload.items()}


def _changed_fields_for_update(branch: Branch, updates: dict[str, Any]) -> dict[str, dict[str, Any]]:
    changed: dict[str, dict[str, Any]] = {}
    for key, new_value in updates.items():
        old_value = getattr(branch, key)
        if old_value != new_value:
            changed[key] = {"old": _as_json(old_value), "new": _as_json(new_value)}
    return changed


def _record_audit(
    db: Session,
    *,
    event_type: str,
    branch: Branch,
    actor: User,
    changed_fields: dict[str, dict[str, Any]],
) -> None:
    db.add(
        AuditEvent(
            store_nbr=None,
            event_type=event_type,
            event_data={
                "branch_id": str(branch.id),
                "branch_store_nbr": branch.store_nbr,
                "actor_user_id": str(actor.id),
                "changed_fields": changed_fields,
            },
        )
    )


def _require_mutation_role(actor: User) -> None:
    if actor.role not in ADMIN_OWNER_ROLES:
        raise BranchForbiddenError("Requires owner or admin privileges")


def _check_unique_store_nbr(db: Session, store_nbr: int, current_id: Optional[UUID] = None) -> None:
    existing = branch_repo.get_branch_by_store_nbr(db, store_nbr)
    if existing and existing.id != current_id:
        raise BranchConflictError(f"Branch with store_nbr {store_nbr} already exists")


def _check_unique_branch_code(db: Session, branch_code: str, current_id: Optional[UUID] = None) -> None:
    existing = branch_repo.get_branch_by_code(db, branch_code)
    if existing and existing.id != current_id:
        raise BranchConflictError(f"Branch with branch_code {branch_code} already exists")


def _active_user_count(db: Session, store_nbr: int) -> int:
    return (
        db.query(User)
        .filter(
            User.store_nbr == store_nbr,
            User.is_active.is_(True),
            User.deleted_at.is_(None),
        )
        .count()
    )


def list_branches(
    db: Session,
    *,
    status: BranchStatus,
    search: Optional[str],
    skip: int,
    limit: int,
    payload: dict,
) -> list[Branch]:
    role = payload.get("role")
    if role in STORE_SCOPED_ROLES:
        store_nbr = payload.get("store_nbr")
        if store_nbr is None:
            return []
        return branch_repo.list_branches(
            db,
            status="active",
            search=search,
            skip=skip,
            limit=limit,
            store_nbr=int(store_nbr),
        )
    return branch_repo.list_branches(db, status=status, search=search, skip=skip, limit=limit)


def get_branch(db: Session, branch_id: UUID, payload: dict) -> Branch:
    branch = branch_repo.get_branch_by_id(db, branch_id)
    if not branch:
        raise BranchNotFoundError("Branch not found")

    role = payload.get("role")
    if role in ADMIN_OWNER_ROLES:
        return branch
    if role in STORE_SCOPED_ROLES and payload.get("store_nbr") == branch.store_nbr and branch.is_active:
        return branch
    raise BranchNotFoundError("Branch not found")


def create_branch(db: Session, payload: BranchCreate, actor: User) -> Branch:
    _require_mutation_role(actor)
    data = payload.model_dump()
    data["email"] = str(data["email"]) if data.get("email") is not None else None
    _check_unique_store_nbr(db, data["store_nbr"])
    _check_unique_branch_code(db, data["branch_code"])

    branch = Branch(**data, is_active=True)
    db.add(branch)
    db.flush()
    _record_audit(
        db,
        event_type="BRANCH_CREATED",
        branch=branch,
        actor=actor,
        changed_fields=_changed_fields_from_payload({**data, "is_active": True}),
    )
    db.commit()
    db.refresh(branch)
    return branch


def update_branch(db: Session, branch_id: UUID, payload: BranchUpdate, actor: User) -> Branch:
    _require_mutation_role(actor)
    branch = branch_repo.get_branch_by_id(db, branch_id)
    if not branch:
        raise BranchNotFoundError("Branch not found")

    updates = payload.model_dump(exclude_unset=True)
    if "email" in updates and updates["email"] is not None:
        updates["email"] = str(updates["email"])

    if "store_nbr" in updates:
        _check_unique_store_nbr(db, updates["store_nbr"], current_id=branch.id)
    if "branch_code" in updates:
        _check_unique_branch_code(db, updates["branch_code"], current_id=branch.id)

    if "is_active" in updates and updates["is_active"] is False:
        updates.pop("is_active")
        if not updates and branch.is_active:
            return deactivate_branch(db, branch_id, actor)
        if branch.is_active:
            deactivated = deactivate_branch(db, branch_id, actor)
            branch = deactivated

    reactivating = updates.get("is_active") is True and not branch.is_active
    if reactivating:
        updates["deleted_at"] = None

    changed_fields = _changed_fields_for_update(branch, updates)
    if not changed_fields:
        return branch

    for key, value in updates.items():
        setattr(branch, key, value)

    event_type = "BRANCH_REACTIVATED" if reactivating else "BRANCH_UPDATED"
    _record_audit(db, event_type=event_type, branch=branch, actor=actor, changed_fields=changed_fields)
    db.commit()
    db.refresh(branch)
    return branch


def deactivate_branch(db: Session, branch_id: UUID, actor: User) -> Branch:
    _require_mutation_role(actor)
    branch = branch_repo.get_branch_by_id(db, branch_id)
    if not branch:
        raise BranchNotFoundError("Branch not found")

    if not branch.is_active:
        return branch

    active_user_count = _active_user_count(db, branch.store_nbr)
    if active_user_count:
        raise BranchConflictError(
            {
                "code": "BRANCH_HAS_ACTIVE_USERS",
                "message": "Deactivate blocked. Move or deactivate active users assigned to this branch first.",
                "active_user_count": active_user_count,
            }
        )

    changed_fields = {
        "is_active": {"old": True, "new": False},
        "deleted_at": {"old": None, "new": _utc_now().isoformat()},
    }
    branch.is_active = False
    branch.deleted_at = _utc_now()
    _record_audit(db, event_type="BRANCH_DEACTIVATED", branch=branch, actor=actor, changed_fields=changed_fields)
    db.commit()
    db.refresh(branch)
    return branch
```

- [x] **Step 3: Create FastAPI router**

Create `backend/domains/branches/router.py`:

```python
"""HTTP endpoints for operational branch management."""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import get_current_user, get_current_user_payload
from domains.branches import service
from domains.branches.schemas import BranchCreate, BranchResponse, BranchStatus, BranchUpdate
from domains.identity.models import User


router = APIRouter(prefix="/branches", tags=["Branches"])


def _raise_service_error(exc: Exception) -> None:
    if isinstance(exc, service.BranchNotFoundError):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    if isinstance(exc, service.BranchForbiddenError):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    if isinstance(exc, service.BranchConflictError):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=exc.detail)
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.get("", response_model=List[BranchResponse])
@router.get("/", response_model=List[BranchResponse])
def list_branches(
    status_filter: BranchStatus = Query("active", alias="status"),
    search: Optional[str] = Query(None, min_length=1, max_length=100),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_user_payload),
):
    return service.list_branches(
        db,
        status=status_filter,
        search=search,
        skip=skip,
        limit=limit,
        payload=payload,
    )


@router.get("/{branch_id}", response_model=BranchResponse)
def get_branch(
    branch_id: UUID = Path(...),
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_user_payload),
):
    try:
        return service.get_branch(db, branch_id, payload)
    except Exception as exc:
        _raise_service_error(exc)


@router.post("", response_model=BranchResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=BranchResponse, status_code=status.HTTP_201_CREATED)
def create_branch(
    payload: BranchCreate,
    db: Session = Depends(get_db),
    actor: User = Depends(get_current_user),
):
    try:
        return service.create_branch(db, payload, actor)
    except Exception as exc:
        _raise_service_error(exc)


@router.patch("/{branch_id}", response_model=BranchResponse)
def update_branch(
    payload: BranchUpdate,
    branch_id: UUID = Path(...),
    db: Session = Depends(get_db),
    actor: User = Depends(get_current_user),
):
    try:
        return service.update_branch(db, branch_id, payload, actor)
    except Exception as exc:
        _raise_service_error(exc)


@router.delete("/{branch_id}", response_model=BranchResponse)
def deactivate_branch(
    branch_id: UUID = Path(...),
    db: Session = Depends(get_db),
    actor: User = Depends(get_current_user),
):
    try:
        return service.deactivate_branch(db, branch_id, actor)
    except Exception as exc:
        _raise_service_error(exc)
```

- [x] **Step 4: Register model and router in `backend/main.py`**

Modify the domain model imports near the existing imports:

```python
from domains.branches import models as _branches
```

Modify router imports:

```python
from domains.branches.router import router as branches_router
```

Register the router after `dataset_router` or near other domain routers:

```python
app.include_router(branches_router)
```

- [x] **Step 5: Run the focused backend tests**

Run:

```powershell
pytest backend/tests/domains/test_branches.py -q
```

Expected result after this task: PASS for branch tests in SQLite.

- [x] **Step 6: Run auth hardening smoke test**

Run:

```powershell
pytest backend/tests/test_p0_config_hardening.py
```

Expected result: PASS.

- [x] **Step 7: Checkpoint**

Review new branch domain boundaries and `backend/main.py` registration. Do not commit unless the user explicitly asks.

---

### Task 4: Alembic Migration for Operational Branches

**Files:**
- Create: `backend/alembic/versions/e5f6a7b8c9d0_create_operational_branches.py`
- Test: `backend/tests/test_p2_logging_and_migrations.py`

- [x] **Step 1: Create migration file**

Create `backend/alembic/versions/e5f6a7b8c9d0_create_operational_branches.py`:

```python
"""Create operational branches table

Revision ID: e5f6a7b8c9d0
Revises: c3d4e5f6a7b8
Create Date: 2026-06-15 00:00:00.000000
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
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.UniqueConstraint("store_nbr", name="uq_branches_store_nbr"),
        sa.UniqueConstraint("branch_code", name="uq_branches_branch_code"),
    )
    op.create_index(op.f("ix_branches_id"), "branches", ["id"], unique=False)
    op.create_index(op.f("ix_branches_store_nbr"), "branches", ["store_nbr"], unique=False)
    op.create_index(op.f("ix_branches_branch_code"), "branches", ["branch_code"], unique=False)
    op.create_index(op.f("ix_branches_name"), "branches", ["name"], unique=False)
    op.create_index(op.f("ix_branches_is_active"), "branches", ["is_active"], unique=False)
    op.create_index("ix_branches_active_store", "branches", ["is_active", "store_nbr"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_branches_active_store", table_name="branches")
    op.drop_index(op.f("ix_branches_is_active"), table_name="branches")
    op.drop_index(op.f("ix_branches_name"), table_name="branches")
    op.drop_index(op.f("ix_branches_branch_code"), table_name="branches")
    op.drop_index(op.f("ix_branches_store_nbr"), table_name="branches")
    op.drop_index(op.f("ix_branches_id"), table_name="branches")
    op.drop_table("branches")
```

- [x] **Step 2: Run migration chain checks**

Run:

```powershell
pytest backend/tests/test_p2_logging_and_migrations.py -q
```

Expected result: PASS. The new revision must keep a single linear Alembic chain and must not contain `DELETE FROM`.

- [x] **Step 3: Apply migration locally when using real PostgreSQL**

If the local PostgreSQL database is running and configured, run:

```powershell
cd backend
alembic upgrade head
```

Expected result: Alembic applies through `e5f6a7b8c9d0`.

- [x] **Step 4: Checkpoint**

Review that migration creates only the new `branches` table and does not alter `stores`, `transactions`, `inventory`, or production-like data. Do not commit unless the user explicitly asks.

---

### Task 5: Frontend Branch API Client and Error Detail Support

**Files:**
- Modify: `frontend/src/app/lib/api.ts`
- Create: `frontend/src/app/lib/branch-client.ts`
- Create: `frontend/tests/branch-client.test.mjs`

- [x] **Step 1: Add static tests for the branch client and structured error support**

Create `frontend/tests/branch-client.test.mjs`:

```javascript
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (path) => readFileSync(join(root, path), "utf8");

test("branch client exposes operational branch API helpers", () => {
  const source = read("src/app/lib/branch-client.ts");

  assert.match(source, /export interface BranchResponse/);
  assert.match(source, /export interface BranchCreateRequest/);
  assert.match(source, /export const fetchBranches/);
  assert.match(source, /api<BranchResponse\[\]>\("\/branches"/);
  assert.match(source, /export const createBranch/);
  assert.match(source, /method: "POST"/);
  assert.match(source, /export const updateBranch/);
  assert.match(source, /method: "PATCH"/);
  assert.match(source, /export const deactivateBranch/);
  assert.match(source, /method: "DELETE"/);
});

test("api client normalizes object detail messages", () => {
  const source = read("src/app/lib/api.ts");

  assert.match(source, /Record<string, unknown>/);
  assert.match(source, /typeof body\.detail === "object"/);
  assert.match(source, /"message" in body\.detail/);
});
```

- [x] **Step 2: Run failing frontend API tests**

Run:

```powershell
cd frontend
node --experimental-strip-types --test --test-isolation=none tests/branch-client.test.mjs
```

Expected result before implementation: FAIL because `branch-client.ts` does not exist and `api.ts` does not normalize object details.

- [x] **Step 3: Update API error body typing**

Modify `frontend/src/app/lib/api.ts`. Replace the `BackendErrorBody` interface and update `normalizeErrorMessage` so object detail bodies are handled:

```typescript
type StructuredErrorDetail = {
  message?: string;
  code?: string;
  active_user_count?: number;
} & Record<string, unknown>;

interface BackendErrorBody {
  detail?: string | PydanticErrorItem[] | StructuredErrorDetail;
  traceback?: string;
  code?: string;
  target_role?: string;
}
```

Then replace `normalizeErrorMessage` with:

```typescript
function normalizeErrorMessage(body: BackendErrorBody | undefined, fallback: string): string {
  if (!body) return fallback;
  if (typeof body.detail === "string") return body.detail;
  if (Array.isArray(body.detail) && body.detail.length > 0) {
    return body.detail[0].msg;
  }
  if (body.detail && typeof body.detail === "object" && "message" in body.detail) {
    const message = body.detail.message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }
  return fallback;
}
```

- [x] **Step 4: Create the branch client**

Create `frontend/src/app/lib/branch-client.ts`:

```typescript
import { api, toQuery } from "@/app/lib/api";

export type BranchStatus = "active" | "inactive" | "all";

export interface BranchResponse {
  id: string;
  store_nbr: number;
  branch_code: string;
  name: string;
  address: string;
  phone?: string | null;
  email?: string | null;
  opening_time?: string | null;
  closing_time?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface BranchCreateRequest {
  store_nbr: number;
  branch_code: string;
  name: string;
  address: string;
  phone?: string | null;
  email?: string | null;
  opening_time?: string | null;
  closing_time?: string | null;
}

export interface BranchUpdateRequest {
  store_nbr?: number;
  branch_code?: string;
  name?: string;
  address?: string;
  phone?: string | null;
  email?: string | null;
  opening_time?: string | null;
  closing_time?: string | null;
  is_active?: boolean;
}

export interface FetchBranchesParams {
  status?: BranchStatus;
  search?: string;
  skip?: number;
  limit?: number;
}

export const fetchBranches = (params?: FetchBranchesParams) =>
  api<BranchResponse[]>("/branches", {
    query: toQuery({
      status: params?.status,
      search: params?.search,
      skip: params?.skip,
      limit: params?.limit,
    }),
  });

export const fetchBranch = (id: string) => api<BranchResponse>(`/branches/${id}`);

export const createBranch = (data: BranchCreateRequest) =>
  api<BranchResponse>("/branches", { method: "POST", body: data });

export const updateBranch = (id: string, data: BranchUpdateRequest) =>
  api<BranchResponse>(`/branches/${id}`, { method: "PATCH", body: data });

export const deactivateBranch = (id: string) =>
  api<BranchResponse>(`/branches/${id}`, { method: "DELETE" });
```

- [x] **Step 5: Run branch client tests**

Run:

```powershell
cd frontend
node --experimental-strip-types --test --test-isolation=none tests/branch-client.test.mjs
```

Expected result: PASS.

- [x] **Step 6: Checkpoint**

Review `api.ts` change for backward compatibility with existing string and Pydantic error bodies. Do not commit unless the user explicitly asks.

---

### Task 6: Frontend Branch Management UI Contract Tests

**Files:**
- Create: `frontend/tests/ui/branch-management-panel.test.mjs`
- Later tasks will modify:
  - `frontend/src/app/components/settings/StoreSettingsPanel.tsx`
  - `frontend/src/app/components/settings/BranchFormModal.tsx`
  - `frontend/src/app/components/settings/BranchDeactivateDialog.tsx`
  - `frontend/src/app/i18n.tsx`

- [x] **Step 1: Add static UI/accessibility tests**

Create `frontend/tests/ui/branch-management-panel.test.mjs`:

```javascript
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("../..", import.meta.url));
const read = (path) => readFileSync(join(root, path), "utf8");

test("StoreSettingsPanel uses branch API client and branch controls", () => {
  const source = read("src/app/components/settings/StoreSettingsPanel.tsx");

  assert.match(source, /fetchBranches/);
  assert.match(source, /createBranch/);
  assert.match(source, /updateBranch/);
  assert.match(source, /deactivateBranch/);
  assert.match(source, /BranchFormModal/);
  assert.match(source, /BranchDeactivateDialog/);
  assert.match(source, /role="tablist"/);
  assert.match(source, /aria-live="polite"/);
  assert.doesNotMatch(source, /defaultValue="Fotokopi Jaya/);
  assert.doesNotMatch(source, /defaultValue="info@fotokopijaya/);
});

test("Branch form modal has dialog semantics and labeled required inputs", () => {
  const path = "src/app/components/settings/BranchFormModal.tsx";
  assert.equal(existsSync(join(root, path)), true);
  const source = read(path);

  assert.match(source, /role="dialog"/);
  assert.match(source, /aria-modal="true"/);
  for (const id of [
    "branch-store-nbr",
    "branch-code",
    "branch-name",
    "branch-address",
    "branch-phone",
    "branch-email",
    "branch-opening-time",
    "branch-closing-time",
  ]) {
    assert.match(source, new RegExp(`htmlFor="${id}"`));
    assert.match(source, new RegExp(`id="${id}"`));
  }
  assert.match(source, /role="alert"/);
  assert.match(source, /aria-busy/);
});

test("Branch deactivate dialog has confirmation semantics", () => {
  const path = "src/app/components/settings/BranchDeactivateDialog.tsx";
  assert.equal(existsSync(join(root, path)), true);
  const source = read(path);

  assert.match(source, /role="dialog"/);
  assert.match(source, /aria-modal="true"/);
  assert.match(source, /set\.store\.branches\.deactivate_confirm_title/);
  assert.match(source, /set\.store\.branches\.deactivate_confirm_body/);
  assert.match(source, /aria-busy/);
});

test("Branch management i18n keys exist in ID and EN dictionaries", () => {
  const source = read("src/app/i18n.tsx");

  for (const key of [
    "set.store.branches.add",
    "set.store.branches.active",
    "set.store.branches.inactive",
    "set.store.branches.search",
    "set.store.branches.empty",
    "set.store.branches.deactivate",
    "set.store.branches.reactivate",
    "set.store.branches.blocked",
  ]) {
    const matches = source.match(new RegExp(`"${key}"`, "g")) ?? [];
    assert.equal(matches.length, 2, `${key} should exist in ID and EN dictionaries`);
  }
});
```

- [x] **Step 2: Run failing UI tests**

Run:

```powershell
cd frontend
node --experimental-strip-types --test --test-isolation=none tests/ui/branch-management-panel.test.mjs
```

Expected result before UI implementation: FAIL because modal files do not exist and the panel is still static.

- [x] **Step 3: Checkpoint**

Review static tests for scope and wording. Do not commit unless the user explicitly asks.

---

### Task 7: Frontend Branch Modals, Panel, and i18n

**Files:**
- Create: `frontend/src/app/components/settings/BranchFormModal.tsx`
- Create: `frontend/src/app/components/settings/BranchDeactivateDialog.tsx`
- Modify: `frontend/src/app/components/settings/StoreSettingsPanel.tsx`
- Modify: `frontend/src/app/i18n.tsx`
- Test: `frontend/tests/ui/branch-management-panel.test.mjs`

- [x] **Step 1: Create `BranchFormModal.tsx`**

Create `frontend/src/app/components/settings/BranchFormModal.tsx` with this structure:

```typescript
"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Store, X } from "lucide-react";
import { useModalA11y } from "@/app/hooks/useModalA11y";
import { btn } from "@/app/lib/buttons";
import { MODAL } from "@/app/lib/containers";
import { ERROR_TEXT, FIELD, INPUT, LABEL, TEXTAREA } from "@/app/lib/forms";
import { ICON } from "@/app/lib/spacing";
import { T } from "@/app/lib/typography";
import { cn } from "@/app/lib/utils";
import type { BranchCreateRequest, BranchResponse } from "@/app/lib/branch-client";

type BranchFormValues = BranchCreateRequest;

type BranchFormErrors = Partial<Record<keyof BranchFormValues | "form", string>>;

type Props = {
  isOpen: boolean;
  branch: BranchResponse | null;
  isSubmitting: boolean;
  error: string | null;
  t: (key: string, params?: Record<string, string | number>) => string;
  onClose: () => void;
  onSubmit: (values: BranchFormValues) => Promise<void>;
};

const EMPTY_FORM: BranchFormValues = {
  store_nbr: 1,
  branch_code: "",
  name: "",
  address: "",
  phone: "",
  email: "",
  opening_time: "08:00:00",
  closing_time: "21:00:00",
};

function toTimeInput(value?: string | null) {
  if (!value) return "";
  return value.slice(0, 5);
}

function toApiTime(value?: string | null) {
  if (!value) return null;
  return value.length === 5 ? `${value}:00` : value;
}

export function BranchFormModal({ isOpen, branch, isSubmitting, error, t, onClose, onSubmit }: Props) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [values, setValues] = useState<BranchFormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<BranchFormErrors>({});
  useModalA11y({ isOpen, onClose, containerRef: modalRef });

  useEffect(() => {
    if (!isOpen) return;
    if (branch) {
      setValues({
        store_nbr: branch.store_nbr,
        branch_code: branch.branch_code,
        name: branch.name,
        address: branch.address,
        phone: branch.phone ?? "",
        email: branch.email ?? "",
        opening_time: toTimeInput(branch.opening_time),
        closing_time: toTimeInput(branch.closing_time),
      });
    } else {
      setValues(EMPTY_FORM);
    }
    setErrors({});
  }, [branch, isOpen]);

  if (!isOpen) return null;

  const setField = <K extends keyof BranchFormValues>(key: K, value: BranchFormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined, form: undefined }));
  };

  const validate = () => {
    const next: BranchFormErrors = {};
    if (!values.store_nbr || values.store_nbr < 1) next.store_nbr = t("set.store.branches.error_store_nbr");
    if (!values.branch_code.trim()) next.branch_code = t("set.store.branches.error_code");
    if (!values.name.trim()) next.name = t("set.store.branches.error_name");
    if (!values.address.trim()) next.address = t("set.store.branches.error_address");
    if (values.opening_time && values.closing_time && values.opening_time === values.closing_time) {
      next.closing_time = t("set.store.branches.error_hours");
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    await onSubmit({
      ...values,
      branch_code: values.branch_code.trim().toUpperCase(),
      name: values.name.trim(),
      address: values.address.trim(),
      phone: values.phone?.trim() || null,
      email: values.email?.trim() || null,
      opening_time: toApiTime(values.opening_time),
      closing_time: toApiTime(values.closing_time),
    });
  };

  const title = branch ? t("set.store.branches.edit_title") : t("set.store.branches.add_title");

  return (
    <div className={cn(MODAL.backdrop, MODAL.wrapper)} onMouseDown={(event) => {
      if (event.currentTarget === event.target) onClose();
    }}>
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="branch-form-title"
        tabIndex={-1}
        className={cn(MODAL.container, MODAL.size.lg, MODAL.maxHeight.lg, "flex flex-col")}
      >
        <header className={MODAL.header}>
          <Store className={cn(ICON.sm, "text-indigo-500")} />
          <div className="min-w-0 flex-1">
            <h4 id="branch-form-title" className={cn(T.h4, "text-slate-900 dark:text-slate-100")}>{title}</h4>
            <p className={cn(T.caption, "text-slate-500 dark:text-slate-400")}>{t("set.store.branches.form_desc")}</p>
          </div>
          <button type="button" onClick={onClose} className={MODAL.close} aria-label={t("set.store.branches.close")}>
            <X className={ICON.sm} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <main className={cn(MODAL.bodyScroll, "space-y-5")}>
            {(error || errors.form) && (
              <p role="alert" className={ERROR_TEXT.base}>{error ?? errors.form}</p>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className={FIELD.wrapper}>
                <label htmlFor="branch-store-nbr" className={cn(LABEL.base, LABEL.required)}>{t("set.store.branches.store_nbr")}</label>
                <input id="branch-store-nbr" type="number" min={1} className={cn(INPUT.base, INPUT.size.md, errors.store_nbr && INPUT.error)} value={values.store_nbr} onChange={(event) => setField("store_nbr", Number(event.target.value))} disabled={isSubmitting} />
                {errors.store_nbr && <p role="alert" className={ERROR_TEXT.base}>{errors.store_nbr}</p>}
              </div>

              <div className={FIELD.wrapper}>
                <label htmlFor="branch-code" className={cn(LABEL.base, LABEL.required)}>{t("set.store.branches.code")}</label>
                <input id="branch-code" className={cn(INPUT.base, INPUT.size.md, errors.branch_code && INPUT.error)} value={values.branch_code} onChange={(event) => setField("branch_code", event.target.value)} disabled={isSubmitting} placeholder="JKT-PST-01" />
                {errors.branch_code && <p role="alert" className={ERROR_TEXT.base}>{errors.branch_code}</p>}
              </div>
            </div>

            <div className={FIELD.wrapper}>
              <label htmlFor="branch-name" className={cn(LABEL.base, LABEL.required)}>{t("set.store.branches.name")}</label>
              <input id="branch-name" className={cn(INPUT.base, INPUT.size.md, errors.name && INPUT.error)} value={values.name} onChange={(event) => setField("name", event.target.value)} disabled={isSubmitting} />
              {errors.name && <p role="alert" className={ERROR_TEXT.base}>{errors.name}</p>}
            </div>

            <div className={FIELD.wrapper}>
              <label htmlFor="branch-address" className={cn(LABEL.base, LABEL.required)}>{t("set.store.branches.address")}</label>
              <textarea id="branch-address" rows={3} className={cn(TEXTAREA.base, TEXTAREA.size.md, errors.address && INPUT.error)} value={values.address} onChange={(event) => setField("address", event.target.value)} disabled={isSubmitting} />
              {errors.address && <p role="alert" className={ERROR_TEXT.base}>{errors.address}</p>}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className={FIELD.wrapper}>
                <label htmlFor="branch-phone" className={LABEL.base}>{t("set.store.branches.phone")}</label>
                <input id="branch-phone" type="tel" className={cn(INPUT.base, INPUT.size.md)} value={values.phone ?? ""} onChange={(event) => setField("phone", event.target.value)} disabled={isSubmitting} />
              </div>

              <div className={FIELD.wrapper}>
                <label htmlFor="branch-email" className={LABEL.base}>{t("set.store.branches.email")}</label>
                <input id="branch-email" type="email" className={cn(INPUT.base, INPUT.size.md)} value={values.email ?? ""} onChange={(event) => setField("email", event.target.value)} disabled={isSubmitting} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className={FIELD.wrapper}>
                <label htmlFor="branch-opening-time" className={LABEL.base}>{t("set.store.branches.opening_time")}</label>
                <input id="branch-opening-time" type="time" className={cn(INPUT.base, INPUT.size.md)} value={values.opening_time ?? ""} onChange={(event) => setField("opening_time", event.target.value)} disabled={isSubmitting} />
              </div>

              <div className={FIELD.wrapper}>
                <label htmlFor="branch-closing-time" className={LABEL.base}>{t("set.store.branches.closing_time")}</label>
                <input id="branch-closing-time" type="time" className={cn(INPUT.base, INPUT.size.md, errors.closing_time && INPUT.error)} value={values.closing_time ?? ""} onChange={(event) => setField("closing_time", event.target.value)} disabled={isSubmitting} />
                {errors.closing_time && <p role="alert" className={ERROR_TEXT.base}>{errors.closing_time}</p>}
              </div>
            </div>
          </main>

          <footer className={MODAL.footer}>
            <button type="button" onClick={onClose} className={btn("outline", "md")} disabled={isSubmitting}>{t("set.store.branches.cancel")}</button>
            <button type="submit" className={btn("primary", "md")} disabled={isSubmitting} aria-busy={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              {branch ? t("set.store.branches.save") : t("set.store.branches.create")}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
```

- [x] **Step 2: Create `BranchDeactivateDialog.tsx`**

Create `frontend/src/app/components/settings/BranchDeactivateDialog.tsx`:

```typescript
"use client";

import { useRef } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { useModalA11y } from "@/app/hooks/useModalA11y";
import { btn } from "@/app/lib/buttons";
import { MODAL } from "@/app/lib/containers";
import { ERROR_TEXT } from "@/app/lib/forms";
import { ICON } from "@/app/lib/spacing";
import { T } from "@/app/lib/typography";
import { cn } from "@/app/lib/utils";
import type { BranchResponse } from "@/app/lib/branch-client";

type Props = {
  branch: BranchResponse | null;
  isSubmitting: boolean;
  error: string | null;
  t: (key: string, params?: Record<string, string | number>) => string;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
};

export function BranchDeactivateDialog({ branch, isSubmitting, error, t, onCancel, onConfirm }: Props) {
  const modalRef = useRef<HTMLDivElement>(null);
  const isOpen = branch !== null;
  useModalA11y({ isOpen, onClose: onCancel, containerRef: modalRef });

  if (!branch) return null;

  return (
    <div className={cn(MODAL.backdrop, MODAL.wrapper)} onMouseDown={(event) => {
      if (event.currentTarget === event.target) onCancel();
    }}>
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="branch-deactivate-title"
        tabIndex={-1}
        className={cn(MODAL.container, MODAL.size.md)}
      >
        <header className={MODAL.header}>
          <AlertTriangle className={cn(ICON.sm, "text-amber-500")} />
          <div className="min-w-0 flex-1">
            <h4 id="branch-deactivate-title" className={cn(T.h4, "text-slate-900 dark:text-slate-100")}>{t("set.store.branches.deactivate_confirm_title")}</h4>
            <p className={cn(T.caption, "text-slate-500 dark:text-slate-400")}>{branch.branch_code} - {branch.name}</p>
          </div>
          <button type="button" onClick={onCancel} className={MODAL.close} aria-label={t("set.store.branches.close")} disabled={isSubmitting}>
            <X className={ICON.sm} />
          </button>
        </header>

        <main className={cn(MODAL.body, "space-y-4")}>
          <p className={cn(T.bodySm, "text-slate-600 dark:text-slate-300")}>{t("set.store.branches.deactivate_confirm_body")}</p>
          {error && <p role="alert" className={ERROR_TEXT.base}>{error}</p>}
        </main>

        <footer className={MODAL.footer}>
          <button type="button" onClick={onCancel} className={btn("outline", "md")} disabled={isSubmitting}>{t("set.store.branches.cancel")}</button>
          <button type="button" onClick={onConfirm} className={btn("destructive", "md")} disabled={isSubmitting} aria-busy={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            {t("set.store.branches.deactivate")}
          </button>
        </footer>
      </div>
    </div>
  );
}
```

- [x] **Step 3: Replace static store settings panel with branch management panel**

Modify `frontend/src/app/components/settings/StoreSettingsPanel.tsx`.

The implementation must:

- Import `fetchBranches`, `createBranch`, `updateBranch`, `deactivateBranch`.
- Import `BranchFormModal` and `BranchDeactivateDialog`.
- Keep `SettingsPanelProps`.
- Use `useEffect` to load branches for the selected status/search.
- Keep local state for `branches`, `status`, `search`, `isLoading`, `error`, `formOpen`, `editingBranch`, `deactivateTarget`, and `isSubmitting`.
- Render desktop table with `hidden md:block`.
- Render mobile list with `md:hidden`.
- Render empty and error states with `aria-live="polite"`.

Use this source shape for the key logic:

```typescript
const [status, setStatus] = useState<BranchStatus>("active");
const [search, setSearch] = useState("");
const [branches, setBranches] = useState<BranchResponse[]>([]);
const [isLoading, setIsLoading] = useState(false);
const [isSubmitting, setIsSubmitting] = useState(false);
const [error, setError] = useState<string | null>(null);
const [mutationError, setMutationError] = useState<string | null>(null);
const [editingBranch, setEditingBranch] = useState<BranchResponse | null>(null);
const [formOpen, setFormOpen] = useState(false);
const [deactivateTarget, setDeactivateTarget] = useState<BranchResponse | null>(null);

const loadBranches = useCallback(async () => {
  setIsLoading(true);
  setError(null);
  try {
    const data = await fetchBranches({ status, search, limit: 100 });
    setBranches(data);
  } catch (err) {
    setError(err instanceof Error ? err.message : t("set.store.branches.load_error"));
  } finally {
    setIsLoading(false);
  }
}, [search, status, t]);

useEffect(() => {
  void loadBranches();
}, [loadBranches]);
```

Use this source shape for create/edit:

```typescript
const handleSubmitBranch = async (values: BranchCreateRequest) => {
  setIsSubmitting(true);
  setMutationError(null);
  try {
    if (editingBranch) {
      await updateBranch(editingBranch.id, values);
      toast.success(t("set.store.branches.updated"));
    } else {
      await createBranch(values);
      toast.success(t("set.store.branches.created"));
    }
    setFormOpen(false);
    setEditingBranch(null);
    await loadBranches();
  } catch (err) {
    setMutationError(err instanceof Error ? err.message : t("set.store.branches.save_error"));
  } finally {
    setIsSubmitting(false);
  }
};
```

Use this source shape for deactivate/reactivate:

```typescript
const handleDeactivateBranch = async () => {
  if (!deactivateTarget) return;
  setIsSubmitting(true);
  setMutationError(null);
  try {
    await deactivateBranch(deactivateTarget.id);
    toast.success(t("set.store.branches.deactivated"));
    setDeactivateTarget(null);
    await loadBranches();
  } catch (err) {
    setMutationError(err instanceof Error ? err.message : t("set.store.branches.blocked"));
  } finally {
    setIsSubmitting(false);
  }
};

const handleReactivateBranch = async (branch: BranchResponse) => {
  setIsSubmitting(true);
  setMutationError(null);
  try {
    await updateBranch(branch.id, { is_active: true });
    toast.success(t("set.store.branches.reactivated"));
    await loadBranches();
  } catch (err) {
    setError(err instanceof Error ? err.message : t("set.store.branches.save_error"));
  } finally {
    setIsSubmitting(false);
  }
};
```

Use existing utilities already present in the repo:

```typescript
import { useCallback, useEffect, useState } from "react";
import { Edit2, Loader2, Plus, RefreshCcw, Search, Store, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { btn, BTN } from "@/app/lib/buttons";
import { C } from "@/app/lib/colors";
import { ERROR_TEXT, INPUT } from "@/app/lib/forms";
import { ICON } from "@/app/lib/spacing";
import { T } from "@/app/lib/typography";
import { cn } from "@/app/lib/utils";
import {
  createBranch,
  deactivateBranch,
  fetchBranches,
  updateBranch,
  type BranchCreateRequest,
  type BranchResponse,
  type BranchStatus,
} from "@/app/lib/branch-client";
import { BranchDeactivateDialog } from "@/app/components/settings/BranchDeactivateDialog";
import { BranchFormModal } from "@/app/components/settings/BranchFormModal";
```

- [x] **Step 4: Add i18n keys**

Modify `frontend/src/app/i18n.tsx` in both Indonesian and English dictionaries. Add these exact keys with localized values:

```typescript
"set.store.branches.add": "Tambah Cabang",
"set.store.branches.active": "Aktif",
"set.store.branches.inactive": "Nonaktif",
"set.store.branches.search": "Cari kode, nama, atau store number",
"set.store.branches.empty": "Belum ada cabang pada filter ini.",
"set.store.branches.load_error": "Gagal memuat daftar cabang.",
"set.store.branches.save_error": "Gagal menyimpan cabang.",
"set.store.branches.created": "Cabang berhasil dibuat.",
"set.store.branches.updated": "Cabang berhasil diperbarui.",
"set.store.branches.deactivated": "Cabang berhasil dinonaktifkan.",
"set.store.branches.reactivated": "Cabang berhasil diaktifkan kembali.",
"set.store.branches.blocked": "Cabang belum bisa dinonaktifkan karena masih memiliki user aktif.",
"set.store.branches.edit": "Edit",
"set.store.branches.deactivate": "Nonaktifkan",
"set.store.branches.reactivate": "Aktifkan kembali",
"set.store.branches.code": "Kode Cabang",
"set.store.branches.name": "Nama Cabang",
"set.store.branches.store_nbr": "Store Number",
"set.store.branches.address": "Alamat",
"set.store.branches.phone": "Telepon",
"set.store.branches.email": "Email",
"set.store.branches.opening_time": "Jam Buka",
"set.store.branches.closing_time": "Jam Tutup",
"set.store.branches.status": "Status",
"set.store.branches.actions": "Aksi",
"set.store.branches.contact": "Kontak",
"set.store.branches.hours": "Jam Operasional",
"set.store.branches.add_title": "Tambah Cabang",
"set.store.branches.edit_title": "Edit Cabang",
"set.store.branches.form_desc": "Kelola data cabang operasional yang dipakai untuk user, stok, dan laporan.",
"set.store.branches.cancel": "Batal",
"set.store.branches.create": "Buat Cabang",
"set.store.branches.save": "Simpan",
"set.store.branches.close": "Tutup",
"set.store.branches.deactivate_confirm_title": "Nonaktifkan cabang?",
"set.store.branches.deactivate_confirm_body": "Cabang nonaktif tidak tampil di daftar aktif. Riwayat data tetap disimpan.",
"set.store.branches.error_store_nbr": "Store number harus lebih dari 0.",
"set.store.branches.error_code": "Kode cabang wajib diisi.",
"set.store.branches.error_name": "Nama cabang wajib diisi.",
"set.store.branches.error_address": "Alamat wajib diisi.",
"set.store.branches.error_hours": "Jam buka dan tutup tidak boleh sama.",
```

Use English equivalents for the EN dictionary with the same keys.

- [x] **Step 5: Run UI static tests**

Run:

```powershell
cd frontend
node --experimental-strip-types --test --test-isolation=none tests/ui/branch-management-panel.test.mjs
```

Expected result: PASS.

- [x] **Step 6: Run branch client tests**

Run:

```powershell
cd frontend
node --experimental-strip-types --test --test-isolation=none tests/branch-client.test.mjs
```

Expected result: PASS.

- [x] **Step 7: Checkpoint**

Review `StoreSettingsPanel.tsx` in browser at `http://127.0.0.1:3000/pengaturan` if the dev server is running. Check desktop and mobile widths manually. Do not commit unless the user explicitly asks.

---

### Task 8: Full Verification

**Files:**
- Verify all files touched by Tasks 1-7.

- [x] **Step 1: Run focused backend tests**

Run:

```powershell
pytest backend/tests/domains/test_branches.py -q
```

Expected result: all tests pass.

- [x] **Step 2: Run backend hardening and migration tests**

Run:

```powershell
pytest backend/tests/test_p0_config_hardening.py backend/tests/test_p2_logging_and_migrations.py -q
```

Expected result: all tests pass.

- [x] **Step 3: Run frontend branch tests**

Run:

```powershell
cd frontend
node --experimental-strip-types --test --test-isolation=none tests/branch-client.test.mjs tests/ui/branch-management-panel.test.mjs
```

Expected result: all tests pass.

- [x] **Step 4: Run frontend baseline checks**

Run:

```powershell
cd frontend
npm run lint
npm run typecheck
```

Expected result: lint has no errors, typecheck passes.

- [x] **Step 5: Run broader frontend static suite if time allows**

Run:

```powershell
cd frontend
node --experimental-strip-types --test --test-isolation=none tests/integration/*.test.mjs tests/ui/*.test.mjs tests/*.test.mjs
```

Expected result: all frontend static tests pass.

- [x] **Step 6: Run backend unit/domain suite if time allows**

Run:

```powershell
pytest backend/tests -q --ignore=backend/tests/integration --ignore=backend/tests/manual
```

Expected result: backend unit/domain tests pass.

- [x] **Step 7: Final review checklist**

Verify:

- `GET /stores/` and `domains.dataset.models.Store` remain unchanged.
- `branches` domain has no dependency on product import or ML forecast files.
- `DELETE /branches/{id}` performs soft deactivation only.
- Branch audit events set `AuditEvent.store_nbr` to `None`.
- No secrets, `.env`, generated logs, `.next`, `node_modules`, or database data were touched.
- `git diff` only contains branch MVP files and the previously approved spec/plan files.

---

## Self-Review

Spec coverage:

- Backend branch table/domain/API: Tasks 1-4.
- Owner/admin mutation authorization: Tasks 1 and 3.
- Store-scoped read behavior: Tasks 1 and 3.
- Soft deactivate/reactivate: Tasks 1 and 3.
- Active-user deactivation guard: Tasks 1 and 3.
- Audit changed-field details: Tasks 1 and 3.
- Frontend settings panel replacement: Tasks 6-7.
- Accessibility and loading states: Tasks 6-7.
- Verification commands: Task 8.

Placeholder scan:

- This plan contains concrete file paths, commands, tests, and code snippets.
- There are no unresolved placeholders.

Type consistency:

- Backend schema names: `BranchCreate`, `BranchUpdate`, `BranchResponse`, `BranchStatus`.
- Frontend client names: `BranchCreateRequest`, `BranchUpdateRequest`, `BranchResponse`, `BranchStatus`.
- Endpoint path is consistently `/branches`.
- Compatibility key is consistently `store_nbr`.
