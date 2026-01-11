from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db.session import get_db
from app.models.activity import Activity
from app.schemas.activity_write import ActivityCreate, ActivityPatch
from app.services.metrics_calculator import compute_activity_day  # ya lo tienes


router = APIRouter(tags=["activities-write"])


def activity_to_dict(a: Activity) -> dict[str, Any]:
    return {c.name: getattr(a, c.name) for c in a.__table__.columns}


@router.post("/athletes/{athlete_id}/activities")
def create_activity(
    athlete_id: int,
    payload: ActivityCreate,
    db: Session = Depends(get_db),
):
    # 1) asegurar que no existe ya
    q = select(Activity).where(
        Activity.athlete_id == athlete_id,
        Activity.strava_activity_id == payload.strava_activity_id,
    )
    existing = db.execute(q).scalars().first()
    if existing:
        raise HTTPException(status_code=409, detail="Activity already exists for this strava_activity_id")

    a = Activity(
        athlete_id=athlete_id,
        strava_activity_id=payload.strava_activity_id,

        name=payload.name or "",
        sport_type=payload.sport_type,
        start_date=payload.start_date,
        timezone=payload.timezone or "",

        distance_m=payload.distance_m or 0.0,
        moving_time_s=payload.moving_time_s or 0,
        elapsed_time_s=payload.elapsed_time_s or 0,
        total_elevation_gain_m=payload.total_elevation_gain_m or 0.0,

        average_speed=payload.average_speed,
        max_speed=payload.max_speed,
        average_cadence=payload.average_cadence,
        average_temp=payload.average_temp,

        average_watts=payload.average_watts,
        max_watts=payload.max_watts,
        weighted_average_watts=payload.weighted_average_watts,
        kilojoules=payload.kilojoules,

        average_heartrate=payload.average_heartrate,
        max_heartrate=payload.max_heartrate,

        elev_high=payload.elev_high,
        elev_low=payload.elev_low,
        suffer_score=payload.suffer_score,

        trainer=bool(payload.trainer or False),
    )

    # day local
    a.day = compute_activity_day(a)

    db.add(a)
    db.commit()
    db.refresh(a)

    return activity_to_dict(a)


@router.patch("/athletes/{athlete_id}/activities/{strava_activity_id}")
def patch_activity(
    athlete_id: int,
    strava_activity_id: int,
    payload: ActivityPatch,
    db: Session = Depends(get_db),
):
    q = select(Activity).where(
        Activity.athlete_id == athlete_id,
        Activity.strava_activity_id == strava_activity_id,
    )
    a = db.execute(q).scalars().first()
    if not a:
        raise HTTPException(status_code=404, detail="Activity not found")

    data = payload.model_dump(exclude_unset=True)

    # Aplicar cambios campo a campo (solo lo que venga)
    for k, v in data.items():
        setattr(a, k, v)

    # Si cambia start_date o timezone, recalculamos day
    if "start_date" in data or "timezone" in data:
        a.day = compute_activity_day(a)

    db.add(a)
    db.commit()
    db.refresh(a)

    return activity_to_dict(a)
