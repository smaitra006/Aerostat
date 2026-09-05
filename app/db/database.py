import logging
from typing import Generator, Optional
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session

from app.core.config import settings

logger = logging.getLogger(__name__)

Base = declarative_base()


def get_engine() -> Optional[Engine]:
    """
    Creates and returns the SQLAlchemy engine if DATABASE_URL is configured.
    Normalizes 'postgres://' schema to 'postgresql://' for SQLAlchemy compatibility.
    Returns None if DATABASE_URL is not set or engine creation fails.
    """
    if not settings.DATABASE_URL:
        return None

    db_url = settings.DATABASE_URL
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    try:
        return create_engine(
            db_url,
            pool_pre_ping=True,
            echo=settings.DEBUG and settings.ENVIRONMENT == "development",
        )
    except Exception as exc:
        logger.warning(f"Failed to create SQLAlchemy engine: {exc}")
        return None


engine = get_engine()

# Configure sessionmaker only if engine is available
SessionLocal = (
    sessionmaker(autocommit=False, autoflush=False, bind=engine)
    if engine is not None
    else None
)


def get_db() -> Generator[Optional[Session], None, None]:
    """
    Dependency injection provider for database sessions.
    Yields a Session if database is configured, otherwise yields None.
    Guarantees session cleanup after request completion.
    """
    if SessionLocal is None:
        yield None
        return

    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_connection() -> bool:
    """
    Attempts a lightweight query (SELECT 1) against the database.
    Returns True if connection succeeds, False if DATABASE_URL is missing,
    unconfigured, or the database is unreachable. Never raises an exception.
    """
    if not settings.DATABASE_URL:
        return False

    active_engine = engine or get_engine()
    if active_engine is None:
        return False

    try:
        with active_engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True
    except Exception as exc:
        logger.warning(f"Database health check failed: {exc}")
        return False
