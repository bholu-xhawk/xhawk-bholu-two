from fastapi import FastAPI

from api.routers.admin_members import router as admin_members_router

app = FastAPI()

# Include admin members router
app.include_router(admin_members_router)


@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)

