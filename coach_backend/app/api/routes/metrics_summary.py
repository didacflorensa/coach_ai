from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, desc

from app.db.session import get_db
from app.models.daily_metrics import DailyMetric  # ajusta si tu archivo se llama distinto

router = APIRouter(tags=["metrics-summary"])


def daily_metric_to_dict(dm: DailyMetric) -> dict[str, Any]:
    return {
        "day": dm.day,
        "ctl": round(dm.ctl, 1) if dm.ctl is not None else None,
        "atl": round(dm.atl, 1) if dm.atl is not None else None,
        "tsb": round(dm.tsb, 1) if dm.tsb is not None else None,
    }


@router.get("/athletes/{athlete_id}/metrics/ctl-atl/last-7-days")
def get_ctl_atl_last_7_days(
    athlete_id: int,
    db: Session = Depends(get_db),
):
    """
    Devuelve CTL / ATL / TSB de los últimos 7 días disponibles.
    Ordenado por día ascendente.
    """
    q = (
        select(DailyMetric)
        .where(DailyMetric.athlete_id == athlete_id)
        .order_by(desc(DailyMetric.day))
        .limit(7)
    )

    rows = db.execute(q).scalars().all()

    if not rows:
        raise HTTPException(status_code=404, detail="No daily metrics found")

    # los pedimos DESC para el limit, pero devolvemos ASC para gráficas
    rows = list(reversed(rows))

    return {
        "athlete_id": athlete_id,
        "days": len(rows),
        "metrics": [daily_metric_to_dict(dm) for dm in rows],
    }
