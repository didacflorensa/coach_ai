from sqlalchemy import String, BigInteger, Float, DateTime, Boolean, UniqueConstraint, Date
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime, date
from app.db.base import Base


class Activity(Base):
    __tablename__ = "activities"
    __table_args__ = (
        UniqueConstraint("strava_activity_id", name="uq_activity_strava_id"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    athlete_id: Mapped[int] = mapped_column(BigInteger, index=True, nullable=False)

    strava_activity_id: Mapped[int] = mapped_column(BigInteger, index=True, nullable=False)

    name: Mapped[str] = mapped_column(String, default="", nullable=False)
    sport_type: Mapped[str] = mapped_column(String, default="", nullable=False)

    start_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    timezone: Mapped[str] = mapped_column(String, default="", nullable=False)

    distance_m: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    moving_time_s: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    elapsed_time_s: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)

    total_elevation_gain_m: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    average_heartrate: Mapped[float | None] = mapped_column(Float, nullable=True)
    max_heartrate: Mapped[float | None] = mapped_column(Float, nullable=True)

    average_watts: Mapped[float | None] = mapped_column(Float, nullable=True)

    trainer: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    tss: Mapped[float | None] = mapped_column(Float, nullable=True)
    tss_method: Mapped[str | None] = mapped_column(String, nullable=True)
    day: Mapped[date | None] = mapped_column(Date, nullable=True)

    if_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    if_method: Mapped[str | None] = mapped_column(String, nullable=True)

    work_kj: Mapped[float | None] = mapped_column(Float, nullable=True)

    ef: Mapped[float | None] = mapped_column(Float, nullable=True)
    ef_method: Mapped[str | None] = mapped_column(String, nullable=True)

    # Velocidades (Strava: m/s)
    average_speed: Mapped[float | None] = mapped_column(Float, nullable=True)
    max_speed: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Cadencia (rpm)
    average_cadence: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Temperatura (°C)
    average_temp: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Potencia (watts)
    max_watts: Mapped[float | None] = mapped_column(Float, nullable=True)
    weighted_average_watts: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Energía (kJ)
    kilojoules: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Elevación (m)
    elev_high: Mapped[float | None] = mapped_column(Float, nullable=True)
    elev_low: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Strava suffer score
    suffer_score: Mapped[float | None] = mapped_column(Float, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
