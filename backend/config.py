"""
InsightSaham — Configuration
Loads settings from environment variables / .env file
"""
import os
from pathlib import Path
from pydantic_settings import BaseSettings
from pydantic import Field


# Find .env file in parent directory
ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # === LLM Configuration ===
    gemini_api_key: str = Field(default="", alias="GEMINI_API_KEY")
    groq_api_key: str = Field(default="", alias="GROQ_API_KEY")
    llm_provider: str = Field(default="gemini", alias="LLM_PROVIDER")

    # === Broker Summary / Data API ===
    indexalpha_api_key: str = Field(default="", alias="INDEXALPHA_API_KEY")

    # === Database ===
    database_url: str = Field(
        default="sqlite+aiosqlite:///./insightsaham.db",
        alias="DATABASE_URL"
    )

    # === Server ===
    host: str = Field(default="127.0.0.1", alias="HOST")
    port: int = Field(default=8000, alias="PORT")
    debug: bool = Field(default=True, alias="DEBUG")

    # === Auto-Filter Settings ===
    min_price: float = Field(default=50.0, alias="MIN_PRICE")
    suspend_detection_days: int = Field(default=5, alias="SUSPEND_DETECTION_DAYS")

    # === Indicator Parameters ===
    ema_short: int = Field(default=20, alias="EMA_SHORT")
    ema_medium: int = Field(default=50, alias="EMA_MEDIUM")
    ema_long: int = Field(default=100, alias="EMA_LONG")
    bb_period: int = Field(default=20, alias="BB_PERIOD")
    bb_std: float = Field(default=2.0, alias="BB_STD")
    stoch_k: int = Field(default=14, alias="STOCH_K")
    stoch_d: int = Field(default=3, alias="STOCH_D")
    stoch_smooth: int = Field(default=3, alias="STOCH_SMOOTH")
    macd_fast: int = Field(default=12, alias="MACD_FAST")
    macd_slow: int = Field(default=26, alias="MACD_SLOW")
    macd_signal: int = Field(default=9, alias="MACD_SIGNAL")
    volume_ma_period: int = Field(default=20, alias="VOLUME_MA_PERIOD")

    # === CORS ===
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    model_config = {
        "env_file": str(ENV_FILE),
        "env_file_encoding": "utf-8",
        "extra": "ignore",
        "populate_by_name": True,
    }


# Singleton instance
settings = Settings()
