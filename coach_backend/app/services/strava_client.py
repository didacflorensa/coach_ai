from __future__ import annotations
import time
import httpx
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.athlete_token import AthleteToken


STRAVA_BASE = "https://www.strava.com"


class StravaClient:
    def __init__(self, db: Session):
        self.db = db

    def get_auth_url(self, scope: str = "read,activity:read_all") -> str:
        # Strava recomienda activity:read_all para actividades privadas
        return (
            f"{STRAVA_BASE}/oauth/authorize"
            f"?client_id={settings.STRAVA_CLIENT_ID}"
            f"&redirect_uri={settings.STRAVA_REDIRECT_URI}"
            f"&response_type=code"
            f"&approval_prompt=auto"
            f"&scope={scope}"
        )

    def exchange_code(self, code: str) -> dict:
        url = f"{STRAVA_BASE}/oauth/token"
        data = {
            "client_id": settings.STRAVA_CLIENT_ID,
            "client_secret": settings.STRAVA_CLIENT_SECRET,
            "code": code,
            "grant_type": "authorization_code",
        }
        r = httpx.post(url, data=data, timeout=30)
        r.raise_for_status()
        return r.json()

    def refresh_access_token(self, refresh_token: str) -> dict:
        url = f"{STRAVA_BASE}/oauth/token"
        data = {
            "client_id": settings.STRAVA_CLIENT_ID,
            "client_secret": settings.STRAVA_CLIENT_SECRET,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token",
        }
        r = httpx.post(url, data=data, timeout=30)
        r.raise_for_status()
        return r.json()

    def get_valid_access_token(self, athlete_id: int) -> str:
        token_row = self.db.get(AthleteToken, athlete_id)
        if not token_row:
            raise ValueError("No hay tokens guardados para este athlete_id. Autoriza primero.")

        now = int(time.time())
        if token_row.expires_at <= now + 60:
            payload = self.refresh_access_token(token_row.refresh_token)
            token_row.access_token = payload["access_token"]
            token_row.refresh_token = payload["refresh_token"]
            token_row.expires_at = payload["expires_at"]
            self.db.add(token_row)
            self.db.commit()
            self.db.refresh(token_row)

        return token_row.access_token

    def list_activities(self, access_token: str, page: int = 1, per_page: int = 200) -> list[dict]:
        url = f"{STRAVA_BASE}/api/v3/athlete/activities"
        headers = {"Authorization": f"Bearer {access_token}"}
        params = {"page": page, "per_page": per_page}
        r = httpx.get(url, headers=headers, params=params, timeout=30)
        r.raise_for_status()
        return r.json()
