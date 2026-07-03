from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_create_user():
    payload = {"name": "Alice", "email": "alice@example.com"}
    r = client.post("/users", json=payload)
    assert r.status_code == 201
    data = r.json()
    assert "id" in data
    assert data["name"] == payload["name"]
    assert data["email"] == payload["email"]


def test_get_user_found_and_not_found():
    # Create a user first
    payload = {"name": "Bob", "email": "bob@example.com"}
    r = client.post("/users", json=payload)
    user = r.json()

    # Found
    r2 = client.get(f"/users/{user['id']}")
    assert r2.status_code == 200
    assert r2.json()["id"] == user["id"]

    # Not found
    r3 = client.get("/users/999999")
    assert r3.status_code == 404
    assert r3.json()["detail"] == "User not found"


def test_patch_user():
    # Create a user
    payload = {"name": "Carol", "email": "carol@example.com"}
    r = client.post("/users", json=payload)
    user = r.json()

    # Update name
    r2 = client.patch(f"/users/{user['id']}", json={"name": "Caroline"})
    assert r2.status_code == 200
    updated = r2.json()
    assert updated["name"] == "Caroline"
    assert updated["email"] == payload["email"]


def test_delete_user():
    # Create a user
    payload = {"name": "Dave", "email": "dave@example.com"}
    r = client.post("/users", json=payload)
    user = r.json()

    # Delete
    r2 = client.delete(f"/users/{user['id']}")
    assert r2.status_code == 204

    # Ensure gone
    r3 = client.get(f"/users/{user['id']}")
    assert r3.status_code == 404
    assert r3.json()["detail"] == "User not found"
