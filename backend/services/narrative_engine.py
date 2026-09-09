"""
InsightSaham — AI Narrative Engine
Orchestrates LLM-based narrative generation for analysis cards.
AI does NOT calculate any numbers — all numbers come from rule-based engines.
AI only composes Indonesian-language narrative text from structured data.
"""
import logging
from typing import Optional

from config import settings
from utils.llm_providers.base import LLMProvider
from utils.llm_providers.gemini import GeminiProvider

logger = logging.getLogger(__name__)

# System instruction for all narrative generations
SYSTEM_INSTRUCTION = """Kamu adalah asisten analis teknikal saham Indonesia yang menghasilkan narasi analisis teknikal dalam Bahasa Indonesia.

ATURAN KETAT:
1. JANGAN mengarang angka baru di luar data yang diberikan sistem
2. JANGAN memakai kalimat imperatif ajakan transaksi (jangan gunakan kata "beli", "jual", "segera ambil posisi", dll)
3. Gunakan gaya bahasa netral, informatif, dan edukatif
4. Semua angka harga, level, dan indikator HARUS sesuai persis dengan data yang diberikan
5. Fokus pada deskripsi kondisi pasar dan indikator, bukan rekomendasi
6. Gunakan format narasi yang ringkas dan jelas

Gaya referensi: mirip kartu analisis "Trader Swing Saham Indonesia" — informatif, terstruktur, tidak memihak."""


def get_llm_provider() -> Optional[LLMProvider]:
    """Get the configured LLM provider instance."""
    provider_name = settings.llm_provider.lower()

    if provider_name == "gemini":
        provider = GeminiProvider()
        if provider.is_available():
            return provider
        logger.warning("Gemini provider not available (API key missing?)")

    # Add more providers here as needed
    # elif provider_name == "groq":
    #     provider = GroqProvider()
    #     ...

    return None


def build_narrative_prompt(analysis_data: dict) -> str:
    """
    Build the prompt for AI narrative generation from structured analysis data.
    All numbers are pre-calculated — AI only needs to compose sentences.
    """
    stock = analysis_data.get("stock_code", "")
    name = analysis_data.get("stock_name", "")
    sector = analysis_data.get("sector", "")
    close = analysis_data.get("close_price", 0)
    change_pct = analysis_data.get("price_change_pct", 0)
    indicators = analysis_data.get("indicators", {})
    latest = indicators.get("latest", indicators)
    trend_info = analysis_data.get("trend_info", {})
    sr_levels = analysis_data.get("sr_levels", {})
    scenarios = analysis_data.get("scenarios", {})

    # Broker Summary / Bandarmologi data
    bs = analysis_data.get("broker_summary") or {}
    bandar_status = bs.get("bandar_status_label", "N/A")
    bs_summary = bs.get("summary", {})
    top_buyers = [f"{b['broker']} ({b['lot']:,} lot @ Rp{b['avg_price']:,})" for b in bs.get("top_buyers", [])[:3]]
    top_sellers = [f"{s['broker']} ({s['lot']:,} lot @ Rp{s['avg_price']:,})" for s in bs.get("top_sellers", [])[:3]]
    foreign_flow = bs_summary.get("foreign_flow_label", "N/A")
    avg_buy = bs_summary.get("avg_buy_bandar", 0)

    prompt = f"""Buatkan narasi analisis teknikal dan bandarmologi singkat untuk saham berikut. Gunakan HANYA data yang diberikan, jangan tambah angka baru.

SAHAM: {stock} — {name}
Sektor: {sector}
Harga Penutupan: {close:.0f} ({change_pct:+.2f}%)

INDIKATOR TEKNIKAL:
- EMA20: {latest.get('ema20', '-')}
- EMA50: {latest.get('ema50', '-')}
- EMA100: {latest.get('ema100', '-') or 'N/A'}
- Bollinger Bands: Upper {latest.get('bb_upper', '-')}, Middle {latest.get('bb_middle', '-')}, Lower {latest.get('bb_lower', '-')}
- Stochastic: %K {latest.get('stoch_k', '-')}, %D {latest.get('stoch_d', '-')}
- MACD: Line {latest.get('macd_line', '-')}, Signal {latest.get('macd_signal', '-')}, Histogram {latest.get('macd_histogram', '-')}
- Accum/Dist: {latest.get('ad', '-')}

BANDARMOLOGI & BROKER SUMMARY:
- Status Aktivitas Bandar: {bandar_status}
- Rasio Akumulasi/Distribusi: {bs_summary.get('acc_dist_ratio', '-')}
- Top 3 Buyer: {', '.join(top_buyers) if top_buyers else 'N/A'} (Rata-rata harga bandar: Rp {avg_buy:,})
- Top 3 Seller: {', '.join(top_sellers) if top_sellers else 'N/A'}
- Aliran Dana Asing (Foreign Flow): {foreign_flow}

TREND: {trend_info.get('trend', '-')} — {trend_info.get('description', '')}
Alasan: {'; '.join(trend_info.get('reasons', []))}

LEVEL PENTING:
Resistance: {sr_levels.get('resistance', {})}
Support: {sr_levels.get('support', {})}

INSTRUKSI OUTPUT:
Buatkan 2-3 paragraf narasi ringkas (maksimal 160 kata) yang mendeskripsikan:
1. Kondisi teknikal terkini berdasarkan indikator chart
2. Konfirmasi pergerakan bandar & aliran broker (apakah terakumulasi atau terdistribusi)
3. Level penting support dan resistance

Format: paragraf narasi Bahasa Indonesia, tanpa bullet point, tanpa header."""

    return prompt


async def generate_narrative(analysis_data: dict) -> str:
    """
    Generate AI narrative for an analysis card.
    Falls back to rule-based template if AI is not available.
    """
    provider = get_llm_provider()

    if provider is not None:
        prompt = build_narrative_prompt(analysis_data)
        try:
            result = await provider.generate(prompt, SYSTEM_INSTRUCTION)
            if result:
                logger.info(f"Narrative generated by {provider.get_name()}")
                return result
        except Exception as e:
            logger.error(f"AI narrative generation failed: {e}")

    # Fallback: rule-based template narrative
    logger.info("Using fallback rule-based narrative")
    return _generate_fallback_narrative(analysis_data)


def _generate_fallback_narrative(analysis_data: dict) -> str:
    """
    Fallback rule-based narrative template when AI is unavailable.
    """
    stock = analysis_data.get("stock_code", "")
    name = analysis_data.get("stock_name", "")
    close = analysis_data.get("close_price", 0)
    change_pct = analysis_data.get("price_change_pct", 0)
    trend_info = analysis_data.get("trend_info", {})
    indicators = analysis_data.get("indicators", {})
    latest = indicators.get("latest", {})

    trend = trend_info.get("trend", "KONSOLIDASI")
    reasons = trend_info.get("reasons", [])

    direction = "naik" if change_pct > 0 else "turun" if change_pct < 0 else "stagnan"

    narrative = (
        f"Saham {stock} ({name}) ditutup di level {close:.0f} ({change_pct:+.2f}%), "
        f"menunjukkan pergerakan {direction} pada perdagangan terakhir. "
    )

    if trend == "BULLISH":
        narrative += (
            f"Secara teknikal, saham ini berada dalam kondisi bullish. "
            f"Harga bergerak di atas EMA20 ({latest.get('ema20', '-')}) "
            f"dengan momentum yang masih terjaga. "
        )
    elif trend == "BEARISH":
        narrative += (
            f"Secara teknikal, saham ini berada dalam tekanan jual. "
            f"Harga bergerak di bawah EMA20 ({latest.get('ema20', '-')}) "
            f"dengan momentum yang melemah. "
        )
    else:
        narrative += (
            f"Secara teknikal, saham ini berada dalam fase konsolidasi. "
            f"Harga bergerak di sekitar EMA20 ({latest.get('ema20', '-')}) "
            f"menunggu katalis arah selanjutnya. "
        )

    if reasons:
        narrative += " ".join(reasons[:3])

    return narrative
