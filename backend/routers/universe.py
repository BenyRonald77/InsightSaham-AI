"""
InsightSaham — Universe Router
API endpoints for stock universe & auto-filter management.
Uses batch download to avoid Yahoo rate-limiting.
"""
import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from database import get_db
from models.stock import Stock
from services.data_sync import (
    get_all_stock_codes,
    batch_download,
    apply_auto_filter,
    get_sectors,
)
from config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/universe", tags=["Universe"])


@router.get("")
async def get_universe(
    sector: str = Query(None, description="Filter by sector"),
    search: str = Query(None, description="Search by code or name"),
    db: AsyncSession = Depends(get_db),
):
    """Get the filtered stock universe (pool saham yang lolos auto-filter)."""
    query = select(Stock).where(Stock.passes_filter == True)

    if sector:
        query = query.where(Stock.sector == sector)

    if search:
        search_term = f"%{search.upper()}%"
        query = query.where(
            (Stock.code.ilike(search_term)) | (Stock.name.ilike(f"%{search}%"))
        )

    query = query.order_by(Stock.code)
    result = await db.execute(query)
    stocks = result.scalars().all()

    return {
        "total": len(stocks),
        "stocks": [s.to_dict() for s in stocks],
    }


@router.get("/sectors")
async def get_sector_list():
    """Get list of available sectors."""
    return {"sectors": get_sectors()}


@router.post("/refresh")
async def refresh_universe(db: AsyncSession = Depends(get_db)):
    """
    Refresh the stock universe using batch download (single API call).
    Much faster and avoids Yahoo rate-limiting.
    """
    master_list = get_all_stock_codes()
    codes = list(master_list.keys())
    results = {"total": len(codes), "processed": 0, "passed": 0, "filtered_out": 0, "errors": 0}

    logger.info(f"Starting universe refresh for {len(codes)} stocks (batch mode)...")

    # Step 1: Batch download all stock data in one call
    stock_data = await batch_download(codes, period="3mo")

    logger.info(f"Batch download returned data for {len(stock_data)}/{len(codes)} stocks")

    # Step 2: Process each stock with the downloaded data
    for code, info in master_list.items():
        try:
            df = stock_data.get(code)

            # Apply auto-filter
            filter_result = apply_auto_filter(df)

            # Calculate price change
            price_change = 0.0
            last_volume = 0.0
            if df is not None and len(df) >= 2:
                prev_close = float(df["Close"].iloc[-2])
                last_close = float(df["Close"].iloc[-1])
                last_volume = float(df["Volume"].iloc[-1])
                if prev_close > 0:
                    price_change = ((last_close - prev_close) / prev_close) * 100
            elif df is not None and len(df) >= 1:
                last_volume = float(df["Volume"].iloc[-1])

            # Upsert stock record
            existing = await db.execute(
                select(Stock).where(Stock.code == code)
            )
            stock = existing.scalar_one_or_none()

            if stock is None:
                stock = Stock(
                    code=code,
                    name=info["name"],
                    sector=info["sector"],
                    last_price=filter_result["last_price"],
                    last_volume=last_volume,
                    is_suspended=filter_result["is_suspended"],
                    passes_filter=filter_result["passes"],
                    price_change_pct=round(price_change, 2),
                    last_updated=datetime.utcnow(),
                )
                db.add(stock)
            else:
                stock.name = info["name"]
                stock.sector = info["sector"]
                stock.last_price = filter_result["last_price"]
                stock.last_volume = last_volume
                stock.is_suspended = filter_result["is_suspended"]
                stock.passes_filter = filter_result["passes"]
                stock.price_change_pct = round(price_change, 2)
                stock.last_updated = datetime.utcnow()

            results["processed"] += 1
            if filter_result["passes"]:
                results["passed"] += 1
            else:
                results["filtered_out"] += 1

        except Exception as e:
            logger.error(f"Error processing {code}: {e}")
            results["errors"] += 1

    # Single commit for all stocks
    await db.commit()

    logger.info(f"Universe refresh complete: {results}")

    return {
        "message": "Universe refresh completed",
        "results": results,
    }


@router.get("/stats")
async def get_universe_stats(db: AsyncSession = Depends(get_db)):
    """Get statistics about the stock universe."""
    total_result = await db.execute(select(func.count(Stock.id)))
    total = total_result.scalar() or 0

    filtered_result = await db.execute(
        select(func.count(Stock.id)).where(Stock.passes_filter == True)
    )
    filtered = filtered_result.scalar() or 0

    suspended_result = await db.execute(
        select(func.count(Stock.id)).where(Stock.is_suspended == True)
    )
    suspended = suspended_result.scalar() or 0

    return {
        "total_stocks": total,
        "passing_filter": filtered,
        "filtered_out": total - filtered,
        "suspected_suspended": suspended,
    }
