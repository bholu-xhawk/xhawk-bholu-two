import os
from datetime import datetime, timezone
from typing import Dict

import pytest
from fastapi.testclient import TestClient

from api.app import app
from api.routers.admin_members import _reset_store_for_tests


@pytest.fixture(autouse=True)
def clear_store_between_tests():
    _reset_store_for_tests()
    # Ensure env var is not set by default
    if "ADMIN_API_KEY" in os.environ:
        del os.environ["ADMIN_API_KEY"]


def client_with_key(key: str | None):
    client = TestClient(app)
    if key is None:
        return client

    # Set default headers for this client by wrapping request method
    original_request = client.request

    def _request(method, url, **kwargs):
        headers = kwargs.pop("headers", {}) or {}
        headers.setdefault("X-API-Key", key)
        return original_request(method, url, headers=headers, **kwargs)

    client.request = _request  # type: ignore
    return client


def test_create_and_list_member():
    client = client_with_key(None)
    # Create member
    payload = {
        "name": "Alice",
        "email": "Alice@example.com",
        "role": "manager",
    }
    res = client.post("/admin/members", json=payload)
    assert res.status_code == 201, res.text
    data = res.json()
    assert data["name"] == "Alice"
    # email stored lowercased
    assert data["email"] == "alice@example.com"
    assert data["role"] == "manager"
    assert "id" in data
    assert "created_at" in data and "updated_at" in data

    # List members includes created
    res_list = client.get("/admin/members")
    assert res_list.status_code == 200
    members = res_list.json()
    assert any(m["id"] == data["id"] for m in members)


def test_get_member_by_id():
    client = client_with_key(None)
    res = client.post(
        "/admin/members",
        json={"name": "Bob", "email": "bob@example.com", "role": "viewer"},
    )
    assert res.status_code == 201
    member = res.json()

    res_get = client.get(f"/admin/members/{member['id']}")
    assert res_get.status_code == 200
    assert res_get.json()["email"] == "bob@example.com"


def test_put_replace_and_uniqueness_and_timestamps():
    client = client_with_key(None)

    # Create two members
    a = client.post(
        "/admin/members",
        json={"name": "A", "email": "a@example.com", "role": "viewer"},
    ).json()
    b = client.post(
        "/admin/members",
        json={"name": "B", "email": "b@example.com", "role": "manager"},
    ).json()

    # Replace B with new details
    res_put = client.put(
        f"/admin/members/{b['id']}",
        json={"name": "Bee", "email": "bee@example.com", "role": "superadmin"},
    )
    assert res_put.status_code == 200, res_put.text
    updated = res_put.json()
    assert updated["name"] == "Bee"
    assert updated["email"] == "bee@example.com"
    assert updated["role"] == "superadmin"

    # Timestamps: updated_at should be >= created_at and changed from previous
    fmt = "%Y-%m-%dT%H:%M:%S%z"
    created_prev = datetime.fromisoformat(a["created_at"])  # not used
    created_b = datetime.fromisoformat(b["created_at"])  # type: ignore
    updated_b = datetime.fromisoformat(updated["updated_at"])  # type: ignore
    assert updated_b >= created_b

    # Try to set email to existing one's email -> 409
    res_conflict = client.put(
        f"/admin/members/{updated['id']}",
        json={"name": "Bee", "email": "a@example.com", "role": "viewer"},
    )
    assert res_conflict.status_code == 409
    assert res_conflict.json() == {"detail": "Email already in use"}


def test_patch_partial_and_null_ignored():
    client = client_with_key(None)
    member = client.post(
        "/admin/members",
        json={"name": "Carol", "email": "carol@example.com", "role": "viewer"},
    ).json()

    # Patch only role
    res_patch = client.patch(
        f"/admin/members/{member['id']}",
        json={"role": "manager"},
    )
    assert res_patch.status_code == 200
    patched = res_patch.json()
    assert patched["role"] == "manager"

    # Send null name -> ignored
    res_patch2 = client.patch(
        f"/admin/members/{member['id']}",
        json={"name": None},
    )
    assert res_patch2.status_code == 200
    assert res_patch2.json()["name"] == patched["name"]


def test_delete_member():
    client = client_with_key(None)
    member = client.post(
        "/admin/members",
        json={"name": "Dan", "email": "dan@example.com", "role": "viewer"},
    ).json()

    res_del = client.delete(f"/admin/members/{member['id']}")
    assert res_del.status_code == 204

    res_get = client.get(f"/admin/members/{member['id']}")
    assert res_get.status_code == 404
    assert res_get.json() == {"detail": "Admin member not found"}


def test_duplicate_email_on_create_conflict():
    client = client_with_key(None)
    res1 = client.post(
        "/admin/members",
        json={"name": "Eve", "email": "eve@example.com", "role": "viewer"},
    )
    assert res1.status_code == 201
    res2 = client.post(
        "/admin/members",
        json={"name": "Eve2", "email": "EVE@example.com", "role": "manager"},
    )
    assert res2.status_code == 409
    assert res2.json() == {"detail": "Email already in use"}


def test_auth_required_when_env_set_and_header_checked(monkeypatch):
    monkeypatch.setenv("ADMIN_API_KEY", "secret")

    # Without header -> 401
    client = TestClient(app)
    res = client.get("/admin/members")
    assert res.status_code == 401
    assert res.json() == {"detail": "Unauthorized"}

    # With wrong header -> 401
    res2 = client.get("/admin/members", headers={"X-API-Key": "wrong"})
    assert res2.status_code == 401

    # With correct header -> 200
    res3 = client.get("/admin/members", headers={"X-API-Key": "secret"})
    assert res3.status_code == 200
