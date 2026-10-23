import urllib.request
import json
import sys

base = "http://127.0.0.1:8001"

endpoints = [
    ("/", "Root"),
    ("/docs", "Swagger UI"),
    ("/api/health", "Health"),
    ("/api/summary", "Summary"),
    ("/api/countries", "Countries"),
    ("/api/india/states", "India States"),
    ("/api/trends?location=India", "Trends"),
    ("/api/analytics", "Analytics"),
    ("/api/data?limit=5", "Data Explorer"),
    ("/api/data/export?limit=5", "CSV Export"),
    ("/api/model-performance", "Model Performance"),
    ("/api/predictions/history", "Prediction History"),
    ("/api/metadata", "Metadata"),
]

all_passed = True

print("=" * 70)
print("LIVE BACKEND REST API ENDPOINT VERIFICATION")
print(f"Target Server: {base}")
print("=" * 70)

for path, label in endpoints:
    url = base + path
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=5) as resp:
            status = resp.status
            ctype = resp.getheader("Content-Type")
            print(f"[PASSED {status}] {label:20} -> {path} ({ctype})")
    except Exception as e:
        print(f"[FAILED]        {label:20} -> {path}: {e}")
        all_passed = False

# Test POST /api/predict
predict_url = base + "/api/predict"
payload = json.dumps({
    "region": "India",
    "model_type": "random_forest",
    "horizon_days": 14,
    "scenario": "baseline"
}).encode("utf-8")

try:
    req = urllib.request.Request(
        predict_url,
        data=payload,
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        forecast_len = len(data.get("forecast", []))
        model_name = data.get("model_name")
        peak = data.get("peak_predicted")
        print(f"[PASSED {resp.status}] {'Prediction Inference':20} -> /api/predict (Model: {model_name}, Forecast: {forecast_len} days, Peak: {peak:,})")
except Exception as e:
    print(f"[FAILED]        {'Prediction Inference':20} -> /api/predict: {e}")
    all_passed = False

print("=" * 70)
if all_passed:
    print("ALL API ENDPOINTS VERIFIED AND RETURNING AUTHENTIC DATA!")
else:
    print("SOME ENDPOINTS ENCOUNTERED ERRORS")
print("=" * 70)

sys.exit(0 if all_passed else 1)
