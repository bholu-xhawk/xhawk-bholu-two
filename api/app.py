from fastapi import FastAPI, HTTPException, Response

app = FastAPI()

# In-memory mock user store for demo/tests only
USERS: dict[str, dict] = {}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.delete("/users/{user_id}", status_code=204)
def delete_user(user_id: str):
    # Delete a user from the in-memory store. 204 if deleted, 404 if not found.
    if user_id in USERS:
        del USERS[user_id]
        return Response(status_code=204)
    raise HTTPException(status_code=404, detail="not found")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)

