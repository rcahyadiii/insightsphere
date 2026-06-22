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
