from sqlalchemy import DateTime, Float, BigInteger, Date
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime, date
from app.db.base import Base


class DailyMetric(Base):
    __tablename__ = "daily_metrics"

    athlete_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    day: Mapped[date] = mapped_column(Date, primary_key=True, index=True)

    tss: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    ctl: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    atl: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    tsb: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    duration_s: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    if_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    work_kj: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    ef: Mapped[float | None] = mapped_column(Float, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
