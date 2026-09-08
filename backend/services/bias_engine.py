"""
InsightSaham — Support/Resistance & Bias Engine
Rule-based engine to determine:
1. Support & Resistance levels (S1-S5, R1-R4)
2. Trend & Kondisi (Bullish/Bearish/Konsolidasi)
3. Skenario (Intraday/Swing/Teknikal)
"""
import numpy as np
import pandas as pd
from typing import Optional


def calculate_support_resistance(df: pd.DataFrame, indicators: dict) -> dict:
    """
    Calculate Support/Resistance levels based on indicators and price action.
    Returns dict with resistance (R1-R4) and support (S1-S5) levels.
    """
    latest = indicators["latest"]
    close = float(df["Close"].iloc[-1])
    high = float(df["High"].iloc[-1])
    low = float(df["Low"].iloc[-1])

    # Get recent highs and lows for pivot-like levels
    recent_20 = df.tail(20)
    recent_high = float(recent_20["High"].max())
    recent_low = float(recent_20["Low"].min())

    # Use indicators as key levels
    ema20 = latest.get("ema20", close)
    ema50 = latest.get("ema50", close)
    ema100 = latest.get("ema100", close) or close
    bb_upper = latest.get("bb_upper", close)
    bb_middle = latest.get("bb_middle", close)
    bb_lower = latest.get("bb_lower", close)

    # Build resistance levels (above current price)
    resistance_candidates = sorted(set(filter(
        lambda x: x is not None and x > close,
        [
            _round_level(ema100),
            _round_level(ema50),
            _round_level(ema20),
            _round_level(bb_upper),
            _round_level(bb_middle),
            _round_level(high),
            _round_level(recent_high),
        ]
    )))

    # Build support levels (below current price)
    support_candidates = sorted(set(filter(
        lambda x: x is not None and x < close,
        [
            _round_level(ema100),
            _round_level(ema50),
            _round_level(ema20),
            _round_level(bb_lower),
            _round_level(bb_middle),
            _round_level(low),
            _round_level(recent_low),
        ]
    )), reverse=True)

    # Add psychological levels (round numbers)
    psych_up = _next_psychological_level(close, up=True)
    psych_down = _next_psychological_level(close, up=False)

    if psych_up and psych_up not in resistance_candidates:
        resistance_candidates.append(psych_up)
        resistance_candidates.sort()

    if psych_down and psych_down not in support_candidates:
        support_candidates.append(psych_down)
        support_candidates.sort(reverse=True)

    # Assign R1-R4 and S1-S5
    resistance = {}
    for i, level in enumerate(resistance_candidates[:4], 1):
        resistance[f"R{i}"] = level

    support = {}
    for i, level in enumerate(support_candidates[:5], 1):
        support[f"S{i}"] = level

    # Add labels for context
    resistance_labels = _label_levels(resistance, {
        ema20: "EMA20", ema50: "EMA50", ema100: "EMA100",
        bb_upper: "Upper BB", bb_middle: "BB Mid", high: "High",
    })

    support_labels = _label_levels(support, {
        ema20: "EMA20", ema50: "EMA50", ema100: "EMA100",
        bb_lower: "Lower BB", bb_middle: "BB Mid", low: "Low",
    })

    return {
        "resistance": resistance,
        "support": support,
        "resistance_labels": resistance_labels,
        "support_labels": support_labels,
    }


def determine_trend(df: pd.DataFrame, indicators: dict) -> dict:
    """
    Determine Trend & Kondisi (Bullish/Bearish/Konsolidasi).
    Rule-based analysis using multiple indicator confirmations.
    Returns dict with trend label and supporting reasons.
    """
    latest = indicators["latest"]
    close = float(df["Close"].iloc[-1])
    volume = float(df["Volume"].iloc[-1])

    ema20 = latest.get("ema20", close)
    ema50 = latest.get("ema50", close)
    ema100 = latest.get("ema100") or ema50
    bb_upper = latest.get("bb_upper", close)
    bb_middle = latest.get("bb_middle", close)
    bb_lower = latest.get("bb_lower", close)
    stoch_k = latest.get("stoch_k", 50)
    stoch_d = latest.get("stoch_d", 50)
    macd_line = latest.get("macd_line", 0)
    macd_signal = latest.get("macd_signal", 0)
    macd_hist = latest.get("macd_histogram", 0)
    ad = latest.get("ad", 0)
    vol_ma20 = latest.get("volume_ma20", volume)

    bullish_signals = []
    bearish_signals = []
    reasons = []

    # 1. Price vs EMAs
    if close > ema20:
        bullish_signals.append("price_above_ema20")
        reasons.append(f"Harga di atas EMA20 ({ema20:.0f}).")
    else:
        bearish_signals.append("price_below_ema20")
        reasons.append(f"Harga di bawah EMA20 ({ema20:.0f}).")

    if close > ema50:
        bullish_signals.append("price_above_ema50")
        reasons.append(f"Harga di atas EMA50 ({ema50:.0f}).")
    else:
        bearish_signals.append("price_below_ema50")
        reasons.append(f"Harga di bawah EMA50 ({ema50:.0f}).")

    if ema100 is not None:
        if close > ema100:
            bullish_signals.append("price_above_ema100")
        else:
            bearish_signals.append("price_below_ema100")

    # 2. Stochastic
    if stoch_k is not None and stoch_d is not None:
        if stoch_k > 80:
            reasons.append(f"Stochastic di area overbought ({stoch_k:.1f}).")
        elif stoch_k < 20:
            reasons.append(f"Stochastic di area oversold ({stoch_k:.1f}).")
        elif stoch_k > 50:
            bullish_signals.append("stoch_bullish")
            reasons.append(f"Stochastic mengarah naik, masih di area positif ({stoch_k:.1f}).")
        else:
            bearish_signals.append("stoch_bearish")
            reasons.append(f"Stochastic menurun ({stoch_k:.1f}).")

    # 3. MACD
    if macd_hist is not None:
        if macd_hist > 0:
            bullish_signals.append("macd_positive")
            reasons.append("MACD masih positif.")
        else:
            bearish_signals.append("macd_negative")
            reasons.append(f"MACD melemah (histogram negatif: {macd_hist:.2f}).")

    # 4. Volume vs MA20
    if vol_ma20 and vol_ma20 > 0:
        if volume > vol_ma20:
            bullish_signals.append("volume_above_ma")
            reasons.append(f"Volume di atas MA20, minat beli meningkat.")
        else:
            bearish_signals.append("volume_below_ma")
            reasons.append(f"Volume di bawah MA20, aktivitas belum kuat.")

    # 5. Bollinger position
    if close > bb_upper:
        reasons.append("Harga di atas upper Bollinger Band.")
    elif close < bb_lower:
        reasons.append("Harga di bawah lower Bollinger Band.")
    elif close > bb_middle:
        bullish_signals.append("above_bb_mid")
        reasons.append("Harga di atas BB middle.")
    else:
        bearish_signals.append("below_bb_mid")
        reasons.append("Harga di bawah BB middle.")

    # 6. A/D Line direction (compare with previous)
    chart_series = indicators.get("chart_series", {})
    ad_series = chart_series.get("ad", [])
    if len(ad_series) >= 2 and ad_series[-1] is not None and ad_series[-2] is not None:
        if ad_series[-1] > ad_series[-2]:
            reasons.append("A/D mulai mendatar/naik.")
        else:
            reasons.append("A/D menurun dari puncak.")

    # === Determine overall trend ===
    bull_count = len(bullish_signals)
    bear_count = len(bearish_signals)

    if bull_count >= bear_count + 2:
        trend = "BULLISH"
        trend_desc = "Tekanan Beli Meningkat"
    elif bear_count >= bull_count + 2:
        trend = "BEARISH"
        trend_desc = "Tekanan Jual Meningkat"
    else:
        trend = "KONSOLIDASI"
        trend_desc = "Menunggu Arah Selanjutnya"

    return {
        "trend": trend,
        "description": trend_desc,
        "reasons": reasons,
        "bullish_signals": bull_count,
        "bearish_signals": bear_count,
    }


def generate_scenarios(
    df: pd.DataFrame,
    indicators: dict,
    sr_levels: dict,
    trend_info: dict,
) -> dict:
    """
    Generate Skenario analysis: Intraday, Swing, and Teknikal scenarios.
    Rule-based conditional scenarios.
    """
    close = float(df["Close"].iloc[-1])
    latest = indicators["latest"]
    trend = trend_info["trend"]

    resistance = sr_levels.get("resistance", {})
    support = sr_levels.get("support", {})

    r1 = resistance.get("R1", close * 1.02)
    r2 = resistance.get("R2", close * 1.05)
    s1 = support.get("S1", close * 0.98)
    s2 = support.get("S2", close * 0.95)

    ema20 = latest.get("ema20", close)
    ema50 = latest.get("ema50", close)

    # === Skenario 1 Hari (Intraday) ===
    intraday = {
        "bias_awal": f"{trend} (cenderung {'bullish' if trend == 'BULLISH' else 'bearish' if trend == 'BEARISH' else 'sideways'})",
        "skenario_bullish": f"Jika mampu bertahan di atas {close:.0f}, potensi naik ke {r1:.0f} – {r2:.0f}.",
        "skenario_konsolidasi": f"Range {s1:.0f} – {r1:.0f}.",
        "skenario_bearish": f"Jika turun di bawah {s1:.0f}, potensi ke {s2:.0f}.",
        "range_hari_ini": f"{s1:.0f} – {r1:.0f}",
        "invalidasi": f"Di bawah {s2:.0f}" if s2 else f"Di bawah {s1:.0f}",
    }

    # === Area Pengamatan Intraday (Scalping) ===
    scalp_target1 = round(close + (r1 - close) * 0.5)
    scalp_target2 = r1
    scalp_risk = s1
    intraday_area = {
        "area_pantau": f"{s1:.0f} – {r1:.0f}",
        "level_potensi_1": f"{scalp_target1:.0f}",
        "level_potensi_2": f"{scalp_target2:.0f}",
        "level_risiko": f"{scalp_risk:.0f}",
        "konfirmasi": "Volume meningkat dan harga bertahan di atas support.",
        "catatan": "Hanya untuk pemantauan, bukan ajakan transaksi.",
    }

    # === Area Pengamatan Swing (Konservatif) ===
    swing_target = r2
    swing_risk = s1
    swing_area = {
        "area_akumulasi": f"{s1:.0f} – {close:.0f}",
        "konfirmasi_tren": f"Bertahan di atas EMA50 ({ema50:.0f}).",
        "target_menengah": f"{r1:.0f} – {swing_target:.0f}",
        "batas_risiko": f"Di bawah {swing_risk:.0f}.",
        "syarat": "Tunggu konfirmasi dengan volume membaik.",
    }

    # === Skenario Teknikal ===
    teknikal = {
        "bullish": {
            "kondisi": f"Tembus {r1:.0f} dengan volume kuat.",
            "target": f"{r1:.0f} – {r2:.0f}.",
        },
        "konsolidasi": {
            "kondisi": f"Range {s1:.0f} – {r1:.0f}.",
            "keterangan": "Menunggu arah selanjutnya.",
        },
        "bearish": {
            "kondisi": f"Turun di bawah {s1:.0f}.",
            "target": f"{s1:.0f} – {s2:.0f}.",
        },
    }

    return {
        "intraday": intraday,
        "intraday_area": intraday_area,
        "swing_area": swing_area,
        "teknikal": teknikal,
    }


def _round_level(value: Optional[float], step: int = 1) -> Optional[float]:
    """Round a price level to whole number."""
    if value is None or np.isnan(value):
        return None
    return round(float(value))


def _next_psychological_level(price: float, up: bool = True) -> Optional[float]:
    """Find the next psychological (round number) level."""
    if price < 100:
        step = 5
    elif price < 500:
        step = 10
    elif price < 1000:
        step = 25
    elif price < 5000:
        step = 50
    else:
        step = 100

    if up:
        return int(np.ceil(price / step) * step)
    else:
        return int(np.floor(price / step) * step)


def _label_levels(levels: dict, known_levels: dict) -> dict:
    """Add labels to levels if they match known indicator values."""
    labels = {}
    for key, value in levels.items():
        label_parts = []
        for ref_val, ref_name in known_levels.items():
            if ref_val is not None and abs(value - ref_val) < 2:  # Close enough
                label_parts.append(ref_name)
        labels[key] = ", ".join(label_parts) if label_parts else ""
    return labels
