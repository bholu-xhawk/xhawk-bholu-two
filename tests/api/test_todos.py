import pytest
from fastapi.testclient import TestClient

from api.app import _reset_mock_todos, app


@pytest.fixture(autouse=True)
def reset_todos():
    _reset_mock_todos()


def assert_success_envelope(response, status_code=200):
    assert response.status_code == status_code
    body = response.json()
    assert set(body) == {"success", "data", "error"}
    assert body["success"] is True
    assert body["error"] is None
    return body["data"]


def assert_error_envelope(response, status_code, code):
    assert response.status_code == status_code
    body = response.json()
    assert set(body) == {"success", "data", "error"}
    assert body["success"] is False
    assert body["data"] is None
    assert body["error"]["code"] == code
    assert isinstance(body["error"]["message"], str)
    assert body["error"]["message"]
    return body["error"]


def test_create_list_read_update_and_delete_todo():
    client = TestClient(app)

    created = assert_success_envelope(
        client.post(
            "/todos",
            json={"title": "Write tests", "description": "Cover CRUD"},
        ),
        201,
    )
    assert created == {
        "id": 1,
        "title": "Write tests",
        "completed": False,
        "description": "Cover CRUD",
    }

    listed = assert_success_envelope(client.get("/todos"))
    assert listed == [created]

    fetched = assert_success_envelope(client.get("/todos/1"))
    assert fetched == created

    updated = assert_success_envelope(
        client.patch("/todos/1", json={"completed": True, "description": None})
    )
    assert updated == {
        "id": 1,
        "title": "Write tests",
        "completed": True,
        "description": None,
    }

    deleted = assert_success_envelope(client.delete("/todos/1"))
    assert deleted == updated
    assert_success_envelope(client.get("/todos")) == []


def test_reset_store_makes_ids_deterministic():
    client = TestClient(app)

    first = assert_success_envelope(client.post("/todos", json={"title": "First"}), 201)
    assert first["id"] == 1


def test_missing_todo_returns_error_envelope():
    client = TestClient(app)

    for response in (
        client.get("/todos/123"),
        client.patch("/todos/123", json={"completed": True}),
        client.delete("/todos/123"),
    ):
        assert_error_envelope(response, 404, "TODO_NOT_FOUND")


def test_create_todo_validation_errors_use_envelope():
    client = TestClient(app)

    assert_error_envelope(client.post("/todos", json={}), 422, "VALIDATION_ERROR")
    assert_error_envelope(
        client.post("/todos", json={"title": "   "}), 422, "VALIDATION_ERROR"
    )


def test_patch_rejects_empty_update_body():
    client = TestClient(app)
    assert_success_envelope(client.post("/todos", json={"title": "Keep me"}), 201)

    error = assert_error_envelope(client.patch("/todos/1", json={}), 400, "EMPTY_UPDATE")
    assert "At least one" in error["message"]


def test_patch_validation_errors_use_envelope():
    client = TestClient(app)
    assert_success_envelope(client.post("/todos", json={"title": "Keep me"}), 201)

    assert_error_envelope(
        client.patch("/todos/1", json={"title": ""}), 422, "VALIDATION_ERROR"
    )
