from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db.session import get_db  # ajusta
from app.models.app_users import AppUser
from app.models.app_refresh_tokens import AppRefreshToken
from app.models.app_user_athlete import AppUserAthlete  # opcional
from app.schemas.auth import (
    RegisterIn, LoginIn, TokenOut, RefreshIn, LogoutIn, MeOut, LinkAthleteIn
)
from app.auth.security import (
    hash_password, verify_password, create_access_token,
    create_refresh_token, hash_refresh_token
)
from app.config import settings
from app.auth.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=MeOut, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterIn, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()

    exists = db.execute(select(AppUser).where(AppUser.email == email)).scalar_one_or_none()
    if exists:
        raise HTTPException(status_code=409, detail="email already registered")

    user = AppUser(
        email=email,
        password_hash=hash_password(payload.password),
        is_active=True,
        is_verified=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()

    user = db.execute(select(AppUser).where(AppUser.email == email)).scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="invalid credentials")

    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="invalid credentials")

    user.last_login_at = datetime.now(timezone.utc)

    access = create_access_token(user.id)
    refresh = create_refresh_token()
    refresh_hash = hash_refresh_token(refresh)

    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_days)

    db.add(AppRefreshToken(
        app_user_id=user.id,
        token_hash=refresh_hash,
        expires_at=expires_at,
        revoked_at=None,
    ))
    db.commit()

    athlete_ids = db.execute(
        select(AppUserAthlete.athlete_id).where(AppUserAthlete.app_user_id == user.id)
    ).scalars().all()

    primary_athlete_id = athlete_ids[0] if athlete_ids else None

    return TokenOut(
        access_token=access,
        refresh_token=refresh,
        athlete_id=primary_athlete_id,
    )

@router.post("/refresh", response_model=TokenOut)
def refresh(payload: RefreshIn, db: Session = Depends(get_db)):
    rh = hash_refresh_token(payload.refresh_token)

    token_row = db.execute(
        select(AppRefreshToken).where(AppRefreshToken.token_hash == rh)
    ).scalar_one_or_none()

    if not token_row:
        raise HTTPException(status_code=401, detail="invalid refresh token")

    now = datetime.now(timezone.utc)
    if token_row.revoked_at is not None or token_row.expires_at <= now:
        raise HTTPException(status_code=401, detail="refresh token expired or revoked")

    # Rotación de refresh token (recomendado)
    token_row.revoked_at = now

    user = db.execute(select(AppUser).where(AppUser.id == token_row.app_user_id)).scalar_one()
    access = create_access_token(user.id)

    new_refresh = create_refresh_token()
    new_hash = hash_refresh_token(new_refresh)
    expires_at = now + timedelta(days=settings.refresh_token_days)

    db.add(AppRefreshToken(
        app_user_id=user.id,
        token_hash=new_hash,
        expires_at=expires_at,
        revoked_at=None,
    ))
    db.commit()

    return TokenOut(access_token=access, refresh_token=new_refresh)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(payload: LogoutIn, db: Session = Depends(get_db)):
    rh = hash_refresh_token(payload.refresh_token)
    token_row = db.execute(
        select(AppRefreshToken).where(AppRefreshToken.token_hash == rh)
    ).scalar_one_or_none()

    if token_row and token_row.revoked_at is None:
        token_row.revoked_at = datetime.now(timezone.utc)
        db.commit()
    return None


@router.get("/me", response_model=MeOut)
def me(current_user: AppUser = Depends(get_current_user)):
    return current_user


# opcional: vincular un athlete_id a este usuario (si existe en athlete_profile)
@router.post("/link-athlete", status_code=status.HTTP_201_CREATED)
def link_athlete(
    payload: LinkAthleteIn,
    db: Session = Depends(get_db),
    current_user: AppUser = Depends(get_current_user),
):
    exists = db.execute(
        select(AppUserAthlete).where(
            AppUserAthlete.app_user_id == current_user.id,
            AppUserAthlete.athlete_id == payload.athlete_id,
        )
    ).scalar_one_or_none()
    if exists:
        return {"ok": True, "linked": True}

    db.add(AppUserAthlete(
        app_user_id=current_user.id,
        athlete_id=payload.athlete_id,
        role=payload.role,
    ))
    db.commit()
    return {"ok": True, "linked": True}
