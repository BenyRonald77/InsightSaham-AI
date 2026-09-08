"""
InsightSaham — FastAPI Application Entry Point
Main application with CORS, routing, and lifecycle management.
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from config import settings
from database import init_db
from routers import universe, analysis, settings as settings_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# Suppress noisy third-party loggers
for noisy in ["yfinance", "urllib3", "peewee", "aiosqlite", "charset_normalizer"]:
    logging.getLogger(noisy).setLevel(logging.WARNING)



@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle: startup and shutdown."""
    # Startup
    logger.info("🚀 InsightSaham starting up...")
    await init_db()
    logger.info("✅ Database initialized")

    provider_name = settings.llm_provider
    logger.info(f"📡 LLM Provider: {provider_name}")

    yield

    # Shutdown
    logger.info("👋 InsightSaham shutting down...")


# Create FastAPI app
app = FastAPI(
    title="InsightSaham API",
    description="AI Technical Analysis Generator for IDX Stocks",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=r"https://.*\.vercel\.app|http://localhost:.*|http://127\.0\.0\.1:.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(universe.router)
app.include_router(analysis.router)
app.include_router(settings_router.router)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "name": "InsightSaham API",
        "version": "1.0.0",
        "status": "running",
    }


@app.get("/api/health")
async def health():
    """Detailed health check."""
    from utils.llm_providers.gemini import GeminiProvider

    llm_status = "unavailable"
    if settings.llm_provider == "gemini":
        if GeminiProvider().is_available():
            llm_status = "available"

    return {
        "status": "healthy",
        "database": "connected",
        "llm_provider": settings.llm_provider,
        "llm_status": llm_status,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )
