from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.strava_client import StravaClient
from app.services.activity_importer import upsert_activities

router = APIRouter(prefix="/strava", tags=["strava-activities"])


@router.post("/{athlete_id}/import-activities")
def import_activities(athlete_id: int, db: Session = Depends(get_db)):
    client = StravaClient(db)
    access_token = client.get_valid_access_token(athlete_id)

    total_fetched = 0
    total_saved = 0
    page = 1
    per_page = 200

    while True:
        items = client.list_activities(access_token, page=page, per_page=per_page)
        if not items:
            break
        total_fetched += len(items)
        total_saved += upsert_activities(db, athlete_id=athlete_id, activities=items)
        if len(items) < per_page:
            break
        page += 1

    return {
        "athlete_id": athlete_id,
        "fetched": total_fetched,
        "saved_or_updated": total_saved,
        "pages": page,
    }
