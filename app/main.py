from fastapi import FastAPI
from app.core.config import settings
from app.db import database

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="FastAPI + PostgreSQL backend for AeroStat",
)


@app.get("/health", summary="Health Check")
def health_check():
    """
    Health check endpoint.
    Actively attempts a database connection and reports real connectivity status.
    Returns db_connected: false with HTTP 200 if DATABASE_URL is missing or unreachable.
    """
    db_connected = database.check_db_connection()
    return {
        "status": "ok",
        "db_connected": db_connected,
    }
