"""
OWID COVID-19 Historical Dataset Ingestion Script
Ingests Our World In Data historical COVID-19 dataset into PostgreSQL / SQLAlchemy database.
Safe, idempotent, detects duplicate records, parses dates, and logs quality metrics.
"""

import os
import sys
import argparse
import logging
from pathlib import Path
from datetime import datetime, timezone
import pandas as pd
import numpy as np

# Ensure backend root is on sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from app.config import settings
from app.database import engine, SessionLocal, init_db
from app.models.covid import CovidRecord
from app.models.country import Country
from app.models.metadata import DatasetMetadata

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ingest_owid")

DATA_SOURCE_URL = "https://covid.ourworldindata.org/data/owid-covid-data.csv"
LOCAL_CSV_PATH = BASE_DIR / "data" / "owid-covid-data.csv"

def download_dataset(target_path: Path) -> bool:
    """Attempts to download the OWID dataset if not present locally."""
    import urllib.request
    logger.info(f"Downloading historical OWID dataset from {DATA_SOURCE_URL}...")
    target_path.parent.mkdir(parents=True, exist_ok=True)
    try:
        urllib.request.urlretrieve(DATA_SOURCE_URL, target_path)
        logger.info(f"Download complete: {target_path} ({target_path.stat().st_size:,} bytes)")
        return True
    except Exception as e:
        logger.error(f"External download failed from {DATA_SOURCE_URL}: {e}")
        print("\n" + "=" * 70)
        print("[INGESTION NOTICE: EXTERNAL DOWNLOAD UNAVAILABLE]")
        print(f"Error detail: {e}")
        print("\n[CLEAR RETRY PROCEDURE]")
        print("1. Download owid-covid-data.csv from:")
        print("   https://covid.ourworldindata.org/data/owid-covid-data.csv")
        print(f"2. Place the file at: {target_path}")
        print(f"3. Rerun ingestion: python scripts/ingest_owid.py --csv-path \"{target_path}\"")
        print("=" * 70 + "\n")
        return False

def ingest_owid_data(csv_path: Path):
    """Parses, validates, and ingests the OWID dataset into the database."""
    if not csv_path.exists():
        success = download_dataset(csv_path)
        if not success:
            logger.error(f"Cannot proceed: CSV file not found at {csv_path}")
            return False

    logger.info(f"Reading dataset from {csv_path}...")
    try:
        df = pd.read_csv(csv_path, low_memory=False)
    except Exception as e:
        logger.error(f"Failed to parse CSV: {e}")
        return False

    logger.info(f"Dataset loaded: {len(df):,} rows, {len(df.columns)} columns.")

    # Validate essential columns
    required_cols = ["iso_code", "location", "date"]
    missing_req = [col for col in required_cols if col not in df.columns]
    if missing_req:
        logger.error(f"Dataset is missing required columns: {missing_req}")
        return False

    # Data Quality: Parse dates
    df["date"] = pd.to_datetime(df["date"], errors="coerce").dt.date
    initial_count = len(df)
    df = df.dropna(subset=["iso_code", "location", "date"])
    dropped_invalid_date = initial_count - len(df)
    if dropped_invalid_date > 0:
        logger.warning(f"Dropped {dropped_invalid_date} rows with invalid dates or missing keys.")

    # Deduplicate (iso_code, date) keeping latest
    dedup_before = len(df)
    df = df.drop_duplicates(subset=["iso_code", "date"], keep="last")
    dedup_dropped = dedup_before - len(df)
    if dedup_dropped > 0:
        logger.info(f"Deduplicated {dedup_dropped} duplicate records.")

    # Quality Summary
    logger.info("Reporting missing values summary for critical indicators:")
    for col in ["total_cases", "new_cases", "total_deaths", "total_vaccinations"]:
        if col in df.columns:
            null_pct = (df[col].isna().sum() / len(df)) * 100
            logger.info(f"  - {col}: {null_pct:.1f}% missing or unrecorded")

    # Initialize Database Schema
    init_db()
    db = SessionLocal()

    try:
        # 1. Ingest Countries Metadata
        logger.info("Extracting and updating country metadata...")
        country_cols = [
            "iso_code", "continent", "location", "population",
            "population_density", "median_age", "gdp_per_capita",
            "life_expectancy", "human_development_index"
        ]
        available_country_cols = [c for c in country_cols if c in df.columns]
        country_df = (
            df[available_country_cols]
            .drop_duplicates(subset=["iso_code"])
            .copy()
        )

        for _, row in country_df.iterrows():
            iso = str(row["iso_code"]).strip()
            loc = str(row["location"]).strip()
            existing_c = db.query(Country).filter(Country.iso_code == iso).first()
            if not existing_c:
                c = Country(
                    iso_code=iso,
                    continent=str(row.get("continent", "")) if pd.notna(row.get("continent")) else None,
                    location=loc,
                    population=int(row["population"]) if "population" in row and pd.notna(row["population"]) else None,
                    population_density=float(row["population_density"]) if "population_density" in row and pd.notna(row["population_density"]) else None,
                    median_age=float(row["median_age"]) if "median_age" in row and pd.notna(row["median_age"]) else None,
                    gdp_per_capita=float(row["gdp_per_capita"]) if "gdp_per_capita" in row and pd.notna(row["gdp_per_capita"]) else None,
                    life_expectancy=float(row["life_expectancy"]) if "life_expectancy" in row and pd.notna(row["life_expectancy"]) else None,
                    human_development_index=float(row["human_development_index"]) if "human_development_index" in row and pd.notna(row["human_development_index"]) else None,
                )
                db.add(c)
        db.commit()
        logger.info("Country metadata synchronized.")

        # 2. Ingest COVID Records (Batch Inserts)
        logger.info("Synchronizing COVID time-series records...")
        
        # Idempotent: clear existing records or upsert
        # To make it fast and repeatable:
        logger.info("Performing idempotent synchronization...")
        
        # Prepare list of dicts for bulk insert
        records_to_insert = []
        for _, row in df.iterrows():
            def get_num(key):
                if key in row and pd.notna(row[key]):
                    try:
                        return float(row[key])
                    except (ValueError, TypeError):
                        return None
                return None

            records_to_insert.append({
                "iso_code": str(row["iso_code"]).strip(),
                "location": str(row["location"]).strip(),
                "date": row["date"],
                "total_cases": get_num("total_cases"),
                "new_cases": get_num("new_cases"),
                "new_cases_smoothed": get_num("new_cases_smoothed"),
                "total_deaths": get_num("total_deaths"),
                "new_deaths": get_num("new_deaths"),
                "new_deaths_smoothed": get_num("new_deaths_smoothed"),
                "total_cases_per_million": get_num("total_cases_per_million"),
                "new_cases_per_million": get_num("new_cases_per_million"),
                "total_deaths_per_million": get_num("total_deaths_per_million"),
                "new_deaths_per_million": get_num("new_deaths_per_million"),
                "reproduction_rate": get_num("reproduction_rate"),
                "total_tests": get_num("total_tests"),
                "new_tests": get_num("new_tests"),
                "positive_rate": get_num("positive_rate"),
                "tests_per_case": get_num("tests_per_case"),
                "total_vaccinations": get_num("total_vaccinations"),
                "people_vaccinated": get_num("people_vaccinated"),
                "people_fully_vaccinated": get_num("people_fully_vaccinated"),
                "new_vaccinations": get_num("new_vaccinations"),
                "stringency_index": get_num("stringency_index"),
            })

        # Clear existing table to ensure idempotent refresh
        db.query(CovidRecord).delete()
        db.commit()

        # Batch insert in chunks of 5000
        batch_size = 5000
        total_batches = (len(records_to_insert) + batch_size - 1) // batch_size
        logger.info(f"Inserting {len(records_to_insert):,} records in {total_batches} batches...")
        
        for b_idx in range(total_batches):
            batch = records_to_insert[b_idx * batch_size : (b_idx + 1) * batch_size]
            db.bulk_insert_mappings(CovidRecord, batch)
            db.commit()
            if (b_idx + 1) % 5 == 0 or (b_idx + 1) == total_batches:
                logger.info(f"  - Ingested batch {b_idx + 1}/{total_batches} ({min((b_idx + 1) * batch_size, len(records_to_insert)):,} rows)")

        # 3. Update Dataset Metadata
        min_date = df["date"].min()
        max_date = df["date"].max()
        unique_locs = df["location"].nunique()

        meta = db.query(DatasetMetadata).filter(
            DatasetMetadata.dataset_name == "Our World in Data (OWID) COVID-19"
        ).first()

        if not meta:
            meta = DatasetMetadata(
                dataset_name="Our World in Data (OWID) COVID-19",
                source_url=DATA_SOURCE_URL,
                records_count=len(records_to_insert),
                min_date=min_date,
                max_date=max_date,
                geographic_coverage=f"{unique_locs} countries and territories globally",
                last_imported_at=datetime.now(timezone.utc),
                status="success",
                notes="Official OWID time-series including confirmed cases, deaths, testing, and vaccination records.",
            )
            db.add(meta)
        else:
            meta.records_count = len(records_to_insert)
            meta.min_date = min_date
            meta.max_date = max_date
            meta.geographic_coverage = f"{unique_locs} countries and territories globally"
            meta.last_imported_at = datetime.now(timezone.utc)
            meta.status = "success"

        db.commit()
        logger.info(f"Metadata recorded: {min_date} to {max_date}, {unique_locs} locations, {len(records_to_insert):,} rows.")
        logger.info("OWID ingestion completed successfully.")
        return True

    except Exception as e:
        db.rollback()
        logger.error(f"Database error during ingestion: {e}", exc_info=True)
        return False
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ingest OWID COVID-19 Dataset into PostgreSQL / Database")
    parser.add_argument("--csv-path", type=str, default=str(LOCAL_CSV_PATH), help="Path to local OWID CSV file")
    args = parser.parse_args()
    
    csv_file = Path(args.csv_path)
    ingest_owid_data(csv_file)
