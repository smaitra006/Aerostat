from unittest.mock import patch
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine

from app.main import app
from app.core.config import settings
import app.db.database as db_module

client = TestClient(app)


def test_health_when_db_disconnected():
    """
    Verify /health returns HTTP 200 and db_connected: false
    when the database is unreachable or disconnected.
    """
    with patch.object(db_module, "check_db_connection", return_value=False):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["db_connected"] is False


def test_health_when_db_connected():
    """
    Verify /health returns HTTP 200 and db_connected: true
    when the database connection is verified.
    """
    with patch.object(db_module, "check_db_connection", return_value=True):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["db_connected"] is True


def test_health_with_real_engine_connection(monkeypatch):
    """
    Verify that check_db_connection actually executes a real query
    (SELECT 1) against a live engine (in-memory SQLite) and returns True.
    """
    test_engine = create_engine("sqlite:///:memory:")
    monkeypatch.setattr(db_module, "engine", test_engine)
    monkeypatch.setattr(settings, "DATABASE_URL", "sqlite:///:memory:")

    # Direct database module verification
    assert db_module.check_db_connection() is True

    # FastAPI endpoint end-to-end verification
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["db_connected"] is True


def test_health_with_missing_database_url(monkeypatch):
    """
    Verify that /health does not crash when DATABASE_URL is unset,
    returning db_connected: false with HTTP 200.
    """
    monkeypatch.setattr(settings, "DATABASE_URL", None)
    monkeypatch.setattr(db_module, "engine", None)

    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["db_connected"] is False
