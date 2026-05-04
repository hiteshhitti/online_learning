from jose import jwt, JWTError
from datetime import datetime, timedelta
from fastapi import HTTPException, Header
from typing import Optional
import hashlib
import os

SECRET           = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
ADMIN_SECRET     = os.getenv("ADMIN_SECRET", "admin-secret-change-in-production")
ALGORITHM        = "HS256"
EXPIRE_MINUTES   = 60 * 24 * 7   # 7 days

def create_token(data: dict) -> str:
    payload = {**data, "exp": datetime.utcnow() + timedelta(minutes=EXPIRE_MINUTES)}
    return jwt.encode(payload, SECRET, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    return jwt.decode(token, SECRET, algorithms=[ALGORITHM])

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(plain: str, hashed: str) -> bool:
    return hash_password(plain) == hashed

# ── Admin helpers ─────────────────────────────────────────────────────────────

def create_admin_token(email: str) -> str:
    payload = {"email": email, "role": "admin",
               "exp": datetime.utcnow() + timedelta(minutes=EXPIRE_MINUTES)}
    return jwt.encode(payload, ADMIN_SECRET, algorithm=ALGORITHM)

def require_admin(x_admin_token: Optional[str] = Header(None)):
    """FastAPI dependency — raises 401 if request is not from a valid admin."""
    if not x_admin_token:
        raise HTTPException(status_code=401, detail="Admin token required")
    try:
        payload = jwt.decode(x_admin_token, ADMIN_SECRET, algorithms=[ALGORITHM])
        if payload.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Not an admin")
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired admin token")
