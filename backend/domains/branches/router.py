"""FastAPI routes for operational branch management."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from core.database import get_db
from core.security import get_current_user, get_current_user_payload
from domains.branches import service
from domains.branches.schemas import (
    BranchCreate,
    BranchResponse,
    BranchStatus,
    BranchUpdate,
)
from domains.identity.models import User


router = APIRouter(prefix="/branches", tags=["Branches"])


def _raise_not_found(exc: Exception) -> None:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


def _raise_forbidden(exc: Exception) -> None:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc


def _raise_conflict(exc: service.BranchConflictError) -> None:
    raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=exc.detail) from exc


@router.get("", response_model=list[BranchResponse])
def list_branches(
    status_filter: BranchStatus = Query(default="active", alias="status"),
    search: Optional[str] = Query(default=None, max_length=150),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=200),
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db),
):
    try:
        return service.list_branches(
            db,
            payload=payload,
            status=status_filter,
            search=search,
            skip=skip,
            limit=limit,
        )
    except service.BranchForbiddenError as exc:
        _raise_forbidden(exc)


@router.get("/{branch_id}", response_model=BranchResponse)
def get_branch(
    branch_id: UUID,
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db),
):
    try:
        return service.get_branch(db, branch_id=branch_id, payload=payload)
    except service.BranchNotFoundError as exc:
        _raise_not_found(exc)
    except service.BranchForbiddenError as exc:
        _raise_forbidden(exc)


@router.post("", response_model=BranchResponse, status_code=status.HTTP_201_CREATED)
def create_branch(
    payload: BranchCreate,
    actor: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return service.create_branch(db, payload=payload, actor=actor)
    except service.BranchForbiddenError as exc:
        _raise_forbidden(exc)
    except service.BranchConflictError as exc:
        _raise_conflict(exc)


@router.patch("/{branch_id}", response_model=BranchResponse)
def update_branch(
    branch_id: UUID,
    payload: BranchUpdate,
    actor: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return service.update_branch(db, branch_id=branch_id, payload=payload, actor=actor)
    except service.BranchNotFoundError as exc:
        _raise_not_found(exc)
    except service.BranchForbiddenError as exc:
        _raise_forbidden(exc)
    except service.BranchConflictError as exc:
        _raise_conflict(exc)


@router.delete("/{branch_id}", response_model=BranchResponse)
def deactivate_branch(
    branch_id: UUID,
    actor: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return service.deactivate_branch(db, branch_id=branch_id, actor=actor)
    except service.BranchNotFoundError as exc:
        _raise_not_found(exc)
    except service.BranchForbiddenError as exc:
        _raise_forbidden(exc)
    except service.BranchConflictError as exc:
        _raise_conflict(exc)
