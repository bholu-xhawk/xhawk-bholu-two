import os
import hmac
from typing import Optional

from fastapi import Header, HTTPException


def require_api_key(x_api_key: Optional[str] = Header(None)) -> None:
    expected = os.getenv("ADMIN_API_KEY")
    if expected is None:
        return
    if not hmac.compare_digest(expected, x_api_key or ""):
        raise HTTPException(
            status_code=401,
            detail="Unauthorized",
            headers={"WWW-Authenticate": "ApiKey"},
        )
