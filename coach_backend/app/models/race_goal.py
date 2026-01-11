from sqlalchemy import String, Integer, BigInteger, Date, DateTime, Text, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class RaceGoal(Base):
    __tablename__ = "race_goals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    athlete_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("athlete_profile.athlete_id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    name: Mapped[str] = mapped_column(Text, nullable=False)
    race_date: Mapped[Date] = mapped_column(Date, nullable=False)

    distance_m: Mapped[int] = mapped_column(Integer, nullable=False)
    goal_time_sec: Mapped[int] = mapped_column(Integer, nullable=False)

    course_type: Mapped[str | None] = mapped_column(Text, nullable=True)  # road/trail/track...

    priority: Mapped[str | None] = mapped_column(String(1), nullable=True)  # A/B/C
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
