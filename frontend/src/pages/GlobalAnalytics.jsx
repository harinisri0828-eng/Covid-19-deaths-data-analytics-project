import React, { useState, useEffect, useCallback } from 'react';
import {
  Globe2,
  ShieldAlert,
  Syringe,
  Percent,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
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
import DataTable from '../components/DataTable';

export const GlobalAnalytics = () => {
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('World');
  const [metric, setMetric] = useState('total_cases');
  const [countryStats, setCountryStats] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [topCountries, setTopCountries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCountries = useCallback(async () => {
    try {
      const res = await api.getGlobalCountries();
      if (res.data?.countries) {
        setCountries(res.data.countries);
      }
    } catch {
      // Backend not yet running
    }
  }, []);

  const fetchGlobalData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [summaryRes, timelineRes] = await Promise.all([
        api.getGlobalSummary(),
        api.getGlobalTimeline({ country: selectedCountry, metric }),
      ]);
      setCountryStats(summaryRes.data?.stats || null);
      setTopCountries(summaryRes.data?.top_countries || []);
      setTimeline(timelineRes.data?.timeline || []);
    } catch (err) {
      setError(err);
      setCountryStats(null);
      setTopCountries([]);
      setTimeline([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCountry, metric]);

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  useEffect(() => {
    fetchGlobalData();
  }, [fetchGlobalData]);

  const countryColumns = [
    { header: 'Country / Territory', accessor: 'location', sortable: true },
    { header: 'Total Cases', accessor: 'total_cases', sortable: true, align: 'right', render: (v) => v?.toLocaleString?.() ?? '—' },
    { header: 'New Cases (7d)', accessor: 'new_cases_smoothed', sortable: true, align: 'right', render: (v) => v?.toLocaleString?.() ?? '—' },
    { header: 'Total Deaths', accessor: 'total_deaths', sortable: true, align: 'right', render: (v) => v?.toLocaleString?.() ?? '—' },
    { header: 'Cases / Million', accessor: 'total_cases_per_million', sortable: true, align: 'right', render: (v) => v?.toFixed?.(1) ?? '—' },
    { header: 'Deaths / Million', accessor: 'total_deaths_per_million', sortable: true, align: 'right', render: (v) => v?.toFixed?.(1) ?? '—' },
    { header: 'Vaccinated People', accessor: 'people_fully_vaccinated', sortable: true, align: 'right', render: (v) => v?.toLocaleString?.() ?? '—' },
  ];

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Globe2 className="h-5 w-5 text-cyan-400" />
          <h2 className="text-sm font-semibold text-white">Global Filter Controls</h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Country Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Country:</span>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="World">World (Aggregate)</option>
              {countries.map((c) => (
                <option key={c.iso_code || c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Metric Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Metric:</span>
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="total_cases">Total Cumulative Cases</option>
              <option value="new_cases">Daily New Cases</option>
              <option value="total_deaths">Total Deaths</option>
              <option value="new_deaths">Daily Deaths</option>
              <option value="total_vaccinations">Total Vaccinations</option>
            </select>
          </div>

          <button
            onClick={fetchGlobalData}
            className="rounded-lg bg-cyan-600/20 border border-cyan-500/30 px-3 py-1.5 text-xs font-medium text-cyan-300 hover:bg-cyan-600/30 transition-colors"
          >
            Update Analysis
          </button>
        </div>
      </div>

      {/* Country Specific KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatisticCard
          title={`${selectedCountry} Total Cases`}
          value={countryStats?.total_cases ? countryStats.total_cases.toLocaleString() : null}
          subtext="Cumulative confirmed records"
          icon={Globe2}
          color="cyan"
          isLoading={isLoading}
          badgeText={selectedCountry}
        />
        <StatisticCard
          title={`${selectedCountry} Deaths`}
          value={countryStats?.total_deaths ? countryStats.total_deaths.toLocaleString() : null}
          subtext="Total COVID-attributed deaths"
          icon={ShieldAlert}
          color="rose"
          isLoading={isLoading}
          badgeText="Mortality"
        />
        <StatisticCard
          title="Case Fatality Rate"
          value={
            countryStats?.cfr
              ? `${(countryStats.cfr * 100).toFixed(2)}%`
              : countryStats?.total_cases && countryStats?.total_deaths
              ? `${((countryStats.total_deaths / countryStats.total_cases) * 100).toFixed(2)}%`
              : null
          }
          subtext="Deaths per confirmed case"
          icon={Percent}
          color="amber"
          isLoading={isLoading}
          badgeText="CFR"
        />
        <StatisticCard
          title="Vaccination Coverage"
          value={
            countryStats?.vaccination_pct
              ? `${countryStats.vaccination_pct.toFixed(1)}%`
              : countryStats?.people_fully_vaccinated
              ? countryStats.people_fully_vaccinated.toLocaleString()
              : null
          }
          subtext="Population coverage"
          icon={Syringe}
          color="emerald"
          isLoading={isLoading}
          badgeText="Doses"
        />
      </div>

      {/* Global Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title={`${selectedCountry} — Historical Trajectory`}
          subtitle={`Timeline of ${metric.replace('_', ' ')} based on OWID repository`}
          isLoading={isLoading}
          error={error}
          isEmpty={timeline.length === 0}
          onRefresh={fetchGlobalData}
          badge="Time Series"
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
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={false}
                  name={metric.replace('_', ' ').toUpperCase()}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Top 10 Most Impacted Nations"
          subtitle="Comparative total confirmed cases by country"
          isLoading={isLoading}
          error={error}
          isEmpty={topCountries.length === 0}
          onRefresh={fetchGlobalData}
          badge="Cross-Country"
        >
          {topCountries.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCountries} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis dataKey="location" type="category" stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="total_cases" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Total Cases" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Detailed Global Tabular Data */}
      <DataTable
        title="Country-Level Epidemiological Breakdown"
        subtitle="Sortable metrics across nations from Our World In Data"
        columns={countryColumns}
        data={topCountries}
        isLoading={isLoading}
        error={error}
        searchPlaceholder="Filter country name..."
      />
    </div>
  );
};

export default GlobalAnalytics;
