"""
InsightSaham — Selection Model
Tracks which stocks were selected for analysis and when
"""
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class Selection(Base):
    """Records a batch selection of stocks for analysis."""
    __tablename__ = "selections"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    selected_stocks: Mapped[list] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    status: Mapped[str] = mapped_column(
        String(20), default="pending"  # pending, processing, completed
    )
    total_stocks: Mapped[int] = mapped_column(Integer, default=0)
    completed_stocks: Mapped[int] = mapped_column(Integer, default=0)

    def to_dict(self):
        return {
            "id": self.id,
            "selected_stocks": self.selected_stocks,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "status": self.status,
            "total_stocks": self.total_stocks,
            "completed_stocks": self.completed_stocks,
        }
