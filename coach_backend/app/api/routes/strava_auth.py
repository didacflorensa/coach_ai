from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.strava_client import StravaClient
from app.models.athlete_token import AthleteToken

router = APIRouter(prefix="/strava", tags=["strava-auth"])


@router.get("/login")
def strava_login(db: Session = Depends(get_db)):
    client = StravaClient(db)
    return {"auth_url": client.get_auth_url()}


@router.get("/callback")
def strava_callback(code: str = Query(...), db: Session = Depends(get_db)):
    client = StravaClient(db)
    payload = client.exchange_code(code)

    athlete_id = int(payload["athlete"]["id"])
    token_row = AthleteToken(
        athlete_id=athlete_id,
        access_token=payload["access_token"],
        refresh_token=payload["refresh_token"],
        expires_at=int(payload["expires_at"]),
    )
    # upsert simple
    existing = db.get(AthleteToken, athlete_id)
    if existing:
        existing.access_token = token_row.access_token
        existing.refresh_token = token_row.refresh_token
        existing.expires_at = token_row.expires_at
        db.add(existing)
    else:
        db.add(token_row)

    db.commit()
    return {"ok": True, "athlete_id": athlete_id}
