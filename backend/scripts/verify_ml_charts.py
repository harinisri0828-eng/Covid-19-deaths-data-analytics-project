import httpx
import json

client = httpx.Client(base_url='http://127.0.0.1:8001')

test_cases = [
    # 1. India - Random Forest - 14 Days - Baseline
    {'region': 'India', 'model_type': 'random_forest', 'horizon_days': 14, 'scenario': 'baseline'},
    # 2. India - Linear Regression - 7 Days - High Surge
    {'region': 'India', 'model_type': 'linear_regression', 'horizon_days': 7, 'scenario': 'high_surge'},
    # 3. India - Ridge - 30 Days - Suppression
    {'region': 'India', 'model_type': 'ridge', 'horizon_days': 30, 'scenario': 'suppression'},
    # 4. World - Random Forest - 14 Days - Baseline
    {'region': 'World', 'model_type': 'random_forest', 'horizon_days': 14, 'scenario': 'baseline'},
    # 5. United States - Random Forest - 21 Days - High Surge
    {'region': 'United States', 'model_type': 'random_forest', 'horizon_days': 21, 'scenario': 'high_surge'},
    # 6. Maharashtra (State) - Random Forest - 14 Days - Baseline
    {'region': 'Maharashtra', 'model_type': 'random_forest', 'horizon_days': 14, 'scenario': 'baseline'},
    # 7. Kerala (State) - Ridge - 14 Days - Baseline
    {'region': 'Kerala', 'model_type': 'ridge', 'horizon_days': 14, 'scenario': 'baseline'},
]

all_passed = True
for idx, tc in enumerate(test_cases, 1):
    resp = client.post('/api/prediction/forecast', json=tc)
    if resp.status_code != 200:
        print(f"Test {idx} FAILED [{resp.status_code}]: {resp.text[:100]}")
        all_passed = False
        continue
    data = resp.json()
    hist_cnt = len(data.get('historical', []))
    fore_cnt = len(data.get('forecast', []))
    feat_cnt = len(data.get('feature_importance', []))
    print(f"Test {idx} PASSED: {tc['region']} | {tc['model_type']} | {tc['horizon_days']}d | {tc['scenario']}")
    print(f"   -> Historical: {hist_cnt} pts, Forecast: {fore_cnt} pts, Features: {feat_cnt} items, Peak: {data.get('peak_predicted')}")
    
    assert hist_cnt > 0, "Historical series should not be empty"
    assert fore_cnt == tc['horizon_days'], f"Expected {tc['horizon_days']} forecast points"
    assert feat_cnt > 0, "Feature importance should not be empty"
    imps = [f['importance'] for f in data['feature_importance']]
    assert imps == sorted(imps, reverse=True), "Feature importance must be in descending order"

if all_passed:
    print("\nALL 7 PREDICTION COMBINATIONS PASSED VERIFICATION!")
