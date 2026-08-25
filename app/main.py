from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Books API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Book(BaseModel):
    id: int
    name: str
    details: str = ""
    authors: list[str] | str = ""
    starred: bool = False


class StarUpdate(BaseModel):
    starred: bool


_BOOKS: dict[int, Book] = {
    1: Book(
        id=1,
        name="The Pragmatic Programmer",
        details="Practical guidance for writing adaptable, maintainable software.",
        authors=["Andrew Hunt", "David Thomas"],
        starred=False,
    ),
    2: Book(
        id=2,
        name="Clean Code",
        details="Patterns and practices for improving code readability.",
        authors=["Robert C. Martin"],
        starred=True,
    ),
    3: Book(
        id=3,
        name="Designing Data-Intensive Applications",
        details="A tour of reliable, scalable, and maintainable data systems.",
        authors="Martin Kleppmann",
        starred=False,
    ),
}


@app.get("/")
def read_root():
    return {"message": "Hello, World!"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/books", response_model=list[Book])
def list_books():
    return list(_BOOKS.values())


@app.patch("/books/{book_id}/star", response_model=Book)
def update_book_star(book_id: int, update: StarUpdate):
    book = _BOOKS.get(book_id)
    if book is None:
        raise HTTPException(status_code=404, detail="Book not found")

    updated_book = book.model_copy(update={"starred": update.starred})
    _BOOKS[book_id] = updated_book
    return updated_book
