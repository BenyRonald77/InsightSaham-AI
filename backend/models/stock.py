"""
InsightSaham — Stock Models
Database models for stock universe & filtering
"""
from datetime import datetime, date
from sqlalchemy import String, Float, Integer, Boolean, DateTime, Date
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class Stock(Base):
    """Represents a stock in the IDX universe."""
    __tablename__ = "stocks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(10), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    sector: Mapped[str] = mapped_column(String(100), default="")
    last_price: Mapped[float] = mapped_column(Float, default=0.0)
    last_volume: Mapped[float] = mapped_column(Float, default=0.0)
    is_suspended: Mapped[bool] = mapped_column(Boolean, default=False)
    passes_filter: Mapped[bool] = mapped_column(Boolean, default=True)
    last_updated: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    price_change_pct: Mapped[float] = mapped_column(Float, default=0.0)

    def __repr__(self):
        return f"<Stock {self.code} - {self.name}>"

    def to_dict(self):
        return {
            "id": self.id,
            "code": self.code,
            "name": self.name,
            "sector": self.sector,
            "last_price": self.last_price,
            "last_volume": self.last_volume,
            "is_suspended": self.is_suspended,
            "passes_filter": self.passes_filter,
            "last_updated": self.last_updated.isoformat() if self.last_updated else None,
            "price_change_pct": self.price_change_pct,
        }
