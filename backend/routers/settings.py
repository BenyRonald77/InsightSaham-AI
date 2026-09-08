"""
InsightSaham — Settings Router
API endpoints for application settings management
"""
from fastapi import APIRouter
from pydantic import BaseModel
from config import settings

router = APIRouter(prefix="/api/settings", tags=["Settings"])


class SettingsResponse(BaseModel):
    """Public settings (no secrets)."""
    min_price: float
    suspend_detection_days: int
    ema_short: int
    ema_medium: int
    ema_long: int
    bb_period: int
    bb_std: float
    stoch_k: int
    stoch_d: int
    stoch_smooth: int
    macd_fast: int
    macd_slow: int
    macd_signal: int
    volume_ma_period: int
    llm_provider: str
    llm_available: bool


@router.get("", response_model=SettingsResponse)
async def get_settings():
    """Get current application settings (excluding secrets)."""
    from utils.llm_providers.gemini import GeminiProvider

    llm_available = False
    if settings.llm_provider == "gemini":
        llm_available = GeminiProvider().is_available()

    return SettingsResponse(
        min_price=settings.min_price,
        suspend_detection_days=settings.suspend_detection_days,
        ema_short=settings.ema_short,
        ema_medium=settings.ema_medium,
        ema_long=settings.ema_long,
        bb_period=settings.bb_period,
        bb_std=settings.bb_std,
        stoch_k=settings.stoch_k,
        stoch_d=settings.stoch_d,
        stoch_smooth=settings.stoch_smooth,
        macd_fast=settings.macd_fast,
        macd_slow=settings.macd_slow,
        macd_signal=settings.macd_signal,
        volume_ma_period=settings.volume_ma_period,
        llm_provider=settings.llm_provider,
        llm_available=llm_available,
    )
