"""
InsightSaham — Database Setup
SQLAlchemy async engine + session for SQLite
"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from config import settings


# Create async engine with SQLite-specific settings
engine = create_async_engine(
    settings.database_url,
    echo=False,  # Set to True for SQL debugging
    future=True,
    connect_args={"check_same_thread": False},
)

# Session factory
async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass


async def init_db():
    """Create all tables if they don't exist."""
    async with engine.begin() as conn:
        # Enable WAL mode for better concurrent access
        await conn.execute(
            __import__("sqlalchemy").text("PRAGMA journal_mode=WAL")
        )
        await conn.run_sync(Base.metadata.create_all)


async def get_db() -> AsyncSession:
    """Dependency for FastAPI — yields a database session."""
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()
