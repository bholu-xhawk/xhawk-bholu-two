import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt
from pydantic import BaseModel, Field

# FastAPI app
app = FastAPI()

# CORS for local dev; harmless if using Vite proxy
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# JWT config
JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
ALLOWED_ROLES = {"Superadmin", "User"}


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1)
    role: str


class User(BaseModel):
    username: str
    role: str


def create_access_token(*, subject: str, role: str, expires_delta: Optional[timedelta] = None) -> str:
    if role not in ALLOWED_ROLES:
        raise ValueError("Invalid role")
    to_encode = {"sub": subject, "role": role}
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)
    return encoded_jwt


def get_current_user(request: Request) -> User:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    token = auth_header.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        if username is None or role is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
        if role not in ALLOWED_ROLES:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid role in token")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    return User(username=username, role=role)


def require_superadmin(user: User = Depends(get_current_user)) -> User:
    if user.role != "Superadmin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient privileges")
    return user


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/login")
def login(data: LoginRequest):
    if data.role not in ALLOWED_ROLES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unknown role")
    access_token = create_access_token(subject=data.username, role=data.role)
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/me")
def me(user: User = Depends(get_current_user)):
    return user


@app.get("/admin/only")
def admin_only(_: User = Depends(require_superadmin)):
    return {"ok": True, "message": "Superadmin access granted"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)

