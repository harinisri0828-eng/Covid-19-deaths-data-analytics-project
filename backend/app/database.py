import time
import logging
from typing import Generator, Dict, Any
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.config import settings

logger = logging.getLogger("uvicorn.error")

db_url = settings.normalized_database_url

# Configure engine with dialect-specific options
connect_args = {}
engine_kwargs: Dict[str, Any] = {
    "echo": False,
    "future": True,
}

if db_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False
    engine_kwargs["connect_args"] = connect_args
else:
    # PostgreSQL connection pooling
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_recycle"] = 1800

try:
    engine = create_engine(db_url, **engine_kwargs)
except Exception as e:
    logger.error(f"Failed to initialize database engine for URL: {db_url}. Error: {e}")
    # Fallback to local SQLite if PostgreSQL fails to initialize
    fallback_url = "sqlite:///./covid_analytics.db"
    logger.warning(f"Falling back to local SQLite database: {fallback_url}")
    engine = create_engine(fallback_url, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)
Base = declarative_base()

def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency yielding a transactional database session.
    Automatically rolls back uncommitted changes if an exception occurs.
    """
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

def check_db_connection() -> Dict[str, Any]:
    """
    Executes a lightweight query to verify active database connectivity.
    Reports status, dialect, latency in ms, and any error encountered.
    """
    start_time = time.time()
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        latency_ms = round((time.time() - start_time) * 1000, 2)
        return {
            "status": "connected",
            "dialect": engine.dialect.name,
            "latency_ms": latency_ms,
            "error": None,
        }
    except Exception as e:
        latency_ms = round((time.time() - start_time) * 1000, 2)
        return {
            "status": "disconnected",
            "dialect": engine.dialect.name if hasattr(engine, "dialect") else "unknown",
            "latency_ms": latency_ms,
            "error": str(e),
        }

def init_db():
    """Create all tables in the database."""
    Base.metadata.create_all(bind=engine)
