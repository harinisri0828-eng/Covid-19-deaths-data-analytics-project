import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import EmptyState from './EmptyState';
import LoadingIndicator from './LoadingIndicator';

export const DataTable = ({
  columns = [],
  data = [],
  isLoading = false,
  error = null,
  onExportCsv,
  title = 'Data Records',
  subtitle,
  searchPlaceholder = 'Search records...',
  initialRowsPerPage = 10,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const query = searchTerm.toLowerCase();

    return data.filter((row) =>
      Object.values(row).some((val) =>
        String(val).toLowerCase().includes(query)
      )
    );
  }, [data, searchTerm]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const result =
        typeof aVal === 'number' && typeof bVal === 'number'
          ? aVal - bVal
          : String(aVal).localeCompare(String(bVal));

      return sortDirection === 'asc' ? result : -result;
    });
  }, [filteredData, sortKey, sortDirection]);

  // Pagination calculation
  const totalRows = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + rowsPerPage);

  const handleSort = (key) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortKey(null);
        setSortDirection('asc');
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const handleExportLocalCsv = () => {
    if (onExportCsv) {
      onExportCsv(sortedData);
      return;
    }

    if (!data.length) return;
    const headers = columns.map((c) => c.header).join(',');
    const rows = sortedData.map((row) =>
      columns.map((c) => `"${row[c.accessor] ?? ''}"`).join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${title.toLowerCase().replace(/\s+/g, '_')}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md shadow-xl overflow-hidden">
      {/* Table Top Toolbar */}
      <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white tracking-wide">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={searchPlaceholder}
              className="w-48 sm:w-64 rounded-lg bg-slate-950/70 border border-slate-700/80 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {/* Export Button */}
          <button
            onClick={handleExportLocalCsv}
            disabled={!data || data.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto min-h-[300px]">
        {isLoading ? (
          <LoadingIndicator message="Loading database records..." fullHeight />
        ) : error ? (
          <div className="p-8 text-center text-rose-400 text-sm">
            {error.message || 'Error loading table data'}
          </div>
        ) : data.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={FileSpreadsheet}
              title="No Records Ingested"
              description="Historical COVID-19 dataset has not been loaded from the backend PostgreSQL database."
              type="backend-pending"
            />
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-8">
            <EmptyState
              type="filtered"
              title="No Matching Records"
              description={`No rows matched your search term "${searchTerm}". Try adjusting your query.`}
              actionText="Clear Search"
              onAction={() => setSearchTerm('')}
            />
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400">
                {columns.map((col) => (
                  <th
                    key={col.accessor}
                    onClick={() => col.sortable !== false && handleSort(col.accessor)}
                    className={`py-3 px-4 font-semibold select-none ${
                      col.sortable !== false ? 'cursor-pointer hover:text-cyan-400 transition-colors' : ''
                    } ${col.align === 'right' ? 'text-right' : 'text-left'}`}
                  >
                    <div className={`inline-flex items-center gap-1 ${col.align === 'right' ? 'justify-end' : ''}`}>
                      <span>{col.header}</span>
                      {col.sortable !== false && (
                        <span className="text-slate-500">
                          {sortKey === col.accessor ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="h-3 w-3 text-cyan-400" />
                            ) : (
                              <ArrowDown className="h-3 w-3 text-cyan-400" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3 w-3 text-slate-600 opacity-60" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedData.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  className="hover:bg-slate-800/40 transition-colors group"
                >
                  {columns.map((col) => (
                    <td
                      key={col.accessor}
                      className={`py-2.5 px-4 text-slate-300 font-mono text-[11px] ${
                        col.align === 'right' ? 'text-right' : 'text-left'
                      }`}
                    >
                      {col.render ? col.render(row[col.accessor], row) : (row[col.accessor] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      {data.length > 0 && (
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>Show</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="rounded bg-slate-900 border border-slate-700 px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>
              entries (Showing {totalRows === 0 ? 0 : startIndex + 1} to{' '}
              {Math.min(startIndex + rowsPerPage, totalRows)} of {totalRows.toLocaleString()})
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded p-1 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 font-medium text-slate-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded p-1 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
