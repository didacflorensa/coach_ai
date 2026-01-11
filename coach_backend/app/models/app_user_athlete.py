from sqlalchemy import DateTime, Text, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import BigInteger
from app.db.base import Base

class AppUserAthlete(Base):
    __tablename__ = "app_user_athletes"
    __table_args__ = (UniqueConstraint("app_user_id", "athlete_id", name="uq_app_user_athlete"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    app_user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("app_users.id", ondelete="CASCADE"), index=True)
    athlete_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("athlete_profile.athlete_id", ondelete="CASCADE"), index=True)

    role: Mapped[str] = mapped_column(Text, nullable=False, default="athlete")
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
