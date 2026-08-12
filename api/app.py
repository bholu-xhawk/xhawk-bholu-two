from fastapi import FastAPI

app = FastAPI()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/todo/user")
def get_todo_user():
    return {"id": 1, "name": "Test User", "email": "test.user@example.com"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
