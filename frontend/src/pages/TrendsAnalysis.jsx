import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  Activity,
  Layers,
  FileSpreadsheet,
  Server,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
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

export const TrendsAnalysis = () => {
  const [trends, setTrends] = useState(null);
  const [waves, setWaves] = useState([]);
  const [excessDeaths, setExcessDeaths] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTrends = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [trendsRes, wavesRes, excessRes] = await Promise.all([
        api.getTrendsSummary(),
        api.getWavesAnalysis(),
        api.getExcessDeaths(),
      ]);
      const trendsData = trendsRes.data?.trends || trendsRes.data || null;
      setTrends(trendsData);
      setWaves(wavesRes.data?.waves || trendsData?.waves || []);
      setExcessDeaths(excessRes.data?.excess_deaths || []);
    } catch (err) {
      setError(err);
      setTrends(null);
      setWaves([]);
      setExcessDeaths([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  const waveColumns = [
    { header: 'Epidemic Phase / Wave', accessor: 'wave_name', sortable: true },
    { header: 'Timeframe', accessor: 'period', sortable: false },
    { header: 'Peak Daily Cases', accessor: 'peak_cases', sortable: true, align: 'right', render: (v) => v?.toLocaleString?.() ?? '—' },
    { header: 'Peak Daily Deaths', accessor: 'peak_deaths', sortable: true, align: 'right', render: (v) => v?.toLocaleString?.() ?? '—' },
    { header: 'Dominant Variant', accessor: 'variant', sortable: true },
    { header: 'Avg Case Fatality Rate', accessor: 'cfr', sortable: true, align: 'right', render: (v) => (v ? `${(v * 100).toFixed(2)}%` : '—') },
  ];

  return (
    <div className="space-y-6">
      {/* Backend Status Notice Banner if Offline */}
      {error && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-xs backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-500/20 p-2 text-amber-400 shrink-0">
              <Server className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-amber-300">
                Backend Connection Error
              </p>
              <p className="text-amber-200/70 mt-0.5">
                Could not retrieve trends analysis from FastAPI. Ensure the backend server is running on port 8001.
              </p>
            </div>
          </div>
          <button
            onClick={fetchTrends}
            className="shrink-0 rounded-lg bg-amber-500/20 px-3 py-1.5 font-medium text-amber-300 hover:bg-amber-500/30 transition-colors border border-amber-500/30"
          >
            Retry Query
          </button>
        </div>
      )}

      {/* Header Info Banner */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <TrendingUp className="h-5 w-5 text-cyan-400" />
          <div>
            <h2 className="text-sm font-semibold text-white">Pandemic Wave & Excess Mortality Dynamics</h2>
            <p className="text-xs text-slate-400">Analysis of rolling smoothing filters, wave severity, and excess mortality baselines</p>
          </div>
        </div>
        <button
          onClick={fetchTrends}
          className="rounded-lg bg-cyan-600/20 border border-cyan-500/30 px-3 py-1.5 text-xs font-medium text-cyan-300 hover:bg-cyan-600/30 transition-colors"
        >
          Recalculate Trends
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatisticCard
          title="Recorded Epidemic Waves"
          value={waves.length > 0 ? waves.length : (isLoading ? null : (error ? null : 0))}
          subtext="Distinct epidemiological peaks"
          icon={Layers}
          color="cyan"
          isLoading={isLoading}
          badgeText="Waves"
        />
        <StatisticCard
          title="7-Day Smoothing Velocity"
          value={trends?.current_velocity || (isLoading ? null : (error ? null : 'Unavailable'))}
          subtext="Rate of case change (dC/dt)"
          icon={TrendingUp}
          color={trends?.current_velocity?.startsWith?.('+') ? 'purple' : 'emerald'}
          isLoading={isLoading}
          badgeText="Derivatives"
        />
        <StatisticCard
          title="Estimated Effective R (Rt)"
          value={
            trends?.effective_r !== undefined && trends?.effective_r !== null
              ? trends.effective_r.toFixed(2)
              : (isLoading ? null : (error ? null : 'Unavailable'))
          }
          subtext={
            trends?.effective_r !== undefined && trends?.effective_r !== null
              ? "Reproduction number (Cori et al., τ=7d)"
              : "Insufficient incidence for stable Rt"
          }
          icon={Activity}
          color={trends?.effective_r > 1 ? 'rose' : 'emerald'}
          isLoading={isLoading}
          badgeText="Rt"
        />
        <StatisticCard
          title="Excess Deaths Records"
          value={excessDeaths.length > 0 ? excessDeaths.length.toLocaleString() : (isLoading ? null : (error ? null : 0))}
          subtext="Historical weekly mortality rows"
          icon={FileSpreadsheet}
          color="amber"
          isLoading={isLoading}
          badgeText="Mortality"
        />
      </div>

      {/* Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Rolling Moving Averages Smoothing"
          subtitle="Comparison of raw daily series vs 7-day and 14-day smoothed moving average"
          isLoading={isLoading}
          error={error}
          isEmpty={!trends?.rolling_series || trends.rolling_series.length === 0}
          onRefresh={fetchTrends}
          badge="MA Filters"
          description="Moving averages filter out weekend reporting delays and testing spikes to isolate the true trajectory."
        >
          {trends?.rolling_series && trends.rolling_series.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends.rolling_series} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis
                  stroke="#64748b"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(val) => {
                    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
                    if (val >= 1_000) return `${(val / 1_000).toFixed(0)}k`;
                    return val;
                  }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val, name) => [
                    typeof val === 'number' ? val.toLocaleString() : val,
                    name
                  ]}
                />
                <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }} />
                <Line type="monotone" dataKey="raw_cases" stroke="#64748b" strokeWidth={1} dot={false} name="Daily Raw Cases" />
                <Line type="monotone" dataKey="ma_7" stroke="#06b6d4" strokeWidth={2} dot={false} name="7-Day Moving Avg" />
                <Line type="monotone" dataKey="ma_14" stroke="#a855f7" strokeWidth={2} dot={false} name="14-Day Moving Avg" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Weekly Excess Deaths vs Expected Mortality"
          subtitle="Observed total mortality versus historical demographic expectation"
          isLoading={isLoading}
          error={error}
          isEmpty={excessDeaths.length === 0}
          onRefresh={fetchTrends}
          badge="Excess Deaths Dataset"
          description="Derived from all_weekly_excess_deaths.csv. Highlights true pandemic toll above statistical baseline."
        >
          {excessDeaths.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={excessDeaths}>
                <defs>
                  <linearGradient id="excessGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend />
                <Line type="monotone" dataKey="expected_deaths" stroke="#94a3b8" strokeDasharray="4 4" dot={false} name="Expected Baseline" />
                <Area type="monotone" dataKey="total_deaths" stroke="#f43f5e" fill="url(#excessGradient)" name="Actual Total Deaths" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Wave Comparison Table */}
      <DataTable
        title="Epidemic Wave Comparative Profiling"
        subtitle="Wave breakdown comparing peak caseloads, duration, and mortality severity"
        columns={waveColumns}
        data={waves}
        isLoading={isLoading}
        error={error}
        searchPlaceholder="Filter epidemic phase..."
      />
    </div>
  );
};

export default TrendsAnalysis;
