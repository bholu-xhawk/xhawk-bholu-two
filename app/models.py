from typing import Optional
from pydantic import BaseModel, Field


class Todo(BaseModel):
    id: int
    title: str
    completed: bool = False


class TodoCreate(BaseModel):
    title: str = Field(..., min_length=1)


class TodoUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1)
    completed: Optional[bool] = None

