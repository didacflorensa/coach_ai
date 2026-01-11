from __future__ import annotations
from pydantic import BaseModel, Field
from datetime import datetime


class AthleteProfileUpsert(BaseModel):
    ftp_watts: float | None = Field(default=None, ge=0)
    lthr_bpm: float | None = Field(default=None, ge=0)
    threshold_pace_sec_per_km: float | None = Field(default=None, ge=0)
    target_weekly_tss: float | None = Field(default=None, ge=0)


class AthleteProfileOut(BaseModel):
    athlete_id: int
    ftp_watts: float | None
    lthr_bpm: float | None
    threshold_pace_sec_per_km: float | None
    target_weekly_tss: float | None
    name: str | None
    surname1: str | None
    surname2: str | None
    email: str | None
    created_at: datetime
    updated_at: datetime
