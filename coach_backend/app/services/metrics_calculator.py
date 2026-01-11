from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timedelta
from math import sqrt
from zoneinfo import ZoneInfo

from sqlalchemy import select, func, case
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert

from app.models.activity import Activity
from app.models.athlete_profile import AthleteProfile
from app.models.daily_metrics import DailyMetric

# ---------- helpers de timezone ----------

def _extract_tz_name(strava_tz: str | None) -> str | None:
    """
    Strava suele devolver:
      "(GMT+01:00) Europe/Madrid"
    o a veces "Europe/Madrid"
    """
    if not strava_tz:
        return None
    s = strava_tz.strip()
    if s.startswith("(") and " " in s:
        return s.split(" ", 1)[1].strip()
    return s


def compute_activity_day(activity: Activity) -> date:
    tz_name = _extract_tz_name(getattr(activity, "timezone", None))
    if tz_name:
        try:
            tz = ZoneInfo(tz_name)
            return activity.start_date.astimezone(tz).date()
        except Exception:
            pass
    return activity.start_date.date()


# ---------- cálculo de TSS / IF / Work / EF ----------

@dataclass
class ActivityMetrics:
    tss: float
    tss_method: str
    if_value: float | None
    if_method: str | None
    work_kj: float | None
    ef: float | None
    ef_method: str | None


def _sport_bucket(sport_type: str) -> str:
    s = (sport_type or "").lower()
    if "ride" in s or "bike" in s or "cycling" in s:
        return "cycling"
    if "run" in s:
        return "running"
    return "other"


def _avg_speed_mps(activity: Activity) -> float | None:
    dist = float(activity.distance_m or 0.0)
    secs = float(activity.moving_time_s or 0.0)
    if dist > 0 and secs > 0:
        return dist / secs
    return None


def compute_activity_metrics(activity: Activity, profile: AthleteProfile | None) -> ActivityMetrics:
    seconds = float(activity.moving_time_s or 0)
    if seconds <= 0:
        return ActivityMetrics(
            tss=0.0, tss_method="no_duration",
            if_value=None, if_method=None,
            work_kj=None,
            ef=None, ef_method=None
        )

    hours = seconds / 3600.0
    sport = _sport_bucket(activity.sport_type)

    ftp = float(getattr(profile, "ftp_watts", 0.0) or 0.0) if profile else 0.0
    lthr = float(getattr(profile, "lthr_bpm", 0.0) or 0.0) if profile else 0.0
    thr_pace = float(getattr(profile, "threshold_pace_sec_per_km", 0.0) or 0.0) if profile else 0.0

    avg_watts = getattr(activity, "average_watts", None)
    weighted_watts = getattr(activity, "weighted_average_watts", None)
    power_for_calc = weighted_watts if weighted_watts is not None else avg_watts

    avg_hr = getattr(activity, "average_heartrate", None)

    # Inicializaciones seguras
    work_kj: float | None = None
    ef: float | None = None
    ef_method: str | None = None

    # IF + TSS
    if_value: float | None = None
    if_method: str | None = None
    tss_method: str

    if sport == "cycling" and power_for_calc is not None and ftp > 0:
        if_value = float(power_for_calc) / ftp
        if_method = "power_if_weighted_watts" if weighted_watts is not None else "power_if_avg_watts"
        tss = hours * (if_value ** 2) * 100.0
        tss_method = "power_tss_weighted_watts" if weighted_watts is not None else "power_tss_avg_watts"



    elif sport == "running" and thr_pace > 0 and (activity.distance_m or 0) > 0:
        km = float(activity.distance_m) / 1000.0
        if km > 0:
            pace = seconds / km
            if_value = thr_pace / pace
            if_method = "pace_if"
            tss = hours * (if_value ** 2) * 100.0
            tss_method = "pace_tss"
        else:
            if_value, if_method = None, None
            tss, tss_method = 0.0, "no_distance"

    elif avg_hr is not None and lthr > 0:
        if_value = float(avg_hr) / lthr
        if_method = "hr_if"
        tss = hours * (if_value ** 2) * 100.0
        tss_method = "hr_tss"

    else:
        if sport == "cycling":
            if_value = 0.60
        elif sport == "running":
            if_value = 0.55
        else:
            if_value = 0.50
        if_method = "fallback_if"
        tss = hours * (if_value ** 2) * 100.0
        tss_method = "fallback_duration"

    tss = max(0.0, float(tss))

    # ---------- Work (kJ) ----------
    kj = getattr(activity, "kilojoules", None)
    if kj is not None:
        work_kj = float(kj)
    elif sport == "cycling":
        watts_for_work = power_for_calc
        if watts_for_work is not None and seconds > 0:
            work_kj = (float(watts_for_work) * seconds) / 1000.0


    # EF
    ef: float | None = None
    ef_method: str | None = None
    if avg_hr is not None and float(avg_hr) > 0:
        if sport == "cycling" and avg_watts is not None:
            ef = float(avg_watts) / float(avg_hr)
            ef_method = "power_per_hr"
        else:
            spd = _avg_speed_mps(activity)
            if spd is not None:
                ef = float(spd) / float(avg_hr)
                ef_method = "speed_per_hr"

    return ActivityMetrics(
        tss=tss, tss_method=tss_method,
        if_value=if_value, if_method=if_method,
        work_kj=work_kj,
        ef=ef, ef_method=ef_method,
    )


# ---------- helpers semanales ----------

def week_start_monday(d: date) -> date:
    return d - timedelta(days=d.weekday())


def compute_weekly_summary(db: Session, athlete_id: int, from_day: date, to_day: date) -> dict:
    row_today = db.execute(
        select(DailyMetric).where(DailyMetric.athlete_id == athlete_id, DailyMetric.day == to_day)
    ).scalars().first()

    row_prev7 = db.execute(
        select(DailyMetric).where(DailyMetric.athlete_id == athlete_id, DailyMetric.day == (to_day - timedelta(days=7)))
    ).scalars().first()

    ramp_rate_7d = None
    if row_today and row_prev7:
        ramp_rate_7d = float(row_today.ctl) - float(row_prev7.ctl)

    profile = db.get(AthleteProfile, athlete_id)
    target = float(getattr(profile, "target_weekly_tss", 0.0) or 0.0) if profile else 0.0
    target_weekly_tss = target if target > 0 else None

    q = (
        select(DailyMetric.day, DailyMetric.tss)
        .where(DailyMetric.athlete_id == athlete_id)
        .where(DailyMetric.day >= from_day, DailyMetric.day <= to_day)
        .order_by(DailyMetric.day.asc())
    )
    rows = db.execute(q).all()

    buckets: dict[date, float] = {}
    for d, tss in rows:
        ws = week_start_monday(d)
        buckets[ws] = buckets.get(ws, 0.0) + float(tss or 0.0)

    weeks = []
    for ws in sorted(buckets.keys()):
        tss_week = float(buckets[ws])
        compliance = None
        if target_weekly_tss:
            compliance = tss_week / float(target_weekly_tss)
        weeks.append(
            {
                "week_start": str(ws),
                "tss_week": tss_week,
                "target_weekly_tss": target_weekly_tss,
                "compliance": compliance,
            }
        )

    return {"ramp_rate_7d": ramp_rate_7d, "weeks": weeks}


# ---------- rebuild principal ----------

def rebuild_daily_metrics(
    db: Session,
    athlete_id: int,
    day_from: date | None = None,
    day_to: date | None = None,
    force: bool = False,
) -> dict:
    profile = db.get(AthleteProfile, athlete_id)

    # 1) todas las actividades del atleta
    q_all = (
        select(Activity)
        .where(Activity.athlete_id == athlete_id)
        .order_by(Activity.start_date.asc())
    )
    acts_all = db.execute(q_all).scalars().all()

    if not acts_all:
        return {
            "athlete_id": athlete_id,
            "updated_activities": 0,
            "daily_rows": 0,
            "range": None,
            "note": "No hay actividades para este atleta.",
        }

    # 2) rellenar day antes de filtrar
    updated_days = 0
    for a in acts_all:
        if force or a.day is None:
            a.day = compute_activity_day(a)
            updated_days += 1
        db.add(a)
    db.commit()

    # 3) filtrar por rango
    acts = acts_all
    if day_from:
        acts = [a for a in acts if a.day is not None and a.day >= day_from]
    if day_to:
        acts = [a for a in acts if a.day is not None and a.day <= day_to]

    if not acts:
        return {
            "athlete_id": athlete_id,
            "updated_activities": updated_days,
            "daily_rows": 0,
            "range": {"from": str(day_from) if day_from else None, "to": str(day_to) if day_to else None},
            "note": "No hay actividades en el rango indicado.",
        }

    # 4) calcular métricas por actividad
    updated_activity_metrics = 0
    for a in acts:
        sport = _sport_bucket(a.sport_type)
        needs_work = (sport == "cycling" and a.work_kj is None)
        needs = force or (a.tss is None) or (a.if_value is None) or (a.ef is None) or needs_work
        if needs:
            m = compute_activity_metrics(a, profile)
            a.tss = m.tss
            a.tss_method = m.tss_method
            a.if_value = m.if_value
            a.if_method = m.if_method
            a.work_kj = m.work_kj
            a.ef = m.ef
            a.ef_method = m.ef_method
            updated_activity_metrics += 1
        db.add(a)
    db.commit()

    # rango real
    min_day = min(a.day for a in acts if a.day is not None)
    max_day = max(a.day for a in acts if a.day is not None)

    # 5) agregados diarios desde activities: tss, duración, work_kj, EF ponderado
    # EF ponderado por tiempo: sum(ef * secs) / sum(secs) usando solo filas con ef != NULL
    agg_q = (
        select(
            Activity.day.label("day"),
            func.coalesce(func.sum(Activity.tss), 0.0).label("tss"),
            func.coalesce(func.sum(Activity.moving_time_s), 0).label("duration_s"),
            func.coalesce(func.sum(func.coalesce(Activity.work_kj, 0.0)), 0.0).label("work_kj"),
            func.coalesce(
                func.sum(
                    func.coalesce(Activity.ef, 0.0) * func.coalesce(Activity.moving_time_s, 0)
                ),
                0.0
            ).label("ef_weighted_sum"),
            func.coalesce(
                func.sum(
                    case(
                        (Activity.ef.is_not(None), func.coalesce(Activity.moving_time_s, 0)),
                        else_=0
                    )
                ),
                0
            ).label("ef_weighted_secs"),
        )
        .where(Activity.athlete_id == athlete_id)
        .where(Activity.day >= min_day, Activity.day <= max_day)
        .group_by(Activity.day)
        .order_by(Activity.day.asc())
    )
    daily_rows = db.execute(agg_q).all()

    # Creamos mapa por día
    daily_map = {}
    for r in daily_rows:
        d = r.day
        daily_map[d] = {
            "tss": float(r.tss or 0.0),
            "duration_s": int(r.duration_s or 0),
            "work_kj": float(r.work_kj or 0.0),
            "ef_weighted_sum": float(r.ef_weighted_sum or 0.0),
            "ef_weighted_secs": int(r.ef_weighted_secs or 0),
        }

    # lista completa de días (incluye días sin entreno)
    days: list[date] = []
    cur = min_day
    while cur <= max_day:
        days.append(cur)
        cur += timedelta(days=1)

    # semilla ctl/atl
    prev = db.execute(
        select(DailyMetric)
        .where(DailyMetric.athlete_id == athlete_id)
        .where(DailyMetric.day < min_day)
        .order_by(DailyMetric.day.desc())
        .limit(1)
    ).scalars().first()

    ctl_prev = float(prev.ctl) if prev else 0.0
    atl_prev = float(prev.atl) if prev else 0.0

    CTL_TC = 42.0
    ATL_TC = 7.0

    # upsert daily_metrics con nuevos campos
    upserted = 0
    now = datetime.utcnow()

    for d in days:
        data = daily_map.get(d, None)
        tss = float(data["tss"]) if data else 0.0
        duration_s = int(data["duration_s"]) if data else 0
        work_kj = float(data["work_kj"]) if data else 0.0

        # IF diario derivado de TSS y duración: IF = sqrt(tss / (hours*100))
        if_value = None
        if duration_s > 0 and tss > 0:
            hours = duration_s / 3600.0
            if_value = sqrt(tss / (hours * 100.0))

        # EF diario ponderado por tiempo
        ef = None
        if data and data["ef_weighted_secs"] > 0:
            ef = data["ef_weighted_sum"] / float(data["ef_weighted_secs"])

        tsb = ctl_prev - atl_prev
        ctl = ctl_prev + (tss - ctl_prev) / CTL_TC
        atl = atl_prev + (tss - atl_prev) / ATL_TC

        stmt = (
            insert(DailyMetric)
            .values(
                athlete_id=athlete_id,
                day=d,
                tss=tss,
                duration_s=duration_s,
                if_value=if_value,
                work_kj=work_kj,
                ef=ef,
                ctl=ctl,
                atl=atl,
                tsb=tsb,
                updated_at=now,
            )
            .on_conflict_do_update(
                index_elements=["athlete_id", "day"],
                set_={
                    "tss": tss,
                    "duration_s": duration_s,
                    "if_value": if_value,
                    "work_kj": work_kj,
                    "ef": ef,
                    "ctl": ctl,
                    "atl": atl,
                    "tsb": tsb,
                    "updated_at": now,
                },
            )
        )
        db.execute(stmt)
        upserted += 1

        ctl_prev, atl_prev = ctl, atl

    db.commit()

    weekly = compute_weekly_summary(db, athlete_id, min_day, max_day)

    return {
        "athlete_id": athlete_id,
        "updated_activities": updated_days + updated_activity_metrics,
        "updated_days": updated_days,
        "updated_activity_metrics": updated_activity_metrics,
        "daily_rows": upserted,
        "range": {"from": str(min_day), "to": str(max_day)},
        "weekly_summary": weekly,
    }
