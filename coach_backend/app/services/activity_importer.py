from __future__ import annotations

from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert

from app.models.activity import Activity


RUN_SPORTS = {"Run", "TrailRun", "VirtualRun", "RaceRun"}


def parse_dt(dt_str: str) -> datetime:
    # Strava devuelve ISO8601 tipo "2024-01-01T10:00:00Z"
    return datetime.fromisoformat(dt_str.replace("Z", "+00:00"))


def _normalize_sport_type(a: dict) -> str:
    return a.get("sport_type") or a.get("type") or ""


def _normalize_running_cadence(sport_type: str, raw_cadence) -> float | None:
    """
    Strava: en running devuelve cadence como pasos por minuto de UNA pierna.
    Para mostrar SPM total (izq+der), multiplicamos x2 SOLO en running.
    """
    if raw_cadence is None:
        return None
    try:
        c = float(raw_cadence)
    except (TypeError, ValueError):
        return None

    if sport_type in RUN_SPORTS:
        return c * 2.0
    return c


def upsert_activities(db: Session, athlete_id: int, activities: list[dict]) -> int:
    if not activities:
        return 0

    rows = []
    for a in activities:
        sport_type = _normalize_sport_type(a)

        cadence = _normalize_running_cadence(sport_type, a.get("average_cadence"))

        rows.append(
            {
                "athlete_id": athlete_id,
                "strava_activity_id": a["id"],

                "name": a.get("name") or "",
                "sport_type": sport_type,
                "start_date": parse_dt(a["start_date"]),
                "timezone": a.get("timezone") or "",

                "distance_m": float(a.get("distance") or 0.0),
                "moving_time_s": int(a.get("moving_time") or 0),
                "elapsed_time_s": int(a.get("elapsed_time") or 0),
                "total_elevation_gain_m": float(a.get("total_elevation_gain") or 0.0),

                # ---- CAMPOS Strava summary ----
                "average_speed": a.get("average_speed"),
                "max_speed": a.get("max_speed"),
                "average_cadence": cadence,  # 👈 aplicado x2 si run
                "average_temp": a.get("average_temp"),

                "average_watts": a.get("average_watts"),
                "max_watts": a.get("max_watts"),
                "weighted_average_watts": a.get("weighted_average_watts"),

                "kilojoules": a.get("kilojoules"),

                "average_heartrate": a.get("average_heartrate"),
                "max_heartrate": a.get("max_heartrate"),

                "elev_high": a.get("elev_high"),
                "elev_low": a.get("elev_low"),

                "suffer_score": a.get("suffer_score"),

                "trainer": bool(a.get("trainer") or False),
            }
        )

    stmt = insert(Activity).values(rows)

    update_cols = {
        "name": stmt.excluded.name,
        "sport_type": stmt.excluded.sport_type,
        "start_date": stmt.excluded.start_date,
        "timezone": stmt.excluded.timezone,
        "distance_m": stmt.excluded.distance_m,
        "moving_time_s": stmt.excluded.moving_time_s,
        "elapsed_time_s": stmt.excluded.elapsed_time_s,
        "total_elevation_gain_m": stmt.excluded.total_elevation_gain_m,

        "average_heartrate": stmt.excluded.average_heartrate,
        "max_heartrate": stmt.excluded.max_heartrate,

        "average_watts": stmt.excluded.average_watts,
        "max_watts": stmt.excluded.max_watts,
        "weighted_average_watts": stmt.excluded.weighted_average_watts,

        "kilojoules": stmt.excluded.kilojoules,

        "average_speed": stmt.excluded.average_speed,
        "max_speed": stmt.excluded.max_speed,
        "average_cadence": stmt.excluded.average_cadence,  # 👈 ya normalizada
        "average_temp": stmt.excluded.average_temp,

        "elev_high": stmt.excluded.elev_high,
        "elev_low": stmt.excluded.elev_low,
        "suffer_score": stmt.excluded.suffer_score,

        "trainer": stmt.excluded.trainer,
        "athlete_id": stmt.excluded.athlete_id,
        "updated_at": datetime.utcnow(),
    }

    stmt = stmt.on_conflict_do_update(
        constraint="uq_activity_strava_id",
        set_=update_cols,
    )

    result = db.execute(stmt)
    db.commit()
    return result.rowcount or len(rows)
