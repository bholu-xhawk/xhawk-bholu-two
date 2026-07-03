from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_todo_lifecycle_and_errors():
    # Initially empty
    r = client.get("/todos")
    assert r.status_code == 200
    assert r.json() == []

    # Create a todo
    r = client.post("/todos", json={"text": "Buy milk"})
    assert r.status_code == 201
    created = r.json()
    assert created["id"] == 1
    assert created["text"] == "Buy milk"
    assert created["completed"] is False

    # List shows the item
    r = client.get("/todos")
    assert r.status_code == 200
    items = r.json()
    assert len(items) == 1
    assert items[0] == created

    # Update completion
    r = client.patch("/todos/1", json={"completed": True})
    assert r.status_code == 200
    updated = r.json()
    assert updated["id"] == 1
    assert updated["completed"] is True

    # Delete the todo
    r = client.delete("/todos/1")
    assert r.status_code == 200
    assert r.json() == {"deleted": True}

    # Now list is empty again
    r = client.get("/todos")
    assert r.status_code == 200
    assert r.json() == []

    # 404s on unknown ids
    r = client.patch("/todos/999", json={"completed": False})
    assert r.status_code == 404
    r = client.delete("/todos/999")
    assert r.status_code == 404
