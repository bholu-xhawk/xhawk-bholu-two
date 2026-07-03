from fastapi.testclient import TestClient
from api.app import app, ITEMS


def setup_function(function):
    # Reset the in-memory store before each test
    ITEMS.clear()
    ITEMS.update({"1": {"id": "1", "name": "example"}})


def test_delete_existing_item_returns_204():
    client = TestClient(app)
    response = client.delete("/items/1")
    assert response.status_code == 204
    # Ensure the item is removed
    assert "1" not in ITEMS


def test_delete_non_existent_item_returns_404():
    client = TestClient(app)
    # Ensure item 2 does not exist
    if "2" in ITEMS:
        del ITEMS["2"]
    response = client.delete("/items/2")
    assert response.status_code == 404
    assert response.json() == {"detail": "Item not found"}


def test_delete_same_item_twice_returns_204_then_404():
    client = TestClient(app)
    # First delete should succeed
    response1 = client.delete("/items/1")
    assert response1.status_code == 204

    # Second delete should return 404 as the item no longer exists
    response2 = client.delete("/items/1")
    assert response2.status_code == 404
    assert response2.json() == {"detail": "Item not found"}
