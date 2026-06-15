from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class AdminMemberBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: str
    role: Literal["superadmin", "manager", "viewer"]


class AdminMemberCreate(AdminMemberBase):
    pass


class AdminMemberUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[str] = None
    role: Optional[Literal["superadmin", "manager", "viewer"]] = None


class AdminMember(AdminMemberBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        # Ensure datetimes are serialized in ISO format with timezone
        json_encoders = {
            datetime: lambda v: v.astimezone(timezone.utc).isoformat()
        }


def utcnow() -> datetime:
    return datetime.now(timezone.utc)
