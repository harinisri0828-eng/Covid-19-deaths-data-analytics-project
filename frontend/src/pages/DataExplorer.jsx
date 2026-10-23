import React, { useState, useEffect, useCallback } from 'react';
import {
  Download,
  Search,
  Database,
} from 'lucide-react';
import { api } from '../api/client';
import DataTable from '../components/DataTable';

export const DataExplorer = () => {
  const [source, setSource] = useState('owid_global');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        source,
        location: location || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        limit: 100,
      };
      const res = await api.queryData(params);
      setRecords(res.data?.records || []);
    } catch (err) {
      setError(err);
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  }, [source, location, startDate, endDate]);

  useEffect(() => {
    fetchRecords();
  }, [source, fetchRecords]);

  // Dynamic table columns based on source
  const columns =
    source === 'india_states'
      ? [
          { header: 'State Name', accessor: 'state_name', sortable: true },
          { header: 'Date', accessor: 'date', sortable: true },
          { header: 'Confirmed', accessor: 'confirmed', sortable: true, align: 'right', render: (v) => v?.toLocaleString?.() ?? '—' },
          { header: 'Active', accessor: 'active', sortable: true, align: 'right', render: (v) => v?.toLocaleString?.() ?? '—' },
          { header: 'Recovered', accessor: 'recovered', sortable: true, align: 'right', render: (v) => v?.toLocaleString?.() ?? '—' },
          { header: 'Deaths', accessor: 'deaths', sortable: true, align: 'right', render: (v) => v?.toLocaleString?.() ?? '—' },
        ]
      : source === 'excess_deaths'
      ? [
          { header: 'Location / Country', accessor: 'location', sortable: true },
          { header: 'Start Date', accessor: 'start_date', sortable: true },
          { header: 'End Date', accessor: 'end_date', sortable: true },
          { header: 'Expected Deaths', accessor: 'expected_deaths', sortable: true, align: 'right', render: (v) => v?.toLocaleString?.() ?? '—' },
          { header: 'Actual Deaths', accessor: 'total_deaths', sortable: true, align: 'right', render: (v) => v?.toLocaleString?.() ?? '—' },
          { header: 'Excess Deaths', accessor: 'excess_deaths', sortable: true, align: 'right', render: (v) => v?.toLocaleString?.() ?? '—' },
          { header: 'Excess Deaths / 100k', accessor: 'excess_deaths_per_100k', sortable: true, align: 'right', render: (v) => v?.toFixed?.(2) ?? '—' },
        ]
      : [
          { header: 'Country / Location', accessor: 'location', sortable: true },
          { header: 'ISO Code', accessor: 'iso_code', sortable: true },
          { header: 'Date', accessor: 'date', sortable: true },
          { header: 'Total Cases', accessor: 'total_cases', sortable: true, align: 'right', render: (v) => v?.toLocaleString?.() ?? '—' },
          { header: 'New Cases', accessor: 'new_cases', sortable: true, align: 'right', render: (v) => v?.toLocaleString?.() ?? '—' },
          { header: 'Total Deaths', accessor: 'total_deaths', sortable: true, align: 'right', render: (v) => v?.toLocaleString?.() ?? '—' },
          { header: 'Total Vaccinations', accessor: 'total_vaccinations', sortable: true, align: 'right', render: (v) => v?.toLocaleString?.() ?? '—' },
          { header: 'Cases / Million', accessor: 'total_cases_per_million', sortable: true, align: 'right', render: (v) => v?.toFixed?.(1) ?? '—' },
        ];

  const handleExportCsv = () => {
    const exportUrl = api.exportCsvUrl({
      source,
      location: location || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    });
    window.open(exportUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Search and Filtering Toolbar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md shadow-xl">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">PostgreSQL Data Lake Explorer</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {records.length > 0 ? `${records.length} records queried` : 'Awaiting Query'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Dataset Source */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Select Dataset Source
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="owid_global">OWID Global COVID-19 Dataset</option>
              <option value="india_states">India State-Level Historical Dataset</option>
              <option value="excess_deaths">All Weekly Excess Deaths Dataset</option>
            </select>
          </div>

          {/* Location / Country Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Location Filter
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., India, Brazil, Kerala..."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Buttons Row */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 pt-3">
          <p className="text-xs text-slate-400">
            Queries backend SQL database with indexed date and location columns.
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Direct CSV API Download
            </button>
            <button
              onClick={fetchRecords}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors shadow-sm disabled:opacity-50"
            >
              <Search className="h-3.5 w-3.5" />
              {isLoading ? 'Querying...' : 'Filter Records'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Tabular Dataset */}
      <DataTable
        title={`Query Results: ${source.replace('_', ' ').toUpperCase()}`}
        subtitle="Search, sort, paginate, and explore raw rows loaded from PostgreSQL"
        columns={columns}
        data={records}
        isLoading={isLoading}
        error={error}
        searchPlaceholder="Quick filter matching entries..."
      />
    </div>
  );
};

export default DataExplorer;
