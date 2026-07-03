from typing import Any

from fastapi import Body, FastAPI, Response

app = FastAPI()


def _build_mock_response(payload: dict[str, Any]) -> dict[str, Any]:
    mock_fields = {
        "id": "mock-123",
        "created_at": "1970-01-01T00:00:00Z",
        "status": "mock",
    }
    result: dict[str, Any] = dict(payload)
    result.update(mock_fields)
    return result


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/test/mock", status_code=201)
def post_mock(payload: dict[str, Any] = Body(...), response: Response = None):
    merged = _build_mock_response(payload)
    # Set Location header to emulate creation semantics
    response.headers["Location"] = "/test/mock/mock-123"
    return merged


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)

