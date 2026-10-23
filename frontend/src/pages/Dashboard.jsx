import React, { useState, useEffect, useCallback } from 'react';
import {
  Globe2,
  MapPin,
  Activity,
  ShieldAlert,
  Syringe,
  Cpu,
  Database,
  ArrowRight,
  Server,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { api } from '../api/client';
import StatisticCard from '../components/StatisticCard';
import ChartCard from '../components/ChartCard';
import { Link } from 'react-router-dom';

export const Dashboard = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.getDashboardSummary();
      setData(response.data);
    } catch (err) {
      setError(err);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
                Backend Connection Pending
              </p>
              <p className="text-amber-200/70 mt-0.5">
                The frontend is running in live-ready mode. Start the FastAPI backend server on{' '}
                <code className="rounded bg-slate-900 px-1 py-0.5 font-mono text-cyan-300">
                  {import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001'}
                </code>{' '}
                to load historical data from Our World In Data & Indian health databases.
              </p>
            </div>
          </div>
          <button
            onClick={fetchData}
            className="shrink-0 rounded-lg bg-amber-500/20 px-3 py-1.5 font-medium text-amber-300 hover:bg-amber-500/30 transition-colors border border-amber-500/30"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Primary KPI Statistic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatisticCard
          title="Global Confirmed"
          value={data?.global_total_cases ? data.global_total_cases.toLocaleString() : null}
          subtext="Cumulative confirmed cases"
          icon={Globe2}
          color="cyan"
          isLoading={isLoading}
          badgeText="OWID"
        />
        <StatisticCard
          title="Global Deaths"
          value={data?.global_total_deaths ? data.global_total_deaths.toLocaleString() : null}
          subtext="Cumulative attributed deaths"
          icon={ShieldAlert}
          color="rose"
          isLoading={isLoading}
          badgeText="OWID"
        />
        <StatisticCard
          title="Vaccines Given"
          value={data?.global_vaccinations ? data.global_vaccinations.toLocaleString() : null}
          subtext="Total doses administered"
          icon={Syringe}
          color="emerald"
          isLoading={isLoading}
          badgeText="Global"
        />
        <StatisticCard
          title="India Confirmed"
          value={data?.india_total_cases ? data.india_total_cases.toLocaleString() : null}
          subtext="National cumulative cases"
          icon={MapPin}
          color="amber"
          isLoading={isLoading}
          badgeText="India"
        />
        <StatisticCard
          title="India Recovered"
          value={data?.india_total_recovered ? data.india_total_recovered.toLocaleString() : null}
          subtext="National recovery count"
          icon={Activity}
          color="purple"
          isLoading={isLoading}
          badgeText="MoHFW"
        />
        <StatisticCard
          title="Active ML Model"
          value={data?.ml_active_model || (error ? 'Awaiting API' : null)}
          subtext="Forecasting engine status"
          icon={Cpu}
          color="blue"
          isLoading={isLoading}
          badgeText="AIML"
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Global Epidemiological Progression"
          subtitle="Cumulative confirmed cases & 7-day rolling transmission trajectory"
          isLoading={isLoading}
          error={error}
          isEmpty={!data?.global_timeline || data.global_timeline.length === 0}
          onRefresh={fetchData}
          badge="Global Time Series"
          description="Data sourced directly from Our World In Data repository. Rolling 7-day average smoothens weekly reporting anomalies."
        >
          {data?.global_timeline && data.global_timeline.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.global_timeline}>
                <defs>
                  <linearGradient id="colorCases" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend />
                <Area type="monotone" dataKey="total_cases" stroke="#06b6d4" fillOpacity={1} fill="url(#colorCases)" name="Total Cases" />
                <Line type="monotone" dataKey="new_cases_smoothed" stroke="#f59e0b" dot={false} strokeWidth={2} name="7-Day Avg New Cases" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="India Wave Dynamics & Daily Cases"
          subtitle="Wave comparison (Wave 1, Delta Wave 2, Omicron Wave 3)"
          isLoading={isLoading}
          error={error}
          isEmpty={!data?.india_timeline || data.india_timeline.length === 0}
          onRefresh={fetchData}
          badge="National Trends"
          description="Daily reported cases versus active caseload in India across all recorded epidemic phases."
        >
          {data?.india_timeline && data.india_timeline.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.india_timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend />
                <Bar dataKey="daily_cases" fill="#3b82f6" name="Daily Confirmed Cases" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="active_cases" stroke="#ec4899" strokeWidth={2} dot={false} name="Active Cases" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Secondary Row: Quick Nav Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-cyan-400">
              <Globe2 className="h-5 w-5" />
              <h3 className="font-semibold text-white text-sm">Global Country Explorer</h3>
            </div>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Compare 200+ countries, inspect vaccination ratios, transmission velocity, and mortality per million.
            </p>
          </div>
          <Link
            to="/global"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Explore Global Data <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-purple-400">
              <Cpu className="h-5 w-5" />
              <h3 className="font-semibold text-white text-sm">Predictive ML Intelligence</h3>
            </div>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Run time series forecasting with lag feature engineering and Scikit-learn regressors.
            </p>
          </div>
          <Link
            to="/prediction"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
          >
            Launch Predictor <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-400">
              <Database className="h-5 w-5" />
              <h3 className="font-semibold text-white text-sm">Raw Data Ingestion & Export</h3>
            </div>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Filter records across continents, date intervals, and download live query results to CSV.
            </p>
          </div>
          <Link
            to="/explorer"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Access Data Explorer <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
