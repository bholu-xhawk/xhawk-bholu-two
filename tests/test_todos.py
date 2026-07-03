import importlib
import os

from fastapi.testclient import TestClient


def build_client(tmp_path):
    tmp_file = tmp_path / "todos.json"
    os.environ["TODO_FILE"] = str(tmp_file)
    import app.main as app_main
    importlib.reload(app_main)
    return TestClient(app_main.app)


def test_todos_crud(tmp_path):
    client = build_client(tmp_path)

    # initial list empty
    r = client.get("/todos")
    assert r.status_code == 200
    assert r.json() == []

    # create one
    r = client.post("/todos", json={"title": "Buy milk"})
    assert r.status_code == 201
    todo = r.json()
    assert todo["id"] == 1
    assert todo["title"] == "Buy milk"
    assert todo["completed"] is False

    # list now has one
    r = client.get("/todos")
    assert r.status_code == 200
    assert len(r.json()) == 1

    # update completed
    r = client.patch("/todos/1", json={"completed": True})
    assert r.status_code == 200
    assert r.json()["completed"] is True

    # update title
    r = client.patch("/todos/1", json={"title": "Buy oat milk"})
    assert r.status_code == 200
    assert r.json()["title"] == "Buy oat milk"

    # delete
    r = client.delete("/todos/1")
    assert r.status_code == 204

    # list now empty again
    r = client.get("/todos")
    assert r.status_code == 200
    assert r.json() == []

    # update non-existent -> 404
    r = client.patch("/todos/999", json={"completed": True})
    assert r.status_code == 404

    # delete non-existent -> 404
    r = client.delete("/todos/999")
    assert r.status_code == 404
