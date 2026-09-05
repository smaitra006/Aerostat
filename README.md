# AeroStat

AeroStat is a high-performance backend service built with Python 3.11, FastAPI, SQLAlchemy 2.0, and Alembic for PostgreSQL database migrations.

---

## Repository Structure

```
.
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application instance & health check
│   ├── api/                 # API routers (empty __init__.py for initial scaffold)
│   │   └── __init__.py
│   ├── core/                # Application configuration & environment settings
│   │   ├── __init__.py
│   │   └── config.py
│   ├── db/                  # Database engine, sessionmaker & dependency injection
│   │   ├── __init__.py
│   │   └── database.py
│   ├── models/              # SQLAlchemy database models (Phase 1)
│   │   └── __init__.py
│   └── adapters/            # External integration adapters (Phase 4)
│       └── __init__.py
├── tests/
│   ├── __init__.py
│   └── test_health.py       # Health check endpoint tests
├── alembic/                 # Alembic migrations directory
│   ├── env.py               # Migration environment configuration
│   ├── script.py.mako       # Migration script template
│   └── versions/            # Migration revisions directory
├── alembic.ini              # Alembic configuration file
├── .env.example             # Example environment variables template
├── requirements.txt         # Pinned Python package dependencies
└── README.md                # Project documentation
```

---

## Setup & Installation

### 1. Prerequisites
- Python 3.11+
- PostgreSQL (or local SQLite for testing)

### 2. Create Virtual Environment
```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
Copy `.env.example` to `.env` and set your credentials:
```bash
cp .env.example .env
```

Environment variables:
- `DATABASE_URL`: PostgreSQL connection string (`postgresql://<user>:<password>@<host>:<port>/<database>`)
- `PROJECT_NAME`: Application name (default: `"AeroStat"`)
- `ENVIRONMENT`: Environment designation (default: `"development"`)
- `DEBUG`: Boolean flag for debug mode (default: `true`)
- `HOST`: Server host binding (default: `0.0.0.0`)
- `PORT`: Server port (default: `8000`)

---

## Running the Application

Start the local development server with live reload via a single command:

```bash
uvicorn app.main:app --reload
```

Optionally specify host and port:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive API documentation will be available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

## Health Check Endpoint

### `GET /health`

The health check endpoint performs a real connectivity check to the database using `SELECT 1` without crashing if the database is unreachable or if `DATABASE_URL` is missing.

**Response when database is connected:**
```json
{
  "status": "ok",
  "db_connected": true
}
```

**Response when database is unreachable or unconfigured (HTTP 200):**
```json
{
  "status": "ok",
  "db_connected": false
}
```

---

## Database Migrations (Alembic)

Run migrations to head:
```bash
alembic upgrade head
```

Generate a new migration (Phase 1):
```bash
alembic revision --autogenerate -m "Add initial models"
```

Roll back by one revision:
```bash
alembic downgrade -1
```

---

## Running Tests

Execute the full test suite with a single command:

```bash
pytest
```

Run with verbose output and coverage:
```bash
pytest -v
```
