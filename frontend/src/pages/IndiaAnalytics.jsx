import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  Activity,
  ShieldCheck,
  ShieldAlert,
  Percent,
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

export const IndiaAnalytics = () => {
  const [states, setStates] = useState([]);
  const [selectedState, setSelectedState] = useState('All States');
  const [overview, setOverview] = useState(null);
  const [stateBreakdown, setStateBreakdown] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchIndiaData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [overviewRes, statesRes] = await Promise.all([
        api.getIndiaOverview(),
        api.getIndiaStates(),
      ]);
      setOverview(overviewRes.data?.overview || null);
      setStateBreakdown(statesRes.data?.states || []);
      setStates(statesRes.data?.states?.map((s) => s.state_name) || []);
      setTimeline(overviewRes.data?.timeline || []);
    } catch (err) {
      setError(err);
      setOverview(null);
      setStateBreakdown([]);
      setStates([]);
      setTimeline([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIndiaData();
  }, [fetchIndiaData]);

  const stateColumns = [
    { header: 'State / Union Territory', accessor: 'state_name', sortable: true },
    { header: 'Confirmed Cases', accessor: 'confirmed', sortable: true, align: 'right', render: (v) => v?.toLocaleString?.() ?? '—' },
    { header: 'Active Cases', accessor: 'active', sortable: true, align: 'right', render: (v) => v?.toLocaleString?.() ?? '—' },
    { header: 'Recovered', accessor: 'recovered', sortable: true, align: 'right', render: (v) => v?.toLocaleString?.() ?? '—' },
    { header: 'Deaths', accessor: 'deaths', sortable: true, align: 'right', render: (v) => v?.toLocaleString?.() ?? '—' },
    {
      header: 'Recovery Rate',
      accessor: 'recovery_rate',
      sortable: true,
      align: 'right',
      render: (v, row) => {
        if (v !== undefined) return `${v.toFixed(2)}%`;
        if (row.confirmed && row.recovered) {
          return `${((row.recovered / row.confirmed) * 100).toFixed(2)}%`;
        }
        return '—';
      },
    },
    {
      header: 'Mortality Rate',
      accessor: 'mortality_rate',
      sortable: true,
      align: 'right',
      render: (v, row) => {
        if (v !== undefined) return `${v.toFixed(2)}%`;
        if (row.confirmed && row.deaths) {
          return `${((row.deaths / row.confirmed) * 100).toFixed(2)}%`;
        }
        return '—';
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* State Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-amber-400" />
          <h2 className="text-sm font-semibold text-white">India State & Territorial Monitor</h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Filter Region:</span>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="All States">All States & Union Territories</option>
              {states.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchIndiaData}
            className="rounded-lg bg-amber-500/20 border border-amber-500/30 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-500/30 transition-colors"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* India National KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatisticCard
          title="National Confirmed"
          value={overview?.total_confirmed ? overview.total_confirmed.toLocaleString() : null}
          subtext="Cumulative positive cases"
          icon={MapPin}
          color="amber"
          isLoading={isLoading}
          badgeText="India Total"
        />
        <StatisticCard
          title="Active Caseload"
          value={overview?.active_cases ? overview.active_cases.toLocaleString() : null}
          subtext="Currently receiving care"
          icon={Activity}
          color="cyan"
          isLoading={isLoading}
          badgeText="Active"
        />
        <StatisticCard
          title="Cured / Discharged"
          value={overview?.total_recovered ? overview.total_recovered.toLocaleString() : null}
          subtext="Successfully recovered"
          icon={ShieldCheck}
          color="emerald"
          isLoading={isLoading}
          badgeText="Recovered"
        />
        <StatisticCard
          title="Deceased"
          value={overview?.total_deaths ? overview.total_deaths.toLocaleString() : null}
          subtext="Total COVID casualties"
          icon={ShieldAlert}
          color="rose"
          isLoading={isLoading}
          badgeText="Mortality"
        />
        <StatisticCard
          title="Recovery Percentage"
          value={
            overview?.recovery_rate
              ? `${overview.recovery_rate.toFixed(2)}%`
              : overview?.total_confirmed && overview?.total_recovered
              ? `${((overview.total_recovered / overview.total_confirmed) * 100).toFixed(2)}%`
              : null
          }
          subtext="National recovery ratio"
          icon={Percent}
          color="purple"
          isLoading={isLoading}
          badgeText="Ratio"
        />
      </div>

      {/* India Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="State-wise Active & Confirmed Caseload"
          subtitle="Top affected States and Union Territories"
          isLoading={isLoading}
          error={error}
          isEmpty={stateBreakdown.length === 0}
          onRefresh={fetchIndiaData}
          badge="State Distribution"
          description="Direct MoHFW and historical state health department aggregated statistics."
        >
          {stateBreakdown.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stateBreakdown.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="state_name" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend />
                <Bar dataKey="confirmed" fill="#f59e0b" name="Confirmed Cases" radius={[4, 4, 0, 0]} />
                <Bar dataKey="active" fill="#06b6d4" name="Active Cases" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="National Epidemiological Curve"
          subtitle="Timeline of daily cases across major epidemic phases in India"
          isLoading={isLoading}
          error={error}
          isEmpty={timeline.length === 0}
          onRefresh={fetchIndiaData}
          badge="Wave Timeline"
          description="Tracks the original wave (2020), Delta surge (Spring 2021), and Omicron wave (Jan 2022)."
        >
          {timeline.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend />
                <Line type="monotone" dataKey="daily_confirmed" stroke="#f59e0b" dot={false} strokeWidth={2} name="Daily Confirmed" />
                <Line type="monotone" dataKey="daily_recovered" stroke="#10b981" dot={false} strokeWidth={2} name="Daily Recovered" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* State-Level Detailed Table */}
      <DataTable
        title="Indian State & Union Territory Breakdown"
        subtitle="Complete epidemiological matrix including confirmed, active, recovered, and fatality rates"
        columns={stateColumns}
        data={stateBreakdown}
        isLoading={isLoading}
        error={error}
        searchPlaceholder="Filter state name (e.g., Maharashtra, Kerala)..."
      />
    </div>
  );
};

export default IndiaAnalytics;
