import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  Percent,
  Sigma,
  Binary,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { api } from '../api/client';
import StatisticCard from '../components/StatisticCard';
import ChartCard from '../components/ChartCard';
import DataTable from '../components/DataTable';

export const DataAnalysis = () => {
  const [stats, setStats] = useState(null);
  const [correlations, setCorrelations] = useState([]);
  const [distributionBins, setDistributionBins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalysis = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [statsRes, corrRes] = await Promise.all([
        api.getAnalysisStats(),
        api.getCorrelationMatrix(),
      ]);
      setStats(statsRes.data?.summary || null);
      setDistributionBins(statsRes.data?.distribution_bins || []);
      setCorrelations(corrRes.data?.correlations || []);
    } catch (err) {
      setError(err);
      setStats(null);
      setDistributionBins([]);
      setCorrelations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  const statsColumns = [
    { header: 'Feature Column', accessor: 'feature', sortable: true },
    { header: 'Non-Null Count', accessor: 'count', sortable: true, align: 'right', render: (v) => v?.toLocaleString?.() ?? '—' },
    { header: 'Mean', accessor: 'mean', sortable: true, align: 'right', render: (v) => v?.toLocaleString?.(undefined, { maximumFractionDigits: 2 }) ?? '—' },
    { header: 'Std Dev (σ)', accessor: 'std', sortable: true, align: 'right', render: (v) => v?.toLocaleString?.(undefined, { maximumFractionDigits: 2 }) ?? '—' },
    { header: 'Min Value', accessor: 'min', sortable: true, align: 'right', render: (v) => v?.toLocaleString?.() ?? '—' },
    { header: 'Median (50%)', accessor: 'median', sortable: true, align: 'right', render: (v) => v?.toLocaleString?.() ?? '—' },
    { header: 'Max Value', accessor: 'max', sortable: true, align: 'right', render: (v) => v?.toLocaleString?.() ?? '—' },
    { header: 'Missing (%)', accessor: 'missing_pct', sortable: true, align: 'right', render: (v) => (v !== undefined ? `${v.toFixed(1)}%` : '—') },
  ];

  return (
    <div className="space-y-6">
      {/* Title Banner */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <BarChart3 className="h-5 w-5 text-indigo-400" />
          <div>
            <h2 className="text-sm font-semibold text-white">Exploratory Data Analysis (EDA) & Feature Distributions</h2>
            <p className="text-xs text-slate-400">Statistical dispersion, Pearson correlation coefficients, and feature covariance</p>
          </div>
        </div>
        <button
          onClick={fetchAnalysis}
          className="rounded-lg bg-indigo-600/20 border border-indigo-500/30 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-600/30 transition-colors"
        >
          Recompute Statistics
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatisticCard
          title="Analyzed Features"
          value={stats?.feature_count || (error ? null : null)}
          subtext="Numeric time series variables"
          icon={Binary}
          color="cyan"
          isLoading={isLoading}
          badgeText="Variables"
        />
        <StatisticCard
          title="Total Observations"
          value={stats?.total_rows ? stats.total_rows.toLocaleString() : null}
          subtext="Valid temporal records"
          icon={Layers}
          color="purple"
          isLoading={isLoading}
          badgeText="Rows"
        />
        <StatisticCard
          title="Average Skewness"
          value={stats?.avg_skewness ? stats.avg_skewness.toFixed(2) : null}
          subtext="Long-tail distribution metric"
          icon={Sigma}
          color="amber"
          isLoading={isLoading}
          badgeText="Skew"
        />
        <StatisticCard
          title="Data Completeness"
          value={stats?.completeness ? `${stats.completeness.toFixed(1)}%` : null}
          subtext="Post-cleaning valid data ratio"
          icon={Percent}
          color="emerald"
          isLoading={isLoading}
          badgeText="Quality"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Pearson Correlation with Case Mortality"
          subtitle="Pairwise linear correlation coefficients against total deaths"
          isLoading={isLoading}
          error={error}
          isEmpty={correlations.length === 0}
          onRefresh={fetchAnalysis}
          badge="Correlations"
          description="Values close to +1.0 indicate strong positive association; negative values indicate inverse mitigation."
        >
          {correlations.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={correlations} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" domain={[-1, 1]} stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis dataKey="feature" type="category" stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="coefficient" fill="#818cf8" radius={[0, 4, 4, 0]} name="Pearson r" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Frequency Distribution Bins"
          subtitle="Log-binned frequency density across confirmed cases"
          isLoading={isLoading}
          error={error}
          isEmpty={distributionBins.length === 0}
          onRefresh={fetchAnalysis}
          badge="Density"
          description="Visualizes power-law transmission characteristics and non-Gaussian variance across pandemic spikes."
        >
          {distributionBins.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributionBins}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="bin_range" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="frequency" fill="#38bdf8" radius={[4, 4, 0, 0]} name="Frequency Count" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Statistical Summary Table */}
      <DataTable
        title="Descriptive Statistics (Pandas describe)"
        subtitle="Parametric summary of mean, dispersion, quartiles, and missing values"
        columns={statsColumns}
        data={stats?.table_data || []}
        isLoading={isLoading}
        error={error}
        searchPlaceholder="Filter feature column..."
      />
    </div>
  );
};

export default DataAnalysis;
