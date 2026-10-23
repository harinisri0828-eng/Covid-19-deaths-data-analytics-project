import os
import logging
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from datetime import date
from sqlalchemy import func, desc, asc
from sqlalchemy.orm import Session
from scipy.signal import find_peaks
from scipy.stats import gamma
from app.models.covid import CovidRecord
from app.config import settings, BASE_DIR

logger = logging.getLogger("analytics_service")

def estimate_effective_rt(
    df: pd.DataFrame,
    mean_si: float = 5.0,
    std_si: float = 3.0,
    window: int = 7
) -> Optional[float]:
    """
    Estimates the instantaneous effective reproduction number (Rt) using the renewal equation
    framework (Cori et al., 2013, EpiEstim) with a discretized Gamma serial interval distribution.

    Assumptions & Method:
    - Serial interval of SARS-CoV-2 is assumed to follow a Gamma distribution with mean=5.0 days,
      std=3.0 days (empirically established across major epidemiological studies, e.g. Nishiura et al. 2020).
    - Uses 7-day smoothed incidence to filter out administrative weekend reporting anomalies.
    - Applies a sliding weekly window of tau=7 days.
    - Numerical stability & insufficient data handling: Returns None if cumulative incidence over the
      window is < 15 cases or total infectiousness Lambda < 10, preventing volatile artifacts.
    """
    if len(df) < (window + 7) or "smoothed_cases" not in df.columns:
        return None

    # Gamma distribution parameters for serial interval
    shape_k = (mean_si / std_si) ** 2
    scale_theta = (std_si ** 2) / mean_si
    max_days = 25
    w = np.zeros(max_days + 1)
    for s in range(1, max_days + 1):
        w[s] = gamma.cdf(s, a=shape_k, scale=scale_theta) - gamma.cdf(s - 1, a=shape_k, scale=scale_theta)

    w_sum = w.sum()
    if w_sum <= 0:
        return None
    w = w / w_sum

    cases = df["smoothed_cases"].values
    n = len(cases)
    Lambda = np.zeros(n)
    for t in range(1, n):
        s_max = min(t, max_days)
        if s_max > 0:
            past_cases = cases[t - s_max : t][::-1]
            Lambda[t] = np.sum(past_cases * w[1 : s_max + 1])

    # Evaluate instantaneous reproduction number over latest sliding window
    if n >= window:
        sum_cases = float(np.sum(cases[n - window : n]))
        sum_lambda = float(np.sum(Lambda[n - window : n]))
        if sum_cases >= 15.0 and sum_lambda >= 10.0:
            rt_val = round(sum_cases / sum_lambda, 2)
            # Bound within plausible biological limits
            return max(0.1, min(rt_val, 5.0))

    return None

def detect_epidemic_waves(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Derives distinct epidemic waves from actual historical daily COVID-19 cases using a
    documented, reproducible peak-detection method (scipy.signal.find_peaks).

    Method & Noise Filtering:
    - Analyzes 14-day rolling moving average to isolate substantive epidemic waves from short reporting noise.
    - Distance constraint: Minimum 60 days between major peaks to ensure wave separation.
    - Prominence threshold: Requires peak prominence >= 15% of the series maximum (min 10,000 cases
      for national series), filtering out minor weekly bumps.
    - Wave boundaries: Delimits each wave using the intermediate local minimum (trough) between peaks.
    - Computes peak cases, peak deaths, wave timeframe, and empirical Case Fatality Rate (CFR) directly from observed data.
    """
    if len(df) < 30 or "ma_14" not in df.columns:
        return []

    max_cases = float(df["ma_14"].max())
    if max_cases <= 0:
        return []

    prominence_threshold = max(10000.0, max_cases * 0.15) if max_cases > 20000 else max(100.0, max_cases * 0.15)

    peaks, props = find_peaks(
        df["ma_14"].values,
        distance=60,
        prominence=prominence_threshold,
        width=14
    )

    if len(peaks) == 0:
        return []

    # Identify troughs between consecutive peaks
    troughs = []
    # Onset of first wave
    start_idx = 0
    for i in range(peaks[0]):
        if df.loc[i, "ma_14"] > 0.05 * df.loc[peaks[0], "ma_14"]:
            start_idx = max(0, i - 7)
            break
    troughs.append(start_idx)

    for i in range(len(peaks) - 1):
        p1 = peaks[i]
        p2 = peaks[i + 1]
        valley_idx = p1 + int(df.loc[p1:p2, "ma_14"].values.argmin())
        troughs.append(valley_idx)

    # Resolution of last peak
    last_peak = peaks[-1]
    end_idx = len(df) - 1
    for i in range(last_peak, len(df)):
        if df.loc[i, "ma_14"] < 0.10 * df.loc[last_peak, "ma_14"]:
            end_idx = i
            break
    troughs.append(end_idx)

    known_variants = {
        1: ("Ancestral / B.1", "Wave 1 (Ancestral Variant)"),
        2: ("Delta (B.1.617.2)", "Wave 2 (Delta Surge)"),
        3: ("Omicron (BA.1 / BA.2)", "Wave 3 (Omicron Wave)")
    }

    waves = []
    for i in range(len(peaks)):
        w_start = troughs[i]
        w_end = troughs[i + 1]
        slice_df = df.iloc[w_start : w_end + 1]

        start_d = df.iloc[w_start]["date"]
        end_d = df.iloc[w_end]["date"]

        peak_cases = int(round(slice_df["new_cases"].max()))
        peak_deaths = int(round(slice_df["new_deaths"].max()))

        tot_cases = float(slice_df["new_cases"].sum())
        tot_deaths = float(slice_df["new_deaths"].sum())
        cfr = round(tot_deaths / tot_cases, 4) if tot_cases > 0 else 0.01

        v_info = known_variants.get(i + 1, (f"Genomic Lineage {i+1}", f"Epidemic Wave {i+1}"))

        waves.append({
            "wave_name": v_info[1],
            "period": f"{start_d.strftime('%b %Y')} – {end_d.strftime('%b %Y')}",
            "peak_cases": peak_cases,
            "peak_deaths": peak_deaths,
            "variant": v_info[0],
            "cfr": cfr,
        })

    return waves

def compute_trends_analysis(db: Session, location: str = "India") -> Dict[str, Any]:
    """
    Computes smoothed rolling averages, velocity, reproduction rate, and epidemic wave phases.
    Uses date-ordered observations from actual database records.
    """
    query = (
        db.query(
            CovidRecord.date,
            CovidRecord.new_cases,
            CovidRecord.new_cases_smoothed,
            CovidRecord.new_deaths
        )
        .filter(CovidRecord.location.ilike(location))
        .order_by(CovidRecord.date)
        .all()
    )

    if not query:
        # Fallback to World
        query = (
            db.query(
                CovidRecord.date,
                CovidRecord.new_cases,
                CovidRecord.new_cases_smoothed,
                CovidRecord.new_deaths
            )
            .filter(CovidRecord.iso_code == "OWID_WRL")
            .order_by(CovidRecord.date)
            .all()
        )

    if not query:
        empty_res = {"rolling_series": [], "waves": [], "current_velocity": None, "effective_r": None}
        return {**empty_res, "trends": empty_res}

    df = pd.DataFrame([{
        "date": r.date,
        "new_cases": float(r.new_cases or 0),
        "new_deaths": float(r.new_deaths or 0),
    } for r in query])

    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date").reset_index(drop=True)

    # Calculate 7-day and 14-day rolling averages
    df["ma_7"] = df["new_cases"].rolling(window=7, min_periods=1).mean()
    df["ma_14"] = df["new_cases"].rolling(window=14, min_periods=1).mean()
    df["smoothed_cases"] = df["ma_7"]

    # 1. Epidemic Waves derived via peak detection
    waves = detect_epidemic_waves(df)

    # 2. 7-Day Smoothing Velocity: rate of change of 7-day MA over date-ordered observations
    if len(df) >= 8:
        last_ma = float(df["ma_7"].iloc[-1])
        prev_ma = float(df["ma_7"].iloc[-8])
        delta_ma = last_ma - prev_ma
        if prev_ma > 0:
            weekly_growth_pct = round((delta_ma / prev_ma) * 100, 1)
            sign = "+" if weekly_growth_pct >= 0 else ""
            velocity_str = f"{sign}{weekly_growth_pct}% / week"
        else:
            daily_roc = round(delta_ma / 7.0, 1)
            sign = "+" if daily_roc >= 0 else ""
            velocity_str = f"{sign}{daily_roc} cases/day"
    else:
        velocity_str = None

    # 3. Estimated Effective R (Rt): EpiEstim renewal equation with serial interval Gamma(5.0, 3.0)
    latest_rt = estimate_effective_rt(df)

    # 4. Downsample points for chart transmission (~180 evenly spaced points across multi-year timeline)
    step = max(1, len(df) // 180)
    rolling_series = []
    for i in range(0, len(df), step):
        row = df.iloc[i]
        rolling_series.append({
            "date": row["date"].strftime("%Y-%m-%d"),
            "raw_cases": int(round(row["new_cases"])),
            "ma_7": int(round(row["ma_7"])),
            "ma_14": int(round(row["ma_14"])),
            "new_deaths": int(round(row["new_deaths"])),
        })

    # Ensure the final chronological point is included in the chart series
    last_row = df.iloc[-1]
    last_date_str = last_row["date"].strftime("%Y-%m-%d")
    if not rolling_series or rolling_series[-1]["date"] != last_date_str:
        rolling_series.append({
            "date": last_date_str,
            "raw_cases": int(round(last_row["new_cases"])),
            "ma_7": int(round(last_row["ma_7"])),
            "ma_14": int(round(last_row["ma_14"])),
            "new_deaths": int(round(last_row["new_deaths"])),
        })

    result_payload = {
        "rolling_series": rolling_series,
        "waves": waves,
        "current_velocity": velocity_str,
        "effective_r": latest_rt,
    }

    return {
        **result_payload,
        "trends": result_payload,
    }

def compute_dataset_analytics(db: Session) -> Dict[str, Any]:
    """
    Computes statistical dispersion (mean, std, percentiles) and correlations.
    """
    records = (
        db.query(
            CovidRecord.total_cases,
            CovidRecord.new_cases,
            CovidRecord.total_deaths,
            CovidRecord.new_deaths,
            CovidRecord.total_vaccinations,
            CovidRecord.people_fully_vaccinated,
            CovidRecord.reproduction_rate,
        )
        .filter(~CovidRecord.iso_code.startswith("OWID_"))
        .limit(10000)
        .all()
    )

    if not records:
        return {
            "summary": {"feature_count": 0, "total_rows": 0, "completeness": 0.0, "avg_skewness": 0.0, "table_data": []},
            "correlations": [],
            "distribution_bins": [],
        }

    df = pd.DataFrame([{
        "total_cases": r.total_cases,
        "new_cases": r.new_cases,
        "total_deaths": r.total_deaths,
        "new_deaths": r.new_deaths,
        "total_vaccinations": r.total_vaccinations,
        "people_fully_vaccinated": r.people_fully_vaccinated,
        "reproduction_rate": r.reproduction_rate,
    } for r in records])

    # Descriptive table data
    table_data = []
    for col in df.columns:
        series = df[col].dropna()
        if len(series) > 0:
            count = int(series.count())
            mean_val = float(series.mean())
            std_val = float(series.std()) if len(series) > 1 else 0.0
            min_val = float(series.min())
            med_val = float(series.median())
            max_val = float(series.max())
            missing_pct = round((df[col].isna().sum() / len(df)) * 100, 1)
            table_data.append({
                "feature": col,
                "count": count,
                "mean": round(mean_val, 2),
                "std": round(std_val, 2),
                "min": round(min_val, 2),
                "median": round(med_val, 2),
                "max": round(max_val, 2),
                "missing_pct": missing_pct,
            })

    # Pearson Correlations with total_deaths
    correlations = []
    corr_matrix = df.corr()
    if "total_deaths" in corr_matrix:
        for feat, val in corr_matrix["total_deaths"].items():
            if feat != "total_deaths" and not np.isnan(val):
                correlations.append({"feature": feat, "coefficient": round(float(val), 3)})
    correlations.sort(key=lambda x: abs(x["coefficient"]), reverse=True)

    # Distribution Bins for new_cases
    cases_series = df["new_cases"].dropna()
    cases_positive = cases_series[cases_series > 0]
    distribution_bins = []
    if len(cases_positive) > 10:
        counts, bin_edges = np.histogram(np.log10(cases_positive), bins=6)
        for i in range(len(counts)):
            low = int(10 ** bin_edges[i])
            high = int(10 ** bin_edges[i + 1])
            distribution_bins.append({
                "bin_range": f"{low:,} – {high:,}",
                "frequency": int(counts[i]),
            })

    total_cells = df.shape[0] * df.shape[1]
    valid_cells = df.notna().sum().sum()
    completeness = round((valid_cells / total_cells * 100), 1) if total_cells > 0 else 0.0

    return {
        "summary": {
            "feature_count": df.shape[1],
            "total_rows": df.shape[0],
            "completeness": completeness,
            "avg_skewness": round(float(df.skew(numeric_only=True).mean()), 2),
            "table_data": table_data,
        },
        "correlations": correlations,
        "distribution_bins": distribution_bins,
    }

def get_excess_deaths_data() -> List[Dict[str, Any]]:
    """
    Parses weekly excess deaths records from the local all_weekly_excess_deaths.csv if available.
    """
    candidates = [
        settings.DATA_DIR / "all_weekly_excess_deaths.csv",
        BASE_DIR.parent / "data" / "all_weekly_excess_deaths.csv",
    ]
    data_file = None
    for p in candidates:
        if p.exists():
            data_file = p
            break

    if not data_file:
        return []

    try:
        df = pd.read_csv(data_file)
        df.columns = df.columns.str.strip()
        
        # Filter for World or aggregate records
        date_col = "end_date" if "end_date" in df.columns else "start_date"
        if date_col in df.columns and "total_deaths" in df.columns and "expected_deaths" in df.columns:
            df["date"] = pd.to_datetime(df[date_col], dayfirst=True, errors="coerce")
            df = df.dropna(subset=["date"]).sort_values("date")
            
            # Numeric conversion
            for col in ["total_deaths", "expected_deaths", "excess_deaths"]:
                if col in df.columns:
                    df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)
                else:
                    df[col] = 0.0

            # Aggregate by week
            weekly = df.groupby("date").agg({
                "total_deaths": "sum",
                "expected_deaths": "sum",
                "excess_deaths": "sum",
            }).reset_index()

            if weekly.empty:
                return []

            # Downsample to 60 points
            step = max(1, len(weekly) // 60)
            result = []
            for i in range(0, len(weekly), step):
                r = weekly.iloc[i]
                result.append({
                    "date": r["date"].strftime("%Y-%m-%d"),
                    "total_deaths": int(round(float(r["total_deaths"]))),
                    "expected_deaths": int(round(float(r["expected_deaths"]))),
                    "excess_deaths": int(round(float(r["excess_deaths"]))),
                })
            return result
    except Exception as e:
        logger.warning(f"Error reading excess deaths CSV: {e}")
    return []
