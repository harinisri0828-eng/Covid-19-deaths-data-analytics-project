import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import init_db
from app.api import api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("covid_backend")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database schema...")
    try:
        init_db()
        logger.info("Database schema initialized successfully.")
        
        # Self-healing dataset check for new cloud deployments (skipped during test runs)
        is_test_env = "pytest" in sys.modules or os.environ.get("PYTEST_CURRENT_TEST") is not None
        if not is_test_env:
            from app.database import SessionLocal
            from app.models.covid import CovidRecord
            with SessionLocal() as db:
                count = db.query(CovidRecord).count()
                if count == 0:
                    logger.info("Empty database detected. Initiating automated dataset ingestion...")
                    import subprocess, sys
                    from app.config import BASE_DIR
                    subprocess.run([sys.executable, str(BASE_DIR / "scripts" / "ingest_owid.py")], check=False)
                    subprocess.run([sys.executable, str(BASE_DIR / "scripts" / "ingest_india.py")], check=False)
                    subprocess.run([sys.executable, str(BASE_DIR / "scripts" / "train_models.py")], check=False)
                    logger.info("Automated initial ingestion and model training complete.")
                else:
                    logger.info(f"Database verified with {count} historical records.")
    except Exception as e:
        logger.error(f"Error during schema or data initialization: {e}")
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
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
