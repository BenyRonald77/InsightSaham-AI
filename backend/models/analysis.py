"""
InsightSaham — Analysis Models
Database models for analysis runs, indicator snapshots, and reports
"""
from datetime import datetime, date
from sqlalchemy import String, Float, Integer, Text, DateTime, Date, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class AnalysisRun(Base):
    """Represents a single analysis pipeline execution for a stock."""
    __tablename__ = "analysis_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    stock_code: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    stock_name: Mapped[str] = mapped_column(String(255), default="")
    sector: Mapped[str] = mapped_column(String(100), default="")
    analysis_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    data_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), default="pending"  # pending, processing, completed, failed
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # === OHLCV Data ===
    open_price: Mapped[float] = mapped_column(Float, default=0.0)
    high_price: Mapped[float] = mapped_column(Float, default=0.0)
    low_price: Mapped[float] = mapped_column(Float, default=0.0)
    close_price: Mapped[float] = mapped_column(Float, default=0.0)
    volume: Mapped[float] = mapped_column(Float, default=0.0)
    price_change_pct: Mapped[float] = mapped_column(Float, default=0.0)

    # === Indicator Values (JSON for flexibility) ===
    indicators: Mapped[dict | None] = mapped_column(JSON, default=None)

    # === Bias & Trend ===
    trend: Mapped[str] = mapped_column(String(20), default="")  # Bullish, Bearish, Konsolidasi
    trend_reasons: Mapped[dict | None] = mapped_column(JSON, default=None)

    # === Support/Resistance ===
    support_levels: Mapped[dict | None] = mapped_column(JSON, default=None)
    resistance_levels: Mapped[dict | None] = mapped_column(JSON, default=None)

    # === Scenarios ===
    scenarios: Mapped[dict | None] = mapped_column(JSON, default=None)

    # === AI Narrative ===
    narrative: Mapped[str | None] = mapped_column(Text, default=None)

    # === Chart Data (OHLCV history for rendering) ===
    chart_data: Mapped[dict | None] = mapped_column(JSON, default=None)

    # === Volume MA20 ===
    volume_ma20: Mapped[float] = mapped_column(Float, default=0.0)

    def __repr__(self):
        return f"<AnalysisRun {self.stock_code} @ {self.analysis_date}>"

    def to_dict(self):
        return {
            "id": self.id,
            "stock_code": self.stock_code,
            "stock_name": self.stock_name,
            "sector": self.sector,
            "analysis_date": self.analysis_date.isoformat() if self.analysis_date else None,
            "data_date": self.data_date.isoformat() if self.data_date else None,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "open_price": self.open_price,
            "high_price": self.high_price,
            "low_price": self.low_price,
            "close_price": self.close_price,
            "volume": self.volume,
            "volume_ma20": self.volume_ma20,
            "price_change_pct": self.price_change_pct,
            "indicators": self.indicators,
            "trend": self.trend,
            "trend_reasons": self.trend_reasons,
            "support_levels": self.support_levels,
            "resistance_levels": self.resistance_levels,
            "scenarios": self.scenarios,
            "narrative": self.narrative,
            "chart_data": self.chart_data,
        }

    def to_summary(self):
        """Lightweight dict for dashboard listing."""
        return {
            "id": self.id,
            "stock_code": self.stock_code,
            "stock_name": self.stock_name,
            "sector": self.sector,
            "analysis_date": self.analysis_date.isoformat() if self.analysis_date else None,
            "status": self.status,
            "close_price": self.close_price,
            "price_change_pct": self.price_change_pct,
            "trend": self.trend,
        }
