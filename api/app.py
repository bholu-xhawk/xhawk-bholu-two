from typing import Annotated, Any

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, StringConstraints

app = FastAPI()

TodoTitle = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class TodoCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: TodoTitle
    completed: bool = False
    description: str | None = None


class TodoUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: TodoTitle = None
    completed: bool = None
    description: str | None = None


_mock_todos: dict[int, dict[str, Any]] = {}
_next_todo_id = 1


def success_response(data: Any, status_code: int = status.HTTP_200_OK) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"success": True, "data": data, "error": None},
    )


def error_response(
    code: str,
    message: str,
    status_code: int = status.HTTP_400_BAD_REQUEST,
) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "data": None,
            "error": {"code": code, "message": message},
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    _request: Request, _exc: RequestValidationError
) -> JSONResponse:
    return error_response(
        "VALIDATION_ERROR",
        "Request validation failed.",
        422,
    )


def _reset_mock_todos() -> None:
    global _next_todo_id
    _mock_todos.clear()
    _next_todo_id = 1


def _next_id() -> int:
    global _next_todo_id
    todo_id = _next_todo_id
    _next_todo_id += 1
    return todo_id


def _todo_not_found(todo_id: int) -> JSONResponse:
    return error_response(
        "TODO_NOT_FOUND",
        f"Todo {todo_id} was not found.",
        status.HTTP_404_NOT_FOUND,
    )


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/todos")
def create_todo(todo: TodoCreate):
    todo_id = _next_id()
    new_todo = {
        "id": todo_id,
        "title": todo.title,
        "completed": todo.completed,
        "description": todo.description,
    }
    _mock_todos[todo_id] = new_todo
    return success_response(new_todo, status.HTTP_201_CREATED)


@app.get("/todos")
def list_todos():
    return success_response(list(_mock_todos.values()))


@app.get("/todos/{todo_id}")
def get_todo(todo_id: int):
    todo = _mock_todos.get(todo_id)
    if todo is None:
        return _todo_not_found(todo_id)
    return success_response(todo)


@app.patch("/todos/{todo_id}")
def update_todo(todo_id: int, update: TodoUpdate):
    todo = _mock_todos.get(todo_id)
    if todo is None:
        return _todo_not_found(todo_id)

    updated_fields = update.model_fields_set
    if not updated_fields:
        return error_response(
            "EMPTY_UPDATE",
            "At least one todo field must be provided.",
            status.HTTP_400_BAD_REQUEST,
        )

    update_data = update.model_dump(include=updated_fields)
    todo.update(update_data)
    return success_response(todo)


@app.delete("/todos/{todo_id}")
def delete_todo(todo_id: int):
    todo = _mock_todos.pop(todo_id, None)
    if todo is None:
        return _todo_not_found(todo_id)
    return success_response(todo)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
