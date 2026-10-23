"""
India State-Level Historical Dataset Ingestion Script
Ingests Indian States and Union Territories COVID-19 data into PostgreSQL / Database.
Tracks confirmed, active, recovered, deaths, and testing metrics.
"""

import sys
import logging
from pathlib import Path
from datetime import datetime, timezone
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from app.database import engine, SessionLocal, init_db
from app.models.india import IndiaStateRecord
from app.models.metadata import DatasetMetadata

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ingest_india")

DATA_FILE = BASE_DIR / "data" / "india_state_level.csv"

def ingest_india_state_data(csv_path: Path):
    if not csv_path.exists():
        logger.warning(f"Indian state dataset not found at {csv_path}. Skipping state ingestion.")
        return False

    logger.info(f"Loading Indian state records from {csv_path}...")
    df = pd.read_csv(csv_path)
    df.columns = df.columns.str.strip()

    if "state_name" not in df.columns or "date" not in df.columns:
        logger.error("State dataset must contain 'state_name' and 'date' columns.")
        return False

    df["date"] = pd.to_datetime(df["date"], errors="coerce").dt.date
    df = df.dropna(subset=["state_name", "date"]).drop_duplicates(subset=["state_name", "date"])

    init_db()
    db = SessionLocal()

    try:
        # Clear existing state records for idempotent import
        db.query(IndiaStateRecord).delete()
        db.commit()

        records = []
        for _, r in df.iterrows():
            def get_int(k):
                if k in r and pd.notna(r[k]):
                    try:
                        return int(r[k])
                    except (ValueError, TypeError):
                        return None
                return None

            records.append({
                "state_name": str(r["state_name"]).strip(),
                "date": r["date"],
                "confirmed": get_int("confirmed"),
                "active": get_int("active"),
                "recovered": get_int("recovered"),
                "deaths": get_int("deaths"),
                "confirmed_delta": get_int("confirmed_delta"),
                "recovered_delta": get_int("recovered_delta"),
                "deaths_delta": get_int("deaths_delta"),
                "tested": get_int("tested"),
                "vaccinated_dose1": get_int("vaccinated_dose1"),
                "vaccinated_dose2": get_int("vaccinated_dose2"),
            })

        db.bulk_insert_mappings(IndiaStateRecord, records)
        db.commit()

        # Update metadata
        min_date = df["date"].min()
        max_date = df["date"].max()
        states_count = df["state_name"].nunique()

        meta = db.query(DatasetMetadata).filter(
            DatasetMetadata.dataset_name == "India MoHFW / Covid19India State Archive"
        ).first()

        if not meta:
            meta = DatasetMetadata(
                dataset_name="India MoHFW / Covid19India State Archive",
                source_url="https://api.covid19india.org/ / MoHFW State Bulletin",
                records_count=len(records),
                min_date=min_date,
                max_date=max_date,
                geographic_coverage=f"{states_count} States & Union Territories of India",
                last_imported_at=datetime.now(timezone.utc),
                status="success",
                notes="State-level epidemiological observations across Indian administrative divisions.",
            )
            db.add(meta)
        else:
            meta.records_count = len(records)
            meta.min_date = min_date
            meta.max_date = max_date
            meta.geographic_coverage = f"{states_count} States & Union Territories of India"
            meta.last_imported_at = datetime.now(timezone.utc)
            meta.status = "success"

        db.commit()
        logger.info(f"Ingested {len(records):,} records across {states_count} Indian States/UTs.")
        return True

    except Exception as e:
        db.rollback()
        logger.error(f"Error during state ingestion: {e}", exc_info=True)
        return False
    finally:
        db.close()

if __name__ == "__main__":
    ingest_india_state_data(DATA_FILE)
