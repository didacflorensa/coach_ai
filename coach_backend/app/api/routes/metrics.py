from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.metrics_calculator import rebuild_daily_metrics

router = APIRouter(prefix="/metrics", tags=["metrics"])


@router.post("/{athlete_id}/rebuild")
def rebuild(
    athlete_id: int,
    from_day: date | None = Query(default=None, description="YYYY-MM-DD"),
    to_day: date | None = Query(default=None, description="YYYY-MM-DD"),
    force: bool = Query(default=False, description="Recalcula tss/day aunque ya existan"),
    db: Session = Depends(get_db),
):
    return rebuild_daily_metrics(
        db=db,
        athlete_id=athlete_id,
        day_from=from_day,
        day_to=to_day,
        force=force,
    )
