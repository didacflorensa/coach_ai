from sqlalchemy import DateTime, Text, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import BigInteger
from app.db.base import Base

class AppRefreshToken(Base):
    __tablename__ = "app_refresh_tokens"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    app_user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("app_users.id", ondelete="CASCADE"), index=True)
    token_hash: Mapped[str] = mapped_column(Text, unique=True, nullable=False)

    expires_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["AppUser"] = relationship(back_populates="refresh_tokens")
