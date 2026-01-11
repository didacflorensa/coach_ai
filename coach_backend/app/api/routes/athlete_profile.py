from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db.session import get_db
from app.models.athlete_profile import AthleteProfile
from app.schemas.athlete_profile import AthleteProfileUpsert, AthleteProfileOut

router = APIRouter(prefix="/athletes", tags=["athlete-profile"])


@router.get("/{athlete_id}/profile", response_model=AthleteProfileOut)
def get_profile(athlete_id: int, db: Session = Depends(get_db)):
    row = db.get(AthleteProfile, athlete_id)
    if not row:
        raise HTTPException(status_code=404, detail="athlete_profile no existe")
    return AthleteProfileOut(
        athlete_id=row.athlete_id,
        ftp_watts=row.ftp_watts,
        lthr_bpm=row.lthr_bpm,
        threshold_pace_sec_per_km=row.threshold_pace_sec_per_km,
        target_weekly_tss=row.target_weekly_tss,
        name=row.name,
        surname1=row.surname1,
        surname2=row.surname2,
        email=row.email,
        created_at=row.created_at,
        updated_at=row.updated_at
    )


@router.put("/{athlete_id}/profile", response_model=AthleteProfileOut)
def upsert_profile(athlete_id: int, payload: AthleteProfileUpsert, db: Session = Depends(get_db)):
    # upsert “manual” (simple y claro)
    row = db.get(AthleteProfile, athlete_id)

    if row is None:
        row = AthleteProfile(athlete_id=athlete_id)

    # Solo actualiza campos que vengan en el request (None => no cambia)
    if payload.ftp_watts is not None:
        row.ftp_watts = payload.ftp_watts
    if payload.lthr_bpm is not None:
        row.lthr_bpm = payload.lthr_bpm
    if payload.threshold_pace_sec_per_km is not None:
        row.threshold_pace_sec_per_km = payload.threshold_pace_sec_per_km
    if payload.target_weekly_tss is not None:
        row.target_weekly_tss = payload.target_weekly_tss

    db.add(row)
    db.commit()
    db.refresh(row)

    return AthleteProfileOut(
        athlete_id=row.athlete_id,
        ftp_watts=row.ftp_watts,
        lthr_bpm=row.lthr_bpm,
        threshold_pace_sec_per_km=row.threshold_pace_sec_per_km,
        target_weekly_tss=row.target_weekly_tss,
    )
