from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel

app = FastAPI()


class MockItemRequest(BaseModel):
    name: str
    description: str = ""
    status: str = "pending"


class MockItem(MockItemRequest):
    id: int


_mock_items: dict[int, MockItem] = {}
_next_mock_item_id = 1


@app.get("/")
def read_root():
    return {"message": "Hello, World!"}


@app.post("/mock-items", response_model=MockItem, status_code=status.HTTP_201_CREATED)
def create_mock_item(item: MockItemRequest):
    global _next_mock_item_id

    mock_item = MockItem(
        id=_next_mock_item_id,
        name=item.name,
        description=item.description,
        status=item.status,
    )
    _mock_items[mock_item.id] = mock_item
    _next_mock_item_id += 1
    return mock_item


@app.get("/mock-items", response_model=list[MockItem])
def list_mock_items():
    return list(_mock_items.values())


@app.get("/mock-items/{item_id}", response_model=MockItem)
def get_mock_item(item_id: int):
    mock_item = _mock_items.get(item_id)
    if mock_item is None:
        raise HTTPException(status_code=404, detail="Mock item not found")
    return mock_item


@app.put("/mock-items/{item_id}", response_model=MockItem)
def update_mock_item(item_id: int, item: MockItemRequest):
    if item_id not in _mock_items:
        raise HTTPException(status_code=404, detail="Mock item not found")

    mock_item = MockItem(
        id=item_id,
        name=item.name,
        description=item.description,
        status=item.status,
    )
    _mock_items[item_id] = mock_item
    return mock_item


@app.delete("/mock-items/{item_id}")
def delete_mock_item(item_id: int):
    if item_id not in _mock_items:
        raise HTTPException(status_code=404, detail="Mock item not found")

    del _mock_items[item_id]
    return {"message": "Mock item deleted", "id": item_id}
