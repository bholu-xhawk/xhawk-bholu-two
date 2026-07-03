from fastapi.testclient import TestClient
from api.app import app, USERS


def test_delete_user_endpoint():
    client = TestClient(app)

    # ensure clean state and seed
    USERS.clear()
    USERS["abc"] = {"id": "abc", "name": "Alice"}

    # first delete should succeed with 204
    resp = client.delete("/users/abc")
    assert resp.status_code == 204
    assert resp.text == ""  # No Content

    # subsequent delete should return 404
    resp2 = client.delete("/users/abc")
    assert resp2.status_code == 404
    body = resp2.json()
    assert body["detail"] == "not found"
