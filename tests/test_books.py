from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_list_books_returns_frontend_contract():
    response = client.get("/books")

    assert response.status_code == 200
    books = response.json()
    assert isinstance(books, list)
    assert books
    assert {"id", "name", "details", "authors", "starred"} <= books[0].keys()
    assert isinstance(books[0]["id"], int)
    assert isinstance(books[0]["name"], str)
    assert isinstance(books[0]["details"], str)
    assert isinstance(books[0]["starred"], bool)


def test_update_book_star_accepts_starred_boolean_and_returns_updated_book():
    response = client.patch("/books/1/star", json={"starred": True})

    assert response.status_code == 200
    updated = response.json()
    assert updated["id"] == 1
    assert updated["starred"] is True

    list_response = client.get("/books")
    listed_book = next(book for book in list_response.json() if book["id"] == 1)
    assert listed_book["starred"] is True


def test_update_book_star_can_unstar_book():
    response = client.patch("/books/2/star", json={"starred": False})

    assert response.status_code == 200
    updated = response.json()
    assert updated["id"] == 2
    assert updated["starred"] is False


def test_update_book_star_returns_404_for_unknown_book():
    response = client.patch("/books/999/star", json={"starred": True})

    assert response.status_code == 404
    assert response.json() == {"detail": "Book not found"}


def test_update_book_star_requires_starred_boolean():
    response = client.patch("/books/1/star", json={})

    assert response.status_code == 422
