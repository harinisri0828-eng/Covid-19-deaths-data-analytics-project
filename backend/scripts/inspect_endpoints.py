import urllib.request
import json

base = "http://127.0.0.1:8001"

endpoints = [
    ("/api/countries", lambda d: f"{d['total_count']} countries; top: {d['countries'][0]['location']} with {d['countries'][0]['total_cases']:,} cases"),
    ("/api/india/states", lambda d: f"{len(d['states'])} states; total confirmed: {d['overview']['total_confirmed']:,}, active: {d['overview']['active_cases']:,}"),
    ("/api/trends?location=India", lambda d: f"{len(d['rolling_series'])} rolling series points, current velocity: {d['current_velocity']}, Rt: {d['effective_r']}"),
    ("/api/analytics", lambda d: f"{d['summary']['feature_count']} features analyzed, completeness: {d['summary']['completeness']}%, {len(d['correlations'])} correlations"),
    ("/api/data?limit=3", lambda d: f"{d['total_count']} total records in database, returning {len(d['records'])} rows"),
    ("/api/model-performance", lambda d: f"Best model: {d['summary']['best_model_name']}, R2: {d['summary']['best_r2']}, {len(d['models'])} algorithms evaluated"),
    ("/api/predictions/history", lambda d: f"{len(d['history'])} historical prediction runs persisted in database"),
]

for p, fn in endpoints:
    resp = urllib.request.urlopen(base + p)
    data = json.loads(resp.read().decode("utf-8"))
    print(f"{p:26} -> {fn(data)}")
