from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict, List, Optional
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Response, status

from api.deps import require_api_key
from api.models.admin_member import (
    AdminMember,
    AdminMemberCreate,
    AdminMemberUpdate,
    utcnow,
)

router = APIRouter(prefix="/admin", tags=["admin-members"], dependencies=[Depends(require_api_key)])

# In-memory store
_store: Dict[UUID, AdminMember] = {}


def _email_in_use(email: str, exclude_id: Optional[UUID] = None) -> bool:
    lowered = email.strip().lower()
    for mid, member in _store.items():
        if exclude_id is not None and mid == exclude_id:
            continue
        if member.email.strip().lower() == lowered:
            return True
    return False


def _get_member_or_404(member_id: UUID) -> AdminMember:
    member = _store.get(member_id)
    if member is None:
        raise HTTPException(status_code=404, detail="Admin member not found")
    return member


# Helper to reset store for tests
def _reset_store_for_tests() -> None:
    _store.clear()


@router.get("/members", response_model=List[AdminMember])
def list_members() -> List[AdminMember]:
    return list(_store.values())


@router.get("/members/{member_id}", response_model=AdminMember)
def get_member(member_id: UUID) -> AdminMember:
    return _get_member_or_404(member_id)


@router.post("/members", response_model=AdminMember, status_code=status.HTTP_201_CREATED)
def create_member(payload: AdminMemberCreate) -> AdminMember:
    email_lower = payload.email.strip().lower()
    if _email_in_use(email_lower):
        raise HTTPException(status_code=409, detail="Email already in use")
    now = utcnow()
    member = AdminMember(
        id=uuid4(),
        name=payload.name,
        email=email_lower,
        role=payload.role,
        created_at=now,
        updated_at=now,
    )
    _store[member.id] = member
    return member


@router.put("/members/{member_id}", response_model=AdminMember)
def replace_member(member_id: UUID, payload: AdminMemberCreate) -> AdminMember:
    existing = _get_member_or_404(member_id)
    email_lower = payload.email.strip().lower()
    if _email_in_use(email_lower, exclude_id=member_id):
        raise HTTPException(status_code=409, detail="Email already in use")
    updated = AdminMember(
        id=existing.id,
        name=payload.name,
        email=email_lower,
        role=payload.role,
        created_at=existing.created_at,
        updated_at=utcnow(),
    )
    _store[member_id] = updated
    return updated


@router.patch("/members/{member_id}", response_model=AdminMember)
def update_member(member_id: UUID, payload: AdminMemberUpdate) -> AdminMember:
    member = _get_member_or_404(member_id)
    update_data = payload.model_dump(exclude_unset=True, exclude_none=True)

    # Handle email uniqueness and normalization if provided
    if "email" in update_data and update_data["email"] is not None:
        new_email = str(update_data["email"]).strip().lower()
        if _email_in_use(new_email, exclude_id=member_id):
            raise HTTPException(status_code=409, detail="Email already in use")
        update_data["email"] = new_email

    # Apply changes
    new_member = member.model_copy(update=update_data)
    new_member.updated_at = utcnow()
    _store[member_id] = new_member
    return new_member


@router.delete("/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_member(member_id: UUID) -> Response:
    if member_id not in _store:
        raise HTTPException(status_code=404, detail="Admin member not found")
    del _store[member_id]
    return Response(status_code=status.HTTP_204_NO_CONTENT)
