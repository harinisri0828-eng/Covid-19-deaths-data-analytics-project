import os
import sys
from datetime import date, datetime, timezone
from pathlib import Path
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

# Ensure backend root is on sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from app.database import Base, get_db
from app.models.country import Country
from app.models.covid import CovidRecord
from app.models.india import IndiaStateRecord
from app.models.metadata import DatasetMetadata
from app.models.prediction import PredictionHistory
from app.main import app

# Isolated In-Memory SQLite Test Database
TEST_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)

@pytest.fixture
def db_session():
    """Provides a transactional database session for an isolated test."""
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def client(db_session):
    """Provides a TestClient with dependency override for get_db."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def seed_test_data(db_session):
    """Seeds synthetic test records separate from real data."""
    # Seed Country
    c1 = Country(
        iso_code="IND",
        continent="Asia",
        location="India",
        population=1400000000,
        population_density=450.0,
        median_age=28.0,
        gdp_per_capita=6500.0,
        life_expectancy=70.0,
        human_development_index=0.65,
    )
    c2 = Country(
        iso_code="USA",
        continent="North America",
        location="United States",
        population=330000000,
        population_density=35.0,
        median_age=38.0,
        gdp_per_capita=55000.0,
        life_expectancy=79.0,
        human_development_index=0.92,
    )
    db_session.add_all([c1, c2])

    # Seed Covid Records (40 chronological daily points to support ML tests)
    records = []
    base_cases = 1000
    for i in range(40):
        d = date(2021, 1, 1 + (i % 28))
        d_actual = date(2021, 1 + (i // 28), (i % 28) + 1)
        cases_today = base_cases + i * 50
        deaths_today = int(cases_today * 0.02)
        records.append(CovidRecord(
            iso_code="IND",
            location="India",
            date=d_actual,
            total_cases=float(cases_today * 10),
            new_cases=float(cases_today),
            new_cases_smoothed=float(cases_today),
            total_deaths=float(deaths_today * 10),
            new_deaths=float(deaths_today),
            new_deaths_smoothed=float(deaths_today),
            total_cases_per_million=150.0,
            total_deaths_per_million=3.0,
            reproduction_rate=1.05,
            total_vaccinations=float(i * 100000),
            people_fully_vaccinated=float(i * 45000),
        ))
    db_session.add_all(records)

    # Seed India State
    s1 = IndiaStateRecord(
        state_name="Maharashtra",
        date=date(2021, 5, 1),
        confirmed=5000000,
        active=100000,
        recovered=4800000,
        deaths=100000,
        tested=25000000,
    )
    s2 = IndiaStateRecord(
        state_name="Kerala",
        date=date(2021, 5, 1),
        confirmed=3000000,
        active=50000,
        recovered=2920000,
        deaths=30000,
        tested=20000000,
    )
    db_session.add_all([s1, s2])

    # Seed Metadata
    meta = DatasetMetadata(
        dataset_name="Test Ingestion Dataset",
        source_url="https://example.com/test-covid.csv",
        records_count=42,
        min_date=date(2021, 1, 1),
        max_date=date(2021, 2, 10),
        geographic_coverage="India & USA Test",
        last_imported_at=datetime.now(timezone.utc),
        status="success",
        notes="Synthetic test fixture for pytest suite.",
    )
    db_session.add(meta)

    db_session.commit()
