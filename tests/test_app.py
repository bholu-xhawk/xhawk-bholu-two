import pytest
from fastapi.testclient import TestClient

import app.main as main

client = TestClient(main.app)


@pytest.fixture(autouse=True)
def reset_mock_items():
    main._mock_items.clear()
    main._next_mock_item_id = 1


def test_root():
    r = client.get("/")
    assert r.status_code == 200
    assert r.json() == {"message": "Hello, World!"}


def test_create_mock_item():
    response = client.post(
        "/mock-items",
        json={"name": "Draft post", "description": "Homepage card", "status": "draft"},
    )

    assert response.status_code == 201
    assert response.json() == {
        "id": 1,
        "name": "Draft post",
        "description": "Homepage card",
        "status": "draft",
    }


def test_list_mock_items():
    first = client.post("/mock-items", json={"name": "First item"}).json()
    second = client.post(
        "/mock-items",
        json={"name": "Second item", "description": "Visible", "status": "ready"},
    ).json()

    response = client.get("/mock-items")

    assert response.status_code == 200
    assert response.json() == [first, second]


def test_get_mock_item():
    created = client.post(
        "/mock-items",
        json={"name": "Read me", "description": "Details", "status": "active"},
    ).json()

    response = client.get("/mock-items/1")

    assert response.status_code == 200
    assert response.json() == created


def test_update_mock_item():
    client.post("/mock-items", json={"name": "Before", "status": "draft"})

    response = client.put(
        "/mock-items/1",
        json={"name": "After", "description": "Updated", "status": "published"},
    )

    assert response.status_code == 200
    assert response.json() == {
        "id": 1,
        "name": "After",
        "description": "Updated",
        "status": "published",
    }


def test_delete_mock_item_and_404_afterwards():
    client.post("/mock-items", json={"name": "Delete me"})

    delete_response = client.delete("/mock-items/1")

    assert delete_response.status_code == 200
    assert delete_response.json() == {"message": "Mock item deleted", "id": 1}

    get_response = client.get("/mock-items/1")
    assert get_response.status_code == 404
    assert get_response.json() == {"detail": "Mock item not found"}


def test_unknown_mock_item_returns_404():
    response = client.get("/mock-items/999")

    assert response.status_code == 404
    assert response.json() == {"detail": "Mock item not found"}
