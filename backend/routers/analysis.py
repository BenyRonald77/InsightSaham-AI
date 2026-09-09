"""
InsightSaham — Analysis Router
API endpoints for running analysis pipeline and retrieving results
"""
import logging
from datetime import datetime, date

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from database import get_db
from models.analysis import AnalysisRun
from models.selection import Selection
from services.data_sync import fetch_stock_data, get_all_stock_codes
from services.indicators import calculate_all_indicators
from services.bias_engine import calculate_support_resistance, determine_trend, generate_scenarios
from services.narrative_engine import generate_narrative
from services.broker_summary import (
    fetch_from_indexalpha,
    calculate_bandarmologi_metrics,
    _INDEXALPHA_CACHE,
    get_indexalpha_quota_status,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/analysis", tags=["Analysis"])


class RunAnalysisRequest(BaseModel):
    """Request body for running analysis on selected stocks."""
    stock_codes: list[str]


@router.post("/run")
async def run_analysis(
    request: RunAnalysisRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """
    Jalankan pipeline analisis untuk saham terpilih.
    Pipeline berjalan secara asinkron di background.
    """
    if not request.stock_codes:
        raise HTTPException(status_code=400, detail="Tidak ada saham yang dipilih")

    # Create selection record
    selection = Selection(
        selected_stocks=request.stock_codes,
        total_stocks=len(request.stock_codes),
        completed_stocks=0,
        status="processing",
    )
    db.add(selection)
    await db.commit()
    await db.refresh(selection)

    # Run pipeline in background
    background_tasks.add_task(
        run_analysis_pipeline,
        selection_id=selection.id,
        stock_codes=request.stock_codes,
    )

    return {
        "message": f"Analisis dimulai untuk {len(request.stock_codes)} saham",
        "selection_id": selection.id,
        "stocks": request.stock_codes,
    }


async def run_analysis_pipeline(selection_id: int, stock_codes: list[str]):
    """
    Run the full analysis pipeline for selected stocks.
    This runs as a background task.
    """
    from database import async_session

    async with async_session() as db:
        master = get_all_stock_codes()

        for i, code in enumerate(stock_codes):
            try:
                logger.info(f"Processing {code} ({i+1}/{len(stock_codes)})")

                stock_info = master.get(code, {"name": code, "sector": ""})

                # Step 1: Fetch OHLCV data (1 year for indicators)
                df = await fetch_stock_data(code, period="1y")
                if df is None or df.empty:
                    logger.warning(f"No data for {code}, skipping")
                    continue

                # Step 2: Calculate indicators
                indicators = calculate_all_indicators(df)

                # Step 3: Determine bias & S/R levels
                sr_levels = calculate_support_resistance(df, indicators)
                trend_info = determine_trend(df, indicators)

                # Step 4: Generate scenarios
                scenarios = generate_scenarios(df, indicators, sr_levels, trend_info)

                # Step 5: Calculate price change
                close = float(df["Close"].iloc[-1])
                prev_close = float(df["Close"].iloc[-2]) if len(df) >= 2 else close
                change_pct = ((close - prev_close) / prev_close * 100) if prev_close > 0 else 0

                # Step 6: Calculate Broker Summary & Bandarmologi
                data_date = df.index[-1].date() if hasattr(df.index[-1], 'date') else date.today()
                raw_broker_data = await fetch_from_indexalpha(code, data_date)
                broker_summary = calculate_bandarmologi_metrics(code, data_date, df, raw_broker_data)

                # Step 7: Build analysis data for narrative
                analysis_data = {
                    "stock_code": code,
                    "stock_name": stock_info["name"],
                    "sector": stock_info["sector"],
                    "close_price": close,
                    "price_change_pct": change_pct,
                    "indicators": indicators,
                    "trend_info": trend_info,
                    "sr_levels": sr_levels,
                    "scenarios": scenarios,
                    "broker_summary": broker_summary,
                }

                # Step 8: Generate AI narrative
                narrative = await generate_narrative(analysis_data)

                # Step 9: Save to database
                analysis_run = AnalysisRun(
                    stock_code=code,
                    stock_name=stock_info["name"],
                    sector=stock_info["sector"],
                    analysis_date=date.today(),
                    data_date=data_date,
                    status="completed",
                    open_price=float(df["Open"].iloc[-1]),
                    high_price=float(df["High"].iloc[-1]),
                    low_price=float(df["Low"].iloc[-1]),
                    close_price=close,
                    volume=float(df["Volume"].iloc[-1]),
                    volume_ma20=indicators["latest"].get("volume_ma20", 0) or 0,
                    price_change_pct=round(change_pct, 2),
                    indicators=indicators["latest"],
                    trend=trend_info["trend"],
                    trend_reasons=trend_info,
                    support_levels=sr_levels["support"],
                    resistance_levels=sr_levels["resistance"],
                    scenarios=scenarios,
                    narrative=narrative,
                    chart_data=indicators["chart_series"],
                    broker_summary=broker_summary,
                )

                db.add(analysis_run)

                # Update selection progress
                selection = await db.get(Selection, selection_id)
                if selection:
                    selection.completed_stocks = i + 1

                await db.commit()
                logger.info(f"Completed analysis for {code}")

            except Exception as e:
                logger.error(f"Error analyzing {code}: {e}", exc_info=True)
                continue

        # Mark selection as completed
        selection = await db.get(Selection, selection_id)
        if selection:
            selection.status = "completed"
            await db.commit()

        logger.info(f"Pipeline completed for selection {selection_id}")


@router.get("/status/{selection_id}")
async def get_analysis_status(
    selection_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Check progress of an analysis run."""
    selection = await db.get(Selection, selection_id)
    if not selection:
        raise HTTPException(status_code=404, detail="Selection not found")

    return selection.to_dict()


@router.get("/latest")
async def get_latest_analyses(
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Get the most recent analysis results (for dashboard)."""
    query = (
        select(AnalysisRun)
        .where(AnalysisRun.status == "completed")
        .order_by(desc(AnalysisRun.created_at))
        .limit(limit)
    )
    result = await db.execute(query)
    analyses = result.scalars().all()

    return {
        "total": len(analyses),
        "analyses": [a.to_summary() for a in analyses],
    }


@router.get("/detail/{analysis_id}")
async def get_analysis_detail(
    analysis_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get full analysis detail for a specific analysis run."""
    analysis = await db.get(AnalysisRun, analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    data = analysis.to_dict()
    code = analysis.stock_code.upper().strip()
    target_d = analysis.data_date or analysis.analysis_date or date.today()
    date_str = target_d.strftime("%Y-%m-%d")
    cache_key = f"{code}_{date_str}_{date_str}"

    existing_bs = data.get("broker_summary") or {}
    existing_src = existing_bs.get("summary", {}).get("source", "")

    # Regenerate if broker_summary is missing or if live Index Alpha data is available in cache but not in DB
    if not existing_bs or "timeframes" not in existing_bs or (cache_key in _INDEXALPHA_CACHE and "Index Alpha" not in existing_src):
        data["broker_summary"] = calculate_bandarmologi_metrics(
            code,
            target_d,
            None,
        )
        analysis.broker_summary = data["broker_summary"]
        await db.commit()
    return data


@router.get("/broker-summary-quota")
async def get_broker_quota():
    """Get Index Alpha connection and Free Tier quota usage status."""
    return get_indexalpha_quota_status()


@router.get("/broker-summary/{stock_code}")
async def get_broker_summary(
    stock_code: str,
    timeframe: str = Query("today", description="today, yesterday, 1w, 7w, 1m"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get Broker Summary for a stock across timeframes (today, yesterday, 1w, 7w, 1m).
    """
    code = stock_code.upper().strip()
    query = (
        select(AnalysisRun)
        .where(AnalysisRun.stock_code == code)
        .where(AnalysisRun.status == "completed")
        .order_by(desc(AnalysisRun.analysis_date))
        .limit(1)
    )
    res = await db.execute(query)
    run = res.scalar_one_or_none()

    target_date = run.analysis_date if run and run.analysis_date else date.today()
    date_str = target_date.strftime("%Y-%m-%d")
    cache_key = f"{code}_{date_str}_{date_str}"

    # Check if run's broker_summary can be used directly
    if run and run.broker_summary and "timeframes" in run.broker_summary:
        existing_src = run.broker_summary.get("summary", {}).get("source", "")
        # If cache has live Index Alpha data but run has synthetic data, recalculate
        if not (cache_key in _INDEXALPHA_CACHE and "Index Alpha" not in existing_src):
            tf_data = run.broker_summary["timeframes"].get(timeframe)
            if tf_data:
                return tf_data

    # Otherwise recalculate with available cache / live engine
    full_metrics = calculate_bandarmologi_metrics(code, target_date, None)
    if run:
        run.broker_summary = full_metrics
        await db.commit()

    if "timeframes" in full_metrics and timeframe in full_metrics["timeframes"]:
        return full_metrics["timeframes"][timeframe]
    return full_metrics


@router.get("/stock/{stock_code}")
async def get_stock_analyses(
    stock_code: str,
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """Get analysis history for a specific stock."""
    query = (
        select(AnalysisRun)
        .where(AnalysisRun.stock_code == stock_code.upper())
        .where(AnalysisRun.status == "completed")
        .order_by(desc(AnalysisRun.analysis_date))
        .limit(limit)
    )
    result = await db.execute(query)
    analyses = result.scalars().all()

    return {
        "stock_code": stock_code.upper(),
        "total": len(analyses),
        "analyses": [a.to_dict() for a in analyses],
    }


@router.get("/archive")
async def get_archive(
    date_from: str = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: str = Query(None, description="End date (YYYY-MM-DD)"),
    stock_code: str = Query(None),
    sector: str = Query(None),
    trend: str = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Browse historical analysis archive."""
    query = select(AnalysisRun).where(AnalysisRun.status == "completed")

    if date_from:
        query = query.where(AnalysisRun.analysis_date >= date_from)
    if date_to:
        query = query.where(AnalysisRun.analysis_date <= date_to)
    if stock_code:
        query = query.where(AnalysisRun.stock_code == stock_code.upper())
    if sector:
        query = query.where(AnalysisRun.sector == sector)
    if trend:
        query = query.where(AnalysisRun.trend == trend.upper())

    query = query.order_by(desc(AnalysisRun.analysis_date), AnalysisRun.stock_code)
    result = await db.execute(query)
    analyses = result.scalars().all()

    return {
        "total": len(analyses),
        "analyses": [a.to_summary() for a in analyses],
    }
