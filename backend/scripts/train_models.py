"""
Machine Learning Training & Validation Script
Trains Linear Regression, Ridge, and Random Forest models using chronological train/test split.
Evaluates out-of-sample MAE, RMSE, R2, and MAPE to prevent future data leakage.
Serializes trained estimators into saved_models/ with Joblib.
"""

import sys
import logging
from pathlib import Path
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from app.database import SessionLocal, init_db
from app.models.covid import CovidRecord
from app.ml.models import ml_pipeline

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("train_models")

def run_training():
    init_db()
    db = SessionLocal()

    try:
        logger.info("Querying historical time-series data for India / Global...")
        records = (
            db.query(
                CovidRecord.date,
                CovidRecord.location,
                CovidRecord.new_cases,
                CovidRecord.new_cases_smoothed,
                CovidRecord.total_cases,
            )
            .filter(CovidRecord.iso_code.in_(["IND", "OWID_WRL"]))
            .order_by(CovidRecord.date)
            .all()
        )

        if not records or len(records) < 30:
            logger.error("Insufficient records in database for ML training (need at least 30 observations).")
            logger.info("Please run scripts/ingest_owid.py first to populate database.")
            return False

        df = pd.DataFrame([{
            "date": r.date,
            "location": r.location,
            "new_cases": float(r.new_cases_smoothed or r.new_cases or 0),
        } for r in records])

        logger.info(f"Loaded {len(df):,} chronological records. Executing training pipeline...")
        results = ml_pipeline.train_and_evaluate(df, target_col="new_cases")

        print("\n" + "=" * 70)
        print("COVID-19 PREDICTIVE INTELLIGENCE — MODEL EVALUATION BENCHMARKS")
        print("Chronological 80/20 Train-Test Split (Zero Future-Data Leakage)")
        print("=" * 70)
        for m in results["models"]:
            best_tag = " [CHAMPION]" if m.get("is_best") else ""
            print(f"Algorithm: {m['name']}{best_tag}")
            print(f"  - R² Score:    {m['r2']:.4f}")
            print(f"  - RMSE:        {m['rmse']:,.1f}")
            print(f"  - MAE:         {m['mae']:,.1f}")
            print(f"  - MAPE:        {m['mape']*100:.2f}%")
            print(f"  - Latency:     {m['latency_ms']} ms")
            print("-" * 50)
        print(f"Best Performing Model: {results['summary']['best_model_name']}")
        print(f"Model artifacts saved to: {ml_pipeline.saved_dir}")
        print("=" * 70 + "\n")
        return True

    except Exception as e:
        logger.error(f"Error during ML training: {e}", exc_info=True)
        return False
    finally:
        db.close()

if __name__ == "__main__":
    run_training()
