"""
InsightSaham — Indicator Calculation Engine
Calculates all technical indicators from OHLCV data using pandas/numpy.
Indicators: EMA(20,50,100), Bollinger Bands(20,2), Stochastic(14,3,3),
            MACD(12,26,9), Volume MA20, Accumulation/Distribution
"""
import numpy as np
import pandas as pd
from config import settings


def calculate_ema(series: pd.Series, period: int) -> pd.Series:
    """Calculate Exponential Moving Average."""
    return series.ewm(span=period, adjust=False).mean()


def calculate_bollinger_bands(
    series: pd.Series,
    period: int = None,
    std_dev: float = None,
) -> dict:
    """Calculate Bollinger Bands (upper, middle, lower)."""
    if period is None:
        period = settings.bb_period
    if std_dev is None:
        std_dev = settings.bb_std

    middle = series.rolling(window=period).mean()
    rolling_std = series.rolling(window=period).std()
    upper = middle + (rolling_std * std_dev)
    lower = middle - (rolling_std * std_dev)

    return {
        "upper": upper,
        "middle": middle,
        "lower": lower,
    }


def calculate_stochastic(
    df: pd.DataFrame,
    k_period: int = None,
    d_period: int = None,
    smooth: int = None,
) -> dict:
    """Calculate Stochastic Oscillator (%K and %D)."""
    if k_period is None:
        k_period = settings.stoch_k
    if d_period is None:
        d_period = settings.stoch_d
    if smooth is None:
        smooth = settings.stoch_smooth

    low_min = df["Low"].rolling(window=k_period).min()
    high_max = df["High"].rolling(window=k_period).max()

    # %K (raw)
    k_raw = ((df["Close"] - low_min) / (high_max - low_min)) * 100

    # Smoothed %K
    k_smooth = k_raw.rolling(window=smooth).mean()

    # %D (SMA of smoothed %K)
    d = k_smooth.rolling(window=d_period).mean()

    return {
        "k": k_smooth,
        "d": d,
    }


def calculate_macd(
    series: pd.Series,
    fast: int = None,
    slow: int = None,
    signal: int = None,
) -> dict:
    """Calculate MACD (line, signal, histogram)."""
    if fast is None:
        fast = settings.macd_fast
    if slow is None:
        slow = settings.macd_slow
    if signal is None:
        signal = settings.macd_signal

    ema_fast = series.ewm(span=fast, adjust=False).mean()
    ema_slow = series.ewm(span=slow, adjust=False).mean()

    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    histogram = macd_line - signal_line

    return {
        "macd": macd_line,
        "signal": signal_line,
        "histogram": histogram,
    }


def calculate_accumulation_distribution(df: pd.DataFrame) -> pd.Series:
    """
    Calculate Accumulation/Distribution Line.
    AD = cumulative sum of ((Close - Low) - (High - Close)) / (High - Low) * Volume
    """
    high_low = df["High"] - df["Low"]
    # Avoid division by zero
    high_low = high_low.replace(0, np.nan)

    clv = ((df["Close"] - df["Low"]) - (df["High"] - df["Close"])) / high_low
    clv = clv.fillna(0)

    ad = (clv * df["Volume"]).cumsum()

    return ad


def calculate_volume_ma(
    volume: pd.Series,
    period: int = None,
) -> pd.Series:
    """Calculate Volume Moving Average."""
    if period is None:
        period = settings.volume_ma_period
    return volume.rolling(window=period).mean()


def calculate_all_indicators(df: pd.DataFrame) -> dict:
    """
    Calculate ALL technical indicators from OHLCV DataFrame.
    Returns a dict with all indicator values (latest values + series for charting).
    """
    close = df["Close"]

    # === EMAs ===
    ema20 = calculate_ema(close, settings.ema_short)
    ema50 = calculate_ema(close, settings.ema_medium)
    ema100 = calculate_ema(close, settings.ema_long)

    # === Bollinger Bands ===
    bb = calculate_bollinger_bands(close)

    # === Stochastic ===
    stoch = calculate_stochastic(df)

    # === MACD ===
    macd = calculate_macd(close)

    # === Accumulation/Distribution ===
    ad = calculate_accumulation_distribution(df)

    # === Volume MA20 ===
    vol_ma = calculate_volume_ma(df["Volume"])

    # Get latest values (last row)
    latest = {
        "ema20": _safe_round(ema20.iloc[-1]),
        "ema50": _safe_round(ema50.iloc[-1]),
        "ema100": _safe_round(ema100.iloc[-1]) if len(ema100) > 0 and not pd.isna(ema100.iloc[-1]) else None,
        "bb_upper": _safe_round(bb["upper"].iloc[-1]),
        "bb_middle": _safe_round(bb["middle"].iloc[-1]),
        "bb_lower": _safe_round(bb["lower"].iloc[-1]),
        "stoch_k": _safe_round(stoch["k"].iloc[-1], 1),
        "stoch_d": _safe_round(stoch["d"].iloc[-1], 1),
        "macd_line": _safe_round(macd["macd"].iloc[-1], 2),
        "macd_signal": _safe_round(macd["signal"].iloc[-1], 2),
        "macd_histogram": _safe_round(macd["histogram"].iloc[-1], 2),
        "ad": _safe_round(ad.iloc[-1]),
        "volume_ma20": _safe_round(vol_ma.iloc[-1]),
    }

    # Build chart series data (last 120 trading days for display)
    chart_len = min(120, len(df))
    chart_df = df.tail(chart_len).copy()

    chart_series = {
        "dates": [d.strftime("%Y-%m-%d") for d in chart_df.index],
        "ohlcv": {
            "open": chart_df["Open"].round(2).tolist(),
            "high": chart_df["High"].round(2).tolist(),
            "low": chart_df["Low"].round(2).tolist(),
            "close": chart_df["Close"].round(2).tolist(),
            "volume": chart_df["Volume"].tolist(),
        },
        "ema20": _series_to_list(ema20.tail(chart_len)),
        "ema50": _series_to_list(ema50.tail(chart_len)),
        "ema100": _series_to_list(ema100.tail(chart_len)),
        "bb_upper": _series_to_list(bb["upper"].tail(chart_len)),
        "bb_middle": _series_to_list(bb["middle"].tail(chart_len)),
        "bb_lower": _series_to_list(bb["lower"].tail(chart_len)),
        "stoch_k": _series_to_list(stoch["k"].tail(chart_len), 1),
        "stoch_d": _series_to_list(stoch["d"].tail(chart_len), 1),
        "macd_line": _series_to_list(macd["macd"].tail(chart_len), 2),
        "macd_signal": _series_to_list(macd["signal"].tail(chart_len), 2),
        "macd_histogram": _series_to_list(macd["histogram"].tail(chart_len), 2),
        "ad": _series_to_list(ad.tail(chart_len)),
        "volume_ma20": _series_to_list(vol_ma.tail(chart_len)),
    }

    return {
        "latest": latest,
        "chart_series": chart_series,
    }


def _safe_round(value, decimals: int = 0):
    """Safely round a value, returning None if NaN."""
    if pd.isna(value):
        return None
    return round(float(value), decimals)


def _series_to_list(series: pd.Series, decimals: int = 2) -> list:
    """Convert pandas Series to list of rounded floats, replacing NaN with None."""
    return [
        round(float(v), decimals) if not pd.isna(v) else None
        for v in series
    ]
