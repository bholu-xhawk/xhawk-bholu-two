from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()


class UserCreate(BaseModel):
    name: str
    email: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/users", status_code=201)
def create_user(user: UserCreate):
    return {
        "id": "mock-1",
        "name": user.name,
        "email": user.email,
        "status": "created",
        "created_at": "1970-01-01T00:00:00Z",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)

