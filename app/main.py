import os
from typing import List

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from .models import Todo, TodoCreate, TodoUpdate
from .storage import TodoStore

app = FastAPI()

# CORS for Vite dev server
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# storage instance
store = TodoStore(os.getenv("TODO_FILE", "app/todos.json"))


@app.get("/")
def read_root():
    return {"message": "Hello, World!"}


@app.get("/todos", response_model=List[Todo])
def list_todos():
    return store.list()


@app.post("/todos", response_model=Todo, status_code=status.HTTP_201_CREATED)
def create_todo(payload: TodoCreate):
    todo = store.add(payload.title)
    return todo


@app.patch("/todos/{todo_id}", response_model=Todo)
def update_todo(todo_id: int, payload: TodoUpdate):
    try:
        updated = store.update(
            todo_id,
            title=payload.title if payload.title is not None else None,
            completed=payload.completed if payload.completed is not None else None,
        )
        return updated
    except KeyError:
        raise HTTPException(status_code=404, detail="Todo not found")


@app.delete("/todos/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo(todo_id: int):
    try:
        store.delete(todo_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Todo not found")

