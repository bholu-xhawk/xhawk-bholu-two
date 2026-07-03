from fastapi.testclient import TestClient
from api.app import app


def test_post_mock_happy_path_and_location_header():
    client = TestClient(app)
    payload = {"name": "foo", "quantity": 2}
    response = client.post("/test/mock", json=payload)

    assert response.status_code == 201

    data = response.json()
    # Original fields are preserved
    assert data["name"] == "foo"
    assert data["quantity"] == 2

    # Deterministic mock fields are present with exact values
    assert data["id"] == "mock-123"
    assert data["created_at"] == "1970-01-01T00:00:00Z"
    assert data["status"] == "mock"

    # Location header set correctly
    assert response.headers.get("Location") == "/test/mock/mock-123"
