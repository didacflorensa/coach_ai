from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, desc

from app.db.session import get_db
from app.models.daily_metrics import DailyMetric

router = APIRouter(tags=["daily-metrics"])


def daily_metrics_to_dict(dm: DailyMetric) -> dict[str, Any]:
    """Devuelve TODOS los campos del modelo DailyMetrics"""
    return {c.name: getattr(dm, c.name) for c in dm.__table__.columns}


@router.get("/athletes/{athlete_id}/daily-metrics/latest")
def get_latest_daily_metrics(
    athlete_id: int,
    db: Session = Depends(get_db),
):
    q = (
        select(DailyMetric)
        .where(DailyMetric.athlete_id == athlete_id)
        .order_by(desc(DailyMetric.day))
        .limit(1)
    )

    dm = db.execute(q).scalars().first()

    if not dm:
        raise HTTPException(status_code=404, detail="No daily_metrics found for athlete")

    return daily_metrics_to_dict(dm)
