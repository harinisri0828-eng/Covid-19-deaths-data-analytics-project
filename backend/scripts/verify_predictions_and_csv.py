import urllib.request
import urllib.error
import json

base = "http://127.0.0.1:8001"

print("=" * 70)
print("PREDICTION & CSV EXPORT DEEP VERIFICATION")
print("=" * 70)

# 1. Submit Valid Prediction
predict_url = base + "/api/predict"
payload = json.dumps({
    "region": "India",
    "model_type": "random_forest",
    "horizon_days": 21,
    "scenario": "high_surge"
}).encode("utf-8")

req = urllib.request.Request(predict_url, data=payload, headers={"Content-Type": "application/json"})
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode("utf-8"))
    print("[TEST 1: Valid Prediction]")
    print(f"  HTTP Status:       {resp.status}")
    print(f"  Model Employed:    {data.get('model_name')}")
    print(f"  Horizon:           {data.get('horizon_days')} days")
    print(f"  Scenario:          {data.get('scenario')}")
    print(f"  Forecast Length:   {len(data.get('forecast', []))} days")
    print(f"  Period Peak:       {data.get('peak_predicted'):,} cases")
    print(f"  Feature Weights:   {len(data.get('feature_importance', []))} features extracted")
    day1 = data["forecast"][0]
    print(f"  Day 1 Sample:      {day1['date']} -> {day1['predicted_cases']:,} (95% CI: [{day1['lower_bound']:,}, {day1['upper_bound']:,}])")

# Verify History Count incremented
hist_req = urllib.request.Request(base + "/api/predictions/history")
with urllib.request.urlopen(hist_req) as resp:
    hist_data = json.loads(resp.read().decode("utf-8"))
    print(f"  Total History Rows: {len(hist_data.get('history', []))}")
    latest = hist_data["history"][0]
    print(f"  Latest Persisted:  ID={latest['id']}, Region={latest['region']}, Horizon={latest['horizon_days']}, Model={latest['model_name']}")

# 2. Test Invalid Prediction Inputs
print("\n[TEST 2: Input Validation Rejections]")
invalid_payloads = [
    ("horizon_days = 0 (below min 1)", {"region": "India", "model_type": "random_forest", "horizon_days": 0, "scenario": "baseline"}),
    ("horizon_days = 120 (above max 60)", {"region": "India", "model_type": "random_forest", "horizon_days": 120, "scenario": "baseline"}),
]

for label, invalid_body in invalid_payloads:
    try:
        inv_req = urllib.request.Request(predict_url, data=json.dumps(invalid_body).encode("utf-8"), headers={"Content-Type": "application/json"})
        urllib.request.urlopen(inv_req)
        print(f"  [FAIL] Expected 422 rejection for {label}, but request succeeded!")
    except urllib.error.HTTPError as e:
        print(f"  [PASSED 422] Properly rejected invalid input: {label} -> HTTP {e.code}")

# 3. Verify CSV Export
print("\n[TEST 3: CSV Export Contents]")
csv_url = base + "/api/data/export?limit=5"
csv_req = urllib.request.Request(csv_url)
with urllib.request.urlopen(csv_req) as resp:
    content = resp.read().decode("utf-8")
    lines = content.strip().split("\r\n")
    if len(lines) <= 1:
        lines = content.strip().split("\n")
    print(f"  HTTP Status:       {resp.status}")
    print(f"  Content-Type:      {resp.getheader('Content-Type')}")
    print(f"  Content-Disposition:{resp.getheader('Content-Disposition')}")
    print(f"  Header Row:        {lines[0]}")
    print(f"  Sample Row 1:      {lines[1]}")
    print(f"  Sample Row 2:      {lines[2]}")
    print(f"  Total Lines:       {len(lines)}")
    assert "iso_code,location,date" in lines[0]
    assert len(lines) == 6  # 1 header + 5 data rows
    print("  CSV format matches specification!")

print("=" * 70)
