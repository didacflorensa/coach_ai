from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db.session import get_db  # ajusta
from app.models.app_users import AppUser
from app.auth.security import decode_access_token

bearer = HTTPBearer(auto_error=False)

def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db),
) -> AppUser:
    if creds is None or not creds.credentials:
        raise HTTPException(status_code=401, detail="missing bearer token")

    try:
        payload = decode_access_token(creds.credentials)
    except ValueError:
        raise HTTPException(status_code=401, detail="invalid token")

    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="invalid token type")

    user_id = int(payload["sub"])
    user = db.execute(select(AppUser).where(AppUser.id == user_id)).scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="user not found or inactive")
    return user
