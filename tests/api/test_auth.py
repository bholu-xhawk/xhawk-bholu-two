from datetime import timedelta, datetime, timezone

from fastapi.testclient import TestClient
from api.app import app, create_access_token, ALGORITHM, JWT_SECRET

client = TestClient(app)


def get_auth_header(token: str):
    return {"Authorization": f"Bearer {token}"}


def test_login_superadmin_returns_token():
    response = client.post("/login", json={"username": "alice", "role": "Superadmin"})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_me_returns_user_profile():
    token_resp = client.post("/login", json={"username": "bob", "role": "Superadmin"})
    token = token_resp.json()["access_token"]
    me = client.get("/me", headers=get_auth_header(token))
    assert me.status_code == 200
    body = me.json()
    assert body["username"] == "bob"
    assert body["role"] == "Superadmin"


def test_admin_only_allows_superadmin_and_denies_others():
    superadmin_token = client.post("/login", json={"username": "sue", "role": "Superadmin"}).json()["access_token"]
    user_token = client.post("/login", json={"username": "u1", "role": "User"}).json()["access_token"]

    ok = client.get("/admin/only", headers=get_auth_header(superadmin_token))
    assert ok.status_code == 200

    forbidden = client.get("/admin/only", headers=get_auth_header(user_token))
    assert forbidden.status_code == 403

    unauth = client.get("/admin/only")
    assert unauth.status_code == 401


def test_expired_token_is_rejected():
    # create an already-expired token
    expired_token = create_access_token(subject="x", role="Superadmin", expires_delta=timedelta(minutes=-1))
    r = client.get("/me", headers=get_auth_header(expired_token))
    assert r.status_code == 401
