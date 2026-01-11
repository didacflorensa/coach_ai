from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, Field


class ActivityCreate(BaseModel):
    # Usaremos strava_activity_id como ID público también para actividades “manuales”
    strava_activity_id: int = Field(..., ge=1)

    name: str = Field(default="")
    sport_type: str = Field(..., min_length=1)

    start_date: datetime
    timezone: str | None = None

    distance_m: float | None = Field(default=0.0, ge=0)
    moving_time_s: int | None = Field(default=0, ge=0)
    elapsed_time_s: int | None = Field(default=0, ge=0)
    total_elevation_gain_m: float | None = Field(default=0.0, ge=0)

    # Optional Strava-like fields
    average_speed: float | None = None
    max_speed: float | None = None
    average_cadence: float | None = None
    average_temp: float | None = None

    average_watts: float | None = None
    max_watts: float | None = None
    weighted_average_watts: float | None = None
    kilojoules: float | None = None

    average_heartrate: float | None = None
    max_heartrate: float | None = None

    elev_high: float | None = None
    elev_low: float | None = None
    suffer_score: float | None = None

    trainer: bool | None = False


class ActivityPatch(BaseModel):
    # Todos opcionales (edición parcial)
    name: str | None = None
    sport_type: str | None = None

    start_date: datetime | None = None
    timezone: str | None = None

    distance_m: float | None = Field(default=None, ge=0)
    moving_time_s: int | None = Field(default=None, ge=0)
    elapsed_time_s: int | None = Field(default=None, ge=0)
    total_elevation_gain_m: float | None = Field(default=None, ge=0)

    average_speed: float | None = None
    max_speed: float | None = None
    average_cadence: float | None = None
    average_temp: float | None = None

    average_watts: float | None = None
    max_watts: float | None = None
    weighted_average_watts: float | None = None
    kilojoules: float | None = None

    average_heartrate: float | None = None
    max_heartrate: float | None = None

    elev_high: float | None = None
    elev_low: float | None = None
    suffer_score: float | None = None

    trainer: bool | None = None
