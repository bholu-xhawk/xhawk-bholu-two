from fastapi.testclient import TestClient
from api.app import app


def test_todo_user_returns_static_mock_user():
    client = TestClient(app)
    response = client.get("/todo/user")
    assert response.status_code == 200
    assert response.json() == {
        "id": 1,
        "name": "Test User",
        "email": "test.user@example.com",
    }
