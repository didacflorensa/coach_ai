from sqlalchemy import DateTime, Float, BigInteger, String
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from app.db.base import Base


class AthleteProfile(Base):
    __tablename__ = "athlete_profile"

    athlete_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)

    ftp_watts: Mapped[float | None] = mapped_column(Float, nullable=True)
    lthr_bpm: Mapped[float | None] = mapped_column(Float, nullable=True)
    threshold_pace_sec_per_km: Mapped[float | None] = mapped_column(Float, nullable=True)
    target_weekly_tss: Mapped[float | None] = mapped_column(Float, nullable=True)

    name: Mapped[str | None] = mapped_column(String, nullable=True)
    surname1: Mapped[str | None] = mapped_column(String, nullable=True)
    surname2: Mapped[str | None] = mapped_column(String, nullable=True)
    email: Mapped[str | None] = mapped_column(String, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
