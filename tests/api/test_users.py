from fastapi.testclient import TestClient
from api.app import app


def test_create_user_returns_mock():
    client = TestClient(app)
    payload = {"name": "Alice", "email": "alice@example.com"}
    response = client.post("/users", json=payload)

    assert response.status_code == 201
    assert response.json() == {
        "id": "mock-1",
        "name": "Alice",
        "email": "alice@example.com",
        "status": "created",
        "created_at": "1970-01-01T00:00:00Z",
    }
