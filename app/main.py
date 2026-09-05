from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.core.config import settings
from app.db import database
from app.api.routes import router
from app.core.scheduler import start_scheduler

from app.db.seed import initialize_database

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize DB and start the background web scraper scheduler
    initialize_database()
    start_scheduler()
    yield
    # Shutdown logic can go here

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="FastAPI + PostgreSQL backend for AeroStat",
    lifespan=lifespan
)

# Enable CORS for local development with React
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/health", summary="Health Check")
def health_check():
    """
    Health check endpoint.
    """
    db_connected = database.check_db_connection()
    return {
        "status": "ok",
        "db_connected": db_connected,
    }
