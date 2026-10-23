import React, { useState, useEffect, useCallback } from 'react';
import {
  Gauge,
  Award,
  Zap,
  Target,
  Clock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
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

export const ModelPerformance = () => {
  const [metrics, setMetrics] = useState(null);
  const [modelComparisons, setModelComparisons] = useState([]);
  const [testSplitCurve, setTestSplitCurve] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMetrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getModelMetrics();
      setMetrics(res.data?.summary || null);
      setModelComparisons(res.data?.models || []);
      setTestSplitCurve(res.data?.test_fit_curve || []);
    } catch (err) {
      setError(err);
      setMetrics(null);
      setModelComparisons([]);
      setTestSplitCurve([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const performanceColumns = [
    { header: 'Model Architecture', accessor: 'name', sortable: true },
    { header: 'R² Score', accessor: 'r2', sortable: true, align: 'right', render: (v) => (v !== undefined ? v.toFixed(4) : '—') },
    { header: 'RMSE', accessor: 'rmse', sortable: true, align: 'right', render: (v) => v?.toLocaleString?.(undefined, { maximumFractionDigits: 1 }) ?? '—' },
    { header: 'MAE', accessor: 'mae', sortable: true, align: 'right', render: (v) => v?.toLocaleString?.(undefined, { maximumFractionDigits: 1 }) ?? '—' },
    { header: 'MAPE (%)', accessor: 'mape', sortable: true, align: 'right', render: (v) => (v !== undefined ? `${(v * 100).toFixed(2)}%` : '—') },
    { header: 'Inference (ms)', accessor: 'latency_ms', sortable: true, align: 'right', render: (v) => (v !== undefined ? `${v} ms` : '—') },
    {
      header: 'Benchmark Rank',
      accessor: 'is_best',
      sortable: true,
      render: (v) =>
        v ? (
          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-500/30">
            Top Performer
          </span>
        ) : (
          <span className="text-slate-500 text-[11px]">Benchmark</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Gauge className="h-5 w-5 text-emerald-400" />
          <div>
            <h2 className="text-sm font-semibold text-white">Machine Learning Model Validation & Evaluation</h2>
            <p className="text-xs text-slate-400">Scikit-Learn cross-validation metrics, error distributions, and benchmark rankings</p>
          </div>
        </div>
        <button
          onClick={fetchMetrics}
          className="rounded-lg bg-emerald-600/20 border border-emerald-500/30 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-600/30 transition-colors"
        >
          Re-evaluate Models
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatisticCard
          title="Optimal Model"
          value={metrics?.best_model_name || (error ? null : null)}
          subtext="Highest R² on holdout test set"
          icon={Award}
          color="emerald"
          isLoading={isLoading}
          badgeText="Champion"
        />
        <StatisticCard
          title="Best R² Score"
          value={metrics?.best_r2 ? metrics.best_r2.toFixed(4) : null}
          subtext="Coefficient of determination"
          icon={Target}
          color="cyan"
          isLoading={isLoading}
          badgeText="Accuracy"
        />
        <StatisticCard
          title="Lowest RMSE"
          value={metrics?.lowest_rmse ? metrics.lowest_rmse.toLocaleString() : null}
          subtext="Root mean squared error"
          icon={Zap}
          color="purple"
          isLoading={isLoading}
          badgeText="Loss"
        />
        <StatisticCard
          title="Mean Inference Latency"
          value={metrics?.avg_latency ? `${metrics.avg_latency} ms` : null}
          subtext="Joblib pipeline throughput"
          icon={Clock}
          color="amber"
          isLoading={isLoading}
          badgeText="Latency"
        />
      </div>

      {/* Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Algorithm Comparison (R² Score & RMSE)"
          subtitle="Cross-model benchmark on unseen validation split"
          isLoading={isLoading}
          error={error}
          isEmpty={modelComparisons.length === 0}
          onRefresh={fetchMetrics}
          badge="Benchmarks"
          description="R² measures variance explanation (closer to 1.0 is superior). Evaluated against Naive Lagged Persistence baseline."
        >
          {modelComparisons.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={modelComparisons}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend />
                <Bar dataKey="r2" fill="#10b981" name="R² Score" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Test Split: Ground Truth vs Predicted Curve"
          subtitle="Model predictions plotted directly against actual historical test observations"
          isLoading={isLoading}
          error={error}
          isEmpty={testSplitCurve.length === 0}
          onRefresh={fetchMetrics}
          badge="Holdout Test"
          description="Evaluates generalization capability and prevents overfitting across dramatic wave inflection points."
        >
          {testSplitCurve.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={testSplitCurve}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend />
                <Line type="monotone" dataKey="actual" stroke="#06b6d4" strokeWidth={2} dot={false} name="Actual Observed Cases" />
                <Line type="monotone" dataKey="predicted" stroke="#f43f5e" strokeWidth={2} strokeDasharray="3 3" dot={false} name="Model Predicted" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Model Benchmark Comparison Table */}
      <DataTable
        title="Comprehensive Machine Learning Benchmark Matrix"
        subtitle="Detailed regression loss metrics across Scikit-learn algorithms"
        columns={performanceColumns}
        data={modelComparisons}
        isLoading={isLoading}
        error={error}
        searchPlaceholder="Filter model name..."
      />
    </div>
  );
};

export default ModelPerformance;
