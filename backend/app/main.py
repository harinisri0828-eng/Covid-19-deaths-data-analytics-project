import os
import sys
import logging
import subprocess
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings, BASE_DIR
from app.database import init_db
import app.database as database
from app.api import api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("covid_backend")

def ensure_database_initialized(force_ingest: bool = False):
    """
    Ensures database schema exists and loads initial historical records if database is empty.
    Safe to rerun without duplicating records or corrupting existing data.
    """
    init_db()
    logger.info("Database schema initialized successfully.")

    # Skip automated data loading in test environments unless explicitly forced
    is_test_env = (
        "pytest" in sys.modules
        or os.environ.get("PYTEST_CURRENT_TEST") is not None
        or os.environ.get("TESTING") == "1"
    )
    if is_test_env and not force_ingest:
        logger.info("Test environment detected; skipping automatic dataset ingestion.")
        return

    from app.models.covid import CovidRecord
    with database.SessionLocal() as db:
        count = db.query(CovidRecord.id).count()
        if count == 0:
            logger.info("Empty database detected. Initiating automated dataset ingestion...")
            owid_csv = BASE_DIR / "data" / "owid-covid-data.csv"
            india_csv = BASE_DIR / "data" / "india_state_level.csv"

            # 1. Ingest OWID dataset
            try:
                from scripts.ingest_owid import ingest_owid_data
                ingest_owid_data(owid_csv)
                logger.info("OWID dataset ingestion completed.")
            except Exception as e:
                logger.error(f"In-process OWID ingestion failed: {e}. Trying via subprocess...", exc_info=True)
                subprocess.run([sys.executable, str(BASE_DIR / "scripts" / "ingest_owid.py")], check=False)

            # 2. Ingest Indian state dataset
            try:
                from scripts.ingest_india import ingest_india_state_data
                ingest_india_state_data(india_csv)
                logger.info("Indian state dataset ingestion completed.")
            except Exception as e:
                logger.error(f"In-process India ingestion failed: {e}. Trying via subprocess...", exc_info=True)
                subprocess.run([sys.executable, str(BASE_DIR / "scripts" / "ingest_india.py")], check=False)

            # 3. Train ML models
            try:
                from scripts.train_models import run_training
                run_training()
                logger.info("ML model training completed.")
            except Exception as e:
                logger.error(f"In-process model training failed: {e}. Trying via subprocess...", exc_info=True)
                subprocess.run([sys.executable, str(BASE_DIR / "scripts" / "train_models.py")], check=False)

            new_count = db.query(CovidRecord.id).count()
            logger.info(f"Automated initial ingestion complete. Verified with {new_count} records.")
        else:
            logger.info(f"Database verified with {count} historical records.")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing application and database...")
    try:
        ensure_database_initialized()
    except Exception as e:
        logger.error(f"Error during schema or data initialization: {e}", exc_info=True)
    yield
    logger.info("Shutting down COVID-19 Analytics Backend.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Data Analytics and Engineering platform for historical COVID-19 analysis and ML forecasting.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Configuration
# Do not use wildcard CORS in production if explicit origins can be configured
logger.info(f"Configuring CORS origins: {settings.cors_origins_list}")
is_wildcard = "*" in settings.cors_origins_list
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origin_regex=settings.CORS_ORIGIN_REGEX if not is_wildcard else None,
    allow_credentials=not is_wildcard,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(api_router)

@app.get("/")
def root():
    return {
        "system": settings.PROJECT_NAME,
        "status": "online",
        "documentation": "/docs",
        "health": "/api/health",
    }

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error processing {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred while processing the epidemiological query."},
    )

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", settings.PORT))
    host = "0.0.0.0" if os.environ.get("RENDER") else settings.HOST
    uvicorn.run("app.main:app", host=host, port=port, reload=True)
