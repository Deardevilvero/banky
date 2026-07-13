import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def new_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}"


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=lambda: new_id("u"))
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    avatar: Mapped[str] = mapped_column(String(8), default="U")
    morning_motivation: Mapped[bool] = mapped_column(Boolean, default=True)
    monthly_budget: Mapped[float] = mapped_column(Float, default=2600.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    transactions: Mapped[list["Transaction"]] = relationship(
        "Transaction", back_populates="user", cascade="all, delete-orphan"
    )


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=lambda: new_id("t"))
    user_id: Mapped[str] = mapped_column(String(32), ForeignKey("users.id"), index=True, nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    type: Mapped[str] = mapped_column(String(16), default="Expense")
    category: Mapped[str] = mapped_column(String(64), default="Other")
    description: Mapped[str] = mapped_column(Text, default="")
    date: Mapped[str] = mapped_column(String(10), index=True, nullable=False)
    icon: Mapped[str] = mapped_column(String(8), default="✨")
    color: Mapped[str] = mapped_column(String(16), default="#6366f1")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship("User", back_populates="transactions")
