import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Sparkles,
  Cpu,
  Calendar,
  TrendingUp,
  CheckCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  BarChart,
  Bar,
  LabelList,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { api } from '../api/client';
import StatisticCard from '../components/StatisticCard';
import ChartCard from '../components/ChartCard';
import DataTable from '../components/DataTable';

const defaultModelOptions = [
  { id: 'random_forest', name: 'Random Forest Regressor (Ensemble)' },
  { id: 'linear_regression', name: 'Linear Regression (Ordinary Least Squares)' },
  { id: 'ridge', name: 'Ridge Regression (L2 Regularized)' },
];

export const CovidPrediction = () => {
  const [selectedRegion, setSelectedRegion] = useState('India');
  const [selectedModel, setSelectedModel] = useState('random_forest');
  const [forecastDays, setForecastDays] = useState(14);
  const [scenario, setScenario] = useState('baseline');

  const [modelOptions, setModelOptions] = useState(defaultModelOptions);
  const [predictionResult, setPredictionResult] = useState(null);
  const [featureImportance, setFeatureImportance] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Centralized execution handler supporting parameter overrides
  const runPrediction = useCallback(async (overrides = {}) => {
    const region = overrides.region ?? selectedRegion;
    const model = overrides.model ?? selectedModel;
    const horizon = overrides.horizon ?? forecastDays;
    const scen = overrides.scenario ?? scenario;

    setIsLoading(true);
    setError(null);
    try {
      const payload = {
        region,
        model_type: model,
        horizon_days: Number(horizon),
        scenario: scen,
      };
      const res = await api.predictCases(payload);
      setPredictionResult(res.data);
      setFeatureImportance(res.data?.feature_importance || []);
    } catch (err) {
      setError(err);
      setPredictionResult(null);
      setFeatureImportance([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedRegion, selectedModel, forecastDays, scenario]);

  // Initial load: fetch available models and execute default baseline prediction
  useEffect(() => {
    let isMounted = true;
    const initialize = async () => {
      try {
        const res = await api.getPredictionModels();
        if (isMounted && res.data?.models && res.data.models.length > 0) {
          setModelOptions(res.data.models);
        }
      } catch {
        // Fall back to default model options if backend models call fails
      }
      if (isMounted) {
        runPrediction({
          region: selectedRegion,
          model: selectedModel,
          horizon: forecastDays,
          scenario: scenario,
        });
      }
    };
    initialize();
    return () => {
      isMounted = false;
    };
  }, []);

  // Reactive change handlers for each parameter
  const handleRegionChange = (newRegion) => {
    setSelectedRegion(newRegion);
    runPrediction({ region: newRegion });
  };

  const handleModelChange = (newModel) => {
    setSelectedModel(newModel);
    runPrediction({ model: newModel });
  };

  const handleHorizonChange = (newHorizon) => {
    const horizonVal = Number(newHorizon);
    setForecastDays(horizonVal);
    runPrediction({ horizon: horizonVal });
  };

  const handleScenarioChange = (newScenario) => {
    setScenario(newScenario);
    runPrediction({ scenario: newScenario });
  };

  // Combine historical baseline observations and forecasted trajectory into continuous chronological series
  const trajectoryData = useMemo(() => {
    if (!predictionResult) return [];
    const historical = predictionResult.historical || [];
    const forecast = predictionResult.forecast || [];
    if (historical.length === 0 && forecast.length === 0) return [];

    const combined = [];

    // Historical observed data points
    historical.forEach((item, index) => {
      const isLastHistorical = index === historical.length - 1;
      combined.push({
        date: item.date,
        historical_cases: item.actual_cases,
        // Seamless bridge at transition date so the forecast curve connects to observed line
        predicted_cases: isLastHistorical && forecast.length > 0 ? item.actual_cases : null,
        lower_bound: isLastHistorical && forecast.length > 0 ? item.actual_cases : null,
        upper_bound: isLastHistorical && forecast.length > 0 ? item.actual_cases : null,
        isForecast: false,
      });
    });

    // Forecast projection points
    forecast.forEach((item) => {
      combined.push({
        date: item.date,
        historical_cases: null,
        predicted_cases: item.predicted_cases,
        lower_bound: item.lower_bound,
        upper_bound: item.upper_bound,
        confidence: item.confidence,
        isForecast: true,
      });
    });

    return combined;
  }, [predictionResult]);

  const forecastColumns = [
    { header: 'Forecast Date', accessor: 'date', sortable: true },
    {
      header: 'Predicted Cases',
      accessor: 'predicted_cases',
      sortable: true,
      align: 'right',
      render: (v) => v?.toLocaleString?.() ?? '—',
    },
    {
      header: 'Lower 95% Bound',
      accessor: 'lower_bound',
      sortable: true,
      align: 'right',
      render: (v) => v?.toLocaleString?.() ?? '—',
    },
    {
      header: 'Upper 95% Bound',
      accessor: 'upper_bound',
      sortable: true,
      align: 'right',
      render: (v) => v?.toLocaleString?.() ?? '—',
    },
    {
      header: 'Confidence Score',
      accessor: 'confidence',
      sortable: true,
      align: 'right',
      render: (v) => (v ? `${(v * 100).toFixed(0)}%` : '—'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Forecasting Control Panel */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
          <Sparkles className="h-5 w-5 text-cyan-400" />
          <h2 className="text-sm font-semibold text-white">Machine Learning Forecasting Interface</h2>
          <span className="rounded-md bg-purple-500/10 px-2 py-0.5 text-[10px] font-semibold text-purple-300 border border-purple-500/20">
            Scikit-Learn Regression Pipeline
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Region */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Region / Target Entity
            </label>
            <select
              value={selectedRegion}
              onChange={(e) => handleRegionChange(e.target.value)}
              disabled={isLoading}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 disabled:opacity-50"
            >
              <optgroup label="Countries & Aggregates">
                <option value="India">India (National)</option>
                <option value="World">World (Aggregate)</option>
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Germany">Germany</option>
                <option value="France">France</option>
                <option value="Brazil">Brazil</option>
              </optgroup>
              <optgroup label="Indian States">
                <option value="Maharashtra">Maharashtra (State)</option>
                <option value="Kerala">Kerala (State)</option>
                <option value="Karnataka">Karnataka (State)</option>
                <option value="Tamil Nadu">Tamil Nadu (State)</option>
                <option value="Delhi">Delhi (NCT)</option>
              </optgroup>
            </select>
          </div>

          {/* Model Type */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              ML Model Architecture
            </label>
            <select
              value={selectedModel}
              onChange={(e) => handleModelChange(e.target.value)}
              disabled={isLoading}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 disabled:opacity-50"
            >
              {modelOptions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Forecast Horizon */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Forecast Horizon (Days)
            </label>
            <select
              value={forecastDays}
              onChange={(e) => handleHorizonChange(e.target.value)}
              disabled={isLoading}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 disabled:opacity-50"
            >
              <option value={7}>7 Days (Short-term)</option>
              <option value={14}>14 Days (Standard window)</option>
              <option value={21}>21 Days (3 Weeks)</option>
              <option value={30}>30 Days (Extended outlook)</option>
            </select>
          </div>

          {/* Scenario Simulation */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Policy & Transmission Scenario
            </label>
            <select
              value={scenario}
              onChange={(e) => handleScenarioChange(e.target.value)}
              disabled={isLoading}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 disabled:opacity-50"
            >
              <option value="baseline">Baseline (Current Trajectory)</option>
              <option value="high_surge">Accelerated Surge (+20% Virulence)</option>
              <option value="suppression">Intervention / Suppression (-20% Contact)</option>
            </select>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => runPrediction()}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:from-cyan-500 hover:to-blue-500 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Cpu className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Computing ML Forecast...' : 'Execute ML Model Prediction'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatisticCard
          title="Forecast Horizon"
          value={`${forecastDays} Days`}
          subtext={`Target Region: ${predictionResult?.region || selectedRegion}`}
          icon={Calendar}
          color="cyan"
          isLoading={isLoading}
          badgeText="Horizon"
        />
        <StatisticCard
          title="Predicted Period Peak"
          value={predictionResult?.peak_predicted ? predictionResult.peak_predicted.toLocaleString() : null}
          subtext="Highest forecasted daily count"
          icon={TrendingUp}
          color="rose"
          isLoading={isLoading}
          badgeText="Peak"
        />
        <StatisticCard
          title="Model Architecture"
          value={predictionResult?.model_name || selectedModel.replace('_', ' ').toUpperCase()}
          subtext="Scikit-Learn Joblib pipeline"
          icon={Cpu}
          color="purple"
          isLoading={isLoading}
          badgeText="Algorithm"
        />
        <StatisticCard
          title="Model Metric"
          value={
            predictionResult?.r2_score != null
              ? `R²: ${predictionResult.r2_score.toFixed(3)}`
              : predictionResult?.confidence != null
              ? `${(predictionResult.confidence * 100).toFixed(0)}%`
              : null
          }
          subtext={predictionResult?.rmse ? `RMSE: ${Math.round(predictionResult.rmse).toLocaleString()}` : "Variance Explained"}
          icon={CheckCircle}
          color="emerald"
          isLoading={isLoading}
          badgeText="Performance"
        />
      </div>

      {/* Forecasting Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: Historical Baseline & ML Forecast Trajectory */}
        <ChartCard
          title="Historical Baseline & ML Forecast Trajectory"
          subtitle={`Observed historical records and ${forecastDays}-day forecast for ${predictionResult?.region || selectedRegion}`}
          isLoading={isLoading}
          error={error}
          isEmpty={trajectoryData.length === 0}
          onRefresh={() => runPrediction()}
          badge="Observed + Forecast"
          description="Displays genuine historical baseline records from the epidemiological database transitioning into Scikit-learn recursive multi-step forecasting with 95% confidence intervals."
        >
          {trajectoryData.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trajectoryData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <defs>
                  <linearGradient id="predGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(val) => {
                    if (!val) return '';
                    const parts = val.split('-');
                    return parts.length === 3 ? `${parts[1]}/${parts[2]}` : val;
                  }}
                  minTickGap={25}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(val) => {
                    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
                    if (val >= 1_000) return `${(val / 1_000).toFixed(0)}k`;
                    return val;
                  }}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    const dataPoint = payload[0]?.payload;
                    return (
                      <div className="rounded-lg border border-slate-700 bg-slate-900/95 p-3 text-xs shadow-xl backdrop-blur-md">
                        <div className="font-semibold text-white mb-1.5 flex items-center justify-between gap-4 border-b border-slate-800 pb-1">
                          <span>{label}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              dataPoint?.isForecast
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            }`}
                          >
                            {dataPoint?.isForecast ? 'Forecast Projection' : 'Observed Historical'}
                          </span>
                        </div>
                        {dataPoint?.historical_cases != null && (
                          <div className="flex items-center justify-between gap-4 py-0.5 text-cyan-300">
                            <span>Observed Cases:</span>
                            <span className="font-medium font-mono">
                              {dataPoint.historical_cases.toLocaleString()}
                            </span>
                          </div>
                        )}
                        {dataPoint?.predicted_cases != null && dataPoint.isForecast && (
                          <div className="flex items-center justify-between gap-4 py-0.5 text-purple-300">
                            <span>Predicted Cases:</span>
                            <span className="font-medium font-mono">
                              {dataPoint.predicted_cases.toLocaleString()}
                            </span>
                          </div>
                        )}
                        {dataPoint?.upper_bound != null && dataPoint.isForecast && (
                          <div className="flex items-center justify-between gap-4 py-0.5 text-slate-400">
                            <span>Upper 95% Bound:</span>
                            <span className="font-mono">{dataPoint.upper_bound.toLocaleString()}</span>
                          </div>
                        )}
                        {dataPoint?.lower_bound != null && dataPoint.isForecast && (
                          <div className="flex items-center justify-between gap-4 py-0.5 text-slate-400">
                            <span>Lower 95% Bound:</span>
                            <span className="font-mono">{dataPoint.lower_bound.toLocaleString()}</span>
                          </div>
                        )}
                        {dataPoint?.confidence != null && dataPoint.isForecast && (
                          <div className="flex items-center justify-between gap-4 py-0.5 text-emerald-400 border-t border-slate-800 mt-1 pt-1">
                            <span>Model Confidence:</span>
                            <span>{(dataPoint.confidence * 100).toFixed(0)}%</span>
                          </div>
                        )}
                      </div>
                    );
                  }}
                />
                <Legend
                  verticalAlign="top"
                  wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
                />
                <Line
                  type="monotone"
                  dataKey="upper_bound"
                  stroke="#64748b"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                  dot={false}
                  name="Upper 95% Confidence Bound"
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="lower_bound"
                  stroke="#64748b"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                  dot={false}
                  name="Lower 95% Confidence Bound"
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="historical_cases"
                  stroke="#38bdf8"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4 }}
                  name="Historical Observed Cases (Line)"
                  connectNulls={false}
                />
                <Area
                  type="monotone"
                  dataKey="predicted_cases"
                  stroke="#c084fc"
                  strokeWidth={2.5}
                  fill="url(#predGradient)"
                  name="ML Forecast Trajectory"
                  connectNulls={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Panel 2: Feature Importance Weights */}
        <ChartCard
          title="Feature Importance Weights"
          subtitle={`Top predictive indicators from ${predictionResult?.model_name || 'Scikit-learn regressor'}`}
          isLoading={isLoading}
          error={error}
          isEmpty={featureImportance.length === 0}
          onRefresh={() => runPrediction()}
          badge="Explainable AI"
          description="Feature weights quantify which epidemiological lags and temporal cyclic patterns contributed most heavily to the regression prediction."
        >
          {featureImportance.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={featureImportance}
                layout="vertical"
                margin={{ top: 10, right: 45, left: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="#64748b"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
                  domain={[0, 'auto']}
                />
                <YAxis
                  dataKey="feature_label"
                  type="category"
                  stroke="#94a3b8"
                  tick={{ fontSize: 10 }}
                  width={155}
                  interval={0}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const item = payload[0]?.payload;
                    return (
                      <div className="rounded-lg border border-slate-700 bg-slate-900/95 p-2.5 text-xs shadow-xl backdrop-blur-md">
                        <div className="font-semibold text-white mb-1">
                          {item?.feature_label || item?.feature}
                        </div>
                        <div className="text-purple-300 font-mono">
                          Importance Weight: {((item?.importance || 0) * 100).toFixed(2)}%
                        </div>
                        <div className="text-slate-500 text-[10px] mt-0.5 font-mono">
                          Internal Feature: {item?.feature}
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="importance"
                  fill="#8b5cf6"
                  radius={[0, 4, 4, 0]}
                  name="Relative Importance Weight"
                >
                  <LabelList
                    dataKey="importance"
                    position="right"
                    formatter={(val) => (val ? `${(val * 100).toFixed(1)}%` : '')}
                    fill="#cbd5e1"
                    fontSize={10}
                    offset={6}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Day-by-Day Forecast Breakdown */}
      <DataTable
        title="Day-by-Day Forecasting Inference Table"
        subtitle="Granular predicted values, upper and lower confidence intervals"
        columns={forecastColumns}
        data={predictionResult?.forecast || []}
        isLoading={isLoading}
        error={error}
        searchPlaceholder="Filter dates..."
      />
    </div>
  );
};

export default CovidPrediction;
