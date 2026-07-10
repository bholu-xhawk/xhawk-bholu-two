from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, constr
from typing import List

app = FastAPI()

# CORS to allow local Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5173",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Todo(BaseModel):
    id: int
    text: str
    completed: bool = False


class TodoCreate(BaseModel):
    text: constr(strip_whitespace=True, min_length=1, max_length=256)


class TodoUpdate(BaseModel):
    completed: bool


# In-memory store
TODOS: List[Todo] = []
NEXT_ID: int = 1


@app.get("/")
def read_root():
    return {"message": "Hello, World!"}


@app.get("/todos", response_model=List[Todo])
def list_todos() -> List[Todo]:
    return TODOS


@app.post("/todos", response_model=Todo, status_code=201)
def create_todo(payload: TodoCreate) -> Todo:
    global NEXT_ID
    todo = Todo(id=NEXT_ID, text=payload.text, completed=False)
    NEXT_ID += 1
    TODOS.append(todo)
    return todo


@app.patch("/todos/{todo_id}", response_model=Todo)
def update_todo(todo_id: int, payload: TodoUpdate) -> Todo:
    for idx, t in enumerate(TODOS):
        if t.id == todo_id:
            updated = Todo(id=t.id, text=t.text, completed=payload.completed)
            TODOS[idx] = updated
            return updated
    raise HTTPException(status_code=404, detail="Todo not found")


@app.delete("/todos/{todo_id}")
def delete_todo(todo_id: int):
    for idx, t in enumerate(TODOS):
        if t.id == todo_id:
            TODOS.pop(idx)
            return {"deleted": True}
    raise HTTPException(status_code=404, detail="Todo not found")

