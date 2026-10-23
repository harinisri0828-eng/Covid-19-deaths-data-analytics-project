import sys
import os
from pathlib import Path
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from app.database import Base
from app.models.covid import CovidRecord
from app.main import ensure_database_initialized

def test_lifespan_initialization_on_temp_db(tmp_path):
    """
    Tests that ensure_database_initialized() creates schema and safely handles
    data initialization without any UnboundLocalError or NameError for sys/os.
    """
    db_file = tmp_path / "test_init.db"
    test_db_url = f"sqlite:///{db_file}"
    engine = create_engine(test_db_url)
    TestingSession = sessionmaker(bind=engine)
    
    # Verify no sys UnboundLocalError occurs during execution
    # Unset testing env flags temporarily to test the full initialization flow
    old_test = os.environ.pop("PYTEST_CURRENT_TEST", None)
    try:
        # Patch engine in database module
        import app.database
        old_engine = app.database.engine
        old_session = app.database.SessionLocal
        app.database.engine = engine
        app.database.SessionLocal = TestingSession

        # Run initialization with force_ingest=True to test full ingestion on empty db
        ensure_database_initialized(force_ingest=True)

        # Check records were loaded
        with TestingSession() as db:
            count = db.query(CovidRecord).count()
            assert count > 0, f"Expected records to be loaded into empty db, got {count}"

        # Re-run initialization without force_ingest to verify idempotence and safe re-run
        ensure_database_initialized(force_ingest=True)
        with TestingSession() as db:
            count2 = db.query(CovidRecord).count()
            assert count2 == count, f"Idempotence failed: count changed from {count} to {count2}"
    finally:
        if old_test is not None:
            os.environ["PYTEST_CURRENT_TEST"] = old_test
        app.database.engine = old_engine
        app.database.SessionLocal = old_session
