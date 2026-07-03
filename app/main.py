from typing import Optional, Dict

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, EmailStr

app = FastAPI()

# In-memory user store
USERS: Dict[int, Dict[str, str]] = {}
NEXT_ID: int = 1


class UserCreate(BaseModel):
    name: str
    email: EmailStr


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr


@app.get("/")
def read_root():
    return {"message": "Hello, World!"}


@app.post("/users", response_model=UserOut, status_code=201)
def create_user(user: UserCreate):
    global NEXT_ID
    user_id = NEXT_ID
    NEXT_ID += 1
    data = {"id": user_id, "name": user.name, "email": str(user.email)}
    USERS[user_id] = data
    return data


@app.get("/users/{user_id}", response_model=UserOut)
def get_user(user_id: int):
    if user_id not in USERS:
        raise HTTPException(status_code=404, detail="User not found")
    return USERS[user_id]


@app.patch("/users/{user_id}", response_model=UserOut)
def update_user(user_id: int, updates: UserUpdate):
    if user_id not in USERS:
        raise HTTPException(status_code=404, detail="User not found")
    stored = USERS[user_id]
    update_data = updates.dict(exclude_unset=True)
    # Ensure we convert EmailStr to string if provided
    if "email" in update_data and update_data["email"] is not None:
        update_data["email"] = str(update_data["email"])
    stored.update(update_data)
    USERS[user_id] = stored
    return stored


@app.delete("/users/{user_id}", status_code=204)
def delete_user(user_id: int):
    if user_id not in USERS:
        raise HTTPException(status_code=404, detail="User not found")
    del USERS[user_id]
    return None

