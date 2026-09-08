"""
InsightSaham — Data Sync Engine
Fetches OHLCV data from yfinance, manages stock universe & auto-filter.
Uses batch download to avoid Yahoo rate-limiting.
"""
import asyncio
import logging
import time
from datetime import datetime, timedelta, date
from typing import Optional
from concurrent.futures import ThreadPoolExecutor

import numpy as np
import pandas as pd
import yfinance as yf

from config import settings

logger = logging.getLogger(__name__)

# Thread pool for yfinance (sync library)
_executor = ThreadPoolExecutor(max_workers=1)

# In-memory cache for batch-downloaded data
_batch_cache: dict[str, pd.DataFrame] = {}
_batch_cache_time: float = 0


# === Master list of common IDX stocks ===
IDX_STOCKS = {
    # Blue Chips / LQ45
    "BBCA": {"name": "Bank Central Asia Tbk.", "sector": "Keuangan"},
    "BBRI": {"name": "Bank Rakyat Indonesia Tbk.", "sector": "Keuangan"},
    "BMRI": {"name": "Bank Mandiri Tbk.", "sector": "Keuangan"},
    "BBNI": {"name": "Bank Negara Indonesia Tbk.", "sector": "Keuangan"},
    "TLKM": {"name": "Telkom Indonesia Tbk.", "sector": "Infrastruktur"},
    "ASII": {"name": "Astra International Tbk.", "sector": "Aneka Industri"},
    "UNVR": {"name": "Unilever Indonesia Tbk.", "sector": "Barang Konsumsi"},
    "HMSP": {"name": "HM Sampoerna Tbk.", "sector": "Barang Konsumsi"},
    "ICBP": {"name": "Indofood CBP Sukses Makmur Tbk.", "sector": "Barang Konsumsi"},
    "INDF": {"name": "Indofood Sukses Makmur Tbk.", "sector": "Barang Konsumsi"},
    "KLBF": {"name": "Kalbe Farma Tbk.", "sector": "Barang Konsumsi"},
    "GGRM": {"name": "Gudang Garam Tbk.", "sector": "Barang Konsumsi"},
    "PGAS": {"name": "Perusahaan Gas Negara Tbk.", "sector": "Infrastruktur"},
    "SMGR": {"name": "Semen Indonesia Tbk.", "sector": "Industri Dasar"},
    "INTP": {"name": "Indocement Tunggal Prakarsa Tbk.", "sector": "Industri Dasar"},
    "UNTR": {"name": "United Tractors Tbk.", "sector": "Perdagangan"},
    "ADRO": {"name": "Adaro Energy Tbk.", "sector": "Pertambangan"},
    "PTBA": {"name": "Bukit Asam Tbk.", "sector": "Pertambangan"},
    "ANTM": {"name": "Aneka Tambang Tbk.", "sector": "Pertambangan"},
    "INCO": {"name": "Vale Indonesia Tbk.", "sector": "Pertambangan"},
    "ITMG": {"name": "Indo Tambangraya Megah Tbk.", "sector": "Pertambangan"},
    "MDKA": {"name": "Merdeka Copper Gold Tbk.", "sector": "Pertambangan"},
    "EXCL": {"name": "XL Axiata Tbk.", "sector": "Infrastruktur"},
    "ISAT": {"name": "Indosat Tbk.", "sector": "Infrastruktur"},
    "TOWR": {"name": "Sarana Menara Nusantara Tbk.", "sector": "Infrastruktur"},
    "TBIG": {"name": "Tower Bersama Infrastructure Tbk.", "sector": "Infrastruktur"},
    "MNCN": {"name": "Media Nusantara Citra Tbk.", "sector": "Perdagangan"},
    "CPIN": {"name": "Charoen Pokphand Indonesia Tbk.", "sector": "Industri Dasar"},
    "JPFA": {"name": "Japfa Comfeed Indonesia Tbk.", "sector": "Industri Dasar"},
    "ERAA": {"name": "Erajaya Swasembada Tbk.", "sector": "Perdagangan"},
    "ACES": {"name": "Ace Hardware Indonesia Tbk.", "sector": "Perdagangan"},
    "MAPI": {"name": "Mitra Adiperkasa Tbk.", "sector": "Perdagangan"},
    "SIDO": {"name": "Industri Jamu dan Farmasi Sido Muncul Tbk.", "sector": "Barang Konsumsi"},
    "EMTK": {"name": "Elang Mahkota Teknologi Tbk.", "sector": "Perdagangan"},
    "BRIS": {"name": "Bank Syariah Indonesia Tbk.", "sector": "Keuangan"},
    "ARTO": {"name": "Bank Jago Tbk.", "sector": "Keuangan"},
    "BUKA": {"name": "Bukalapak.com Tbk.", "sector": "Perdagangan"},
    "GOTO": {"name": "GoTo Gojek Tokopedia Tbk.", "sector": "Perdagangan"},
    "BREN": {"name": "Barito Renewables Energy Tbk.", "sector": "Infrastruktur"},
    "AMMN": {"name": "Amman Mineral Internasional Tbk.", "sector": "Pertambangan"},
    "PGEO": {"name": "Pertamina Geothermal Energy Tbk.", "sector": "Pertambangan"},
    "BRPT": {"name": "Barito Pacific Tbk.", "sector": "Industri Dasar"},
    "TPIA": {"name": "Chandra Asri Pacific Tbk.", "sector": "Industri Dasar"},
    "ESSA": {"name": "Surya Esa Perkasa Tbk.", "sector": "Industri Dasar"},
    "AKRA": {"name": "AKR Corporindo Tbk.", "sector": "Perdagangan"},
    "MYOR": {"name": "Mayora Indah Tbk.", "sector": "Barang Konsumsi"},
    "INKP": {"name": "Indah Kiat Pulp & Paper Tbk.", "sector": "Industri Dasar"},
    "TKIM": {"name": "Pabrik Kertas Tjiwi Kimia Tbk.", "sector": "Industri Dasar"},
    # Saham kecil/menengah
    "GPRA": {"name": "Perdana Gapuraprima Tbk.", "sector": "Properti & Real Estat"},
    "JGLE": {"name": "Graha Andrasentra Propertindo Tbk.", "sector": "Properti & Real Estat"},
    "BMSR": {"name": "Bintang Mitra Semestaraya Tbk.", "sector": "Perdagangan & Distribusi"},
    "MEJA": {"name": "Harta Djaya Karya Tbk.", "sector": "Perdagangan"},
    "BSDE": {"name": "Bumi Serpong Damai Tbk.", "sector": "Properti & Real Estat"},
    "CTRA": {"name": "Ciputra Development Tbk.", "sector": "Properti & Real Estat"},
    "SMRA": {"name": "Summarecon Agung Tbk.", "sector": "Properti & Real Estat"},
    "PWON": {"name": "Pakuwon Jati Tbk.", "sector": "Properti & Real Estat"},
    "MEDC": {"name": "Medco Energi Internasional Tbk.", "sector": "Pertambangan"},
    "PNLF": {"name": "Panin Financial Tbk.", "sector": "Keuangan"},
    "BBTN": {"name": "Bank Tabungan Negara Tbk.", "sector": "Keuangan"},
    "BJBR": {"name": "Bank Pembangunan Daerah Jawa Barat Tbk.", "sector": "Keuangan"},
    "BJTM": {"name": "Bank Pembangunan Daerah Jawa Timur Tbk.", "sector": "Keuangan"},
    "ELSA": {"name": "Elnusa Tbk.", "sector": "Energi"},
    "WBSA": {"name": "BSA Logistics Indonesia Tbk.", "sector": "Transportasi & Logistik"},
}


def get_yfinance_ticker(code: str) -> str:
    """Convert IDX code to yfinance ticker format."""
    return f"{code}.JK"


def _batch_download_sync(codes: list[str], period: str = "3mo") -> dict[str, pd.DataFrame]:
    """
    Batch download OHLCV data for multiple stocks using yf.download().
    This is MUCH more efficient than individual requests — single API call.
    Returns dict of {code: DataFrame}.
    """
    tickers = [get_yfinance_ticker(c) for c in codes]
    ticker_str = " ".join(tickers)

    logger.info(f"Batch downloading {len(tickers)} tickers...")

    try:
        # yf.download handles batching internally, much less rate-limiting
        raw = yf.download(
            ticker_str,
            period=period,
            interval="1d",
            group_by="ticker",
            progress=False,
            threads=False,  # Single thread to avoid rate-limits
        )

        result = {}

        if raw.empty:
            logger.warning("Batch download returned empty data")
            return result

        for code in codes:
            ticker = get_yfinance_ticker(code)
            try:
                if isinstance(raw.columns, pd.MultiIndex):
                    if ticker in raw.columns.get_level_values(0):
                        df = raw[ticker][["Open", "High", "Low", "Close", "Volume"]].copy()
                    elif ticker in raw.columns.get_level_values(1):
                        df = raw.xs(ticker, level=1, axis=1)[["Open", "High", "Low", "Close", "Volume"]].copy()
                    else:
                        logger.warning(f"  {code}: ticker {ticker} not found in batch columns")
                        continue
                else:
                    df = raw[["Open", "High", "Low", "Close", "Volume"]].copy()

                df = df.dropna(how="all")
                if not df.empty:
                    df.index = pd.to_datetime(df.index).tz_localize(None)
                    result[code] = df
                    logger.debug(f"  {code}: {len(df)} rows")
                else:
                    logger.warning(f"  {code}: empty after cleanup")
            except (KeyError, TypeError) as e:
                logger.warning(f"  {code}: not found in batch data ({e})")

        logger.info(f"Batch download complete: {len(result)}/{len(codes)} successful")
        return result

    except Exception as e:
        logger.error(f"Batch download error: {e}")
        return {}


async def batch_download(codes: list[str], period: str = "3mo") -> dict[str, pd.DataFrame]:
    """Async wrapper for batch download."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        _executor,
        _batch_download_sync,
        codes, period,
    )


def _fetch_stock_data_sync(
    code: str,
    period: str = "1y",
    interval: str = "1d",
) -> Optional[pd.DataFrame]:
    """
    Fetch OHLCV data for a single stock from yfinance (synchronous).
    Returns DataFrame with columns: Open, High, Low, Close, Volume
    """
    try:
        ticker = get_yfinance_ticker(code)
        # Use download instead of Ticker.history for consistency
        df = yf.download(
            ticker,
            period=period,
            interval=interval,
            progress=False,
            threads=False,
        )

        if df.empty:
            logger.warning(f"No data returned for {code}")
            return None

        # Clean up columns
        # Handle multi-level columns from yf.download
        if isinstance(df.columns, pd.MultiIndex):
            if "Close" in df.columns.get_level_values(0):
                df.columns = df.columns.get_level_values(0)
            elif "Close" in df.columns.get_level_values(1):
                df.columns = df.columns.get_level_values(1)

        df = df[["Open", "High", "Low", "Close", "Volume"]].copy()
        df.index = pd.to_datetime(df.index).tz_localize(None)

        return df

    except Exception as e:
        logger.error(f"Error fetching data for {code}: {e}")
        return None


async def fetch_stock_data(
    code: str,
    period: str = "1y",
    interval: str = "1d",
) -> Optional[pd.DataFrame]:
    """
    Async wrapper around yfinance fetch (runs in thread pool).
    """
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        _executor,
        _fetch_stock_data_sync,
        code, period, interval,
    )


def detect_suspended(df: pd.DataFrame, n_days: int = 5) -> bool:
    """
    Detect if a stock is likely suspended.
    Proxy: no price movement AND no volume for N consecutive trading days.
    """
    if df is None or len(df) < n_days:
        return True  # Not enough data, treat as suspicious

    recent = df.tail(n_days)

    # Check if price hasn't moved at all
    price_static = recent["Close"].nunique() == 1
    # Check if volume is zero or near-zero
    volume_dead = (recent["Volume"] == 0).all() or recent["Volume"].sum() < 100

    return price_static and volume_dead


def apply_auto_filter(
    df: pd.DataFrame,
    min_price: float = None,
    suspend_days: int = None,
) -> dict:
    """
    Apply auto-filter rules to determine if a stock passes.
    Returns dict with filter result and reasons.
    """
    if min_price is None:
        min_price = settings.min_price
    if suspend_days is None:
        suspend_days = settings.suspend_detection_days

    result = {
        "passes": True,
        "reasons": [],
        "last_price": 0,
        "is_suspended": False,
    }

    if df is None or df.empty:
        result["passes"] = False
        result["reasons"].append("Tidak ada data harga")
        return result

    last_close = float(df["Close"].iloc[-1])
    result["last_price"] = last_close

    # Rule 1: Price < min_price
    if last_close < min_price:
        result["passes"] = False
        result["reasons"].append(f"Harga < Rp {min_price:.0f}")

    # Rule 2: Suspected suspend
    is_suspended = detect_suspended(df, suspend_days)
    result["is_suspended"] = is_suspended
    if is_suspended:
        result["passes"] = False
        result["reasons"].append(f"Diduga suspend ({suspend_days} hari tanpa aktivitas)")

    return result


def get_all_stock_codes() -> dict:
    """Return the master list of IDX stocks."""
    return IDX_STOCKS.copy()


def get_sectors() -> list[str]:
    """Get unique sectors from master list."""
    sectors = set()
    for info in IDX_STOCKS.values():
        if info["sector"]:
            sectors.add(info["sector"])
    return sorted(list(sectors))
