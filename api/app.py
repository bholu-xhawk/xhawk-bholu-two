from typing import Dict
from fastapi import FastAPI, HTTPException, Response

app = FastAPI()

# Simple in-memory store for demo purposes
ITEMS: Dict[str, dict] = {"1": {"id": "1", "name": "example"}}


@app.get("/health")
def health():
    return {"status": "ok"}

@app.delete("/items/{item_id}")
def delete_item(item_id: str):
    if item_id in ITEMS:
        del ITEMS[item_id]
        return Response(status_code=204)
    raise HTTPException(status_code=404, detail="Item not found")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
