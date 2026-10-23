import React from 'react';
import { RefreshCw, Download, Info } from 'lucide-react';
import LoadingIndicator from './LoadingIndicator';
import ErrorMessage from './ErrorMessage';
import EmptyState from './EmptyState';

export const ChartCard = ({
  title,
  subtitle,
  description,
  children,
  isLoading = false,
  error = null,
  isEmpty = false,
  emptyTitle,
  emptyDescription,
  onRefresh,
  onExport,
  actions,
  badge,
  height = 'h-80',
}) => {
  return (
    <div className="relative flex flex-col rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md shadow-xl transition-all duration-200">
      {/* Card Header */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white tracking-wide">{title}</h3>
            {badge && (
              <span className="rounded-md bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-400 border border-cyan-500/20">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {actions}
          {onExport && (
            <button
              onClick={onExport}
              title="Export visualization data"
              className="rounded-lg border border-slate-700/60 bg-slate-800/50 p-1.5 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <Download className="h-4 w-4" />
            </button>
          )}
          {onRefresh && (
            <button
              onClick={onRefresh}
              title="Refresh dataset"
              className="rounded-lg border border-slate-700/60 bg-slate-800/50 p-1.5 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className={`relative w-full ${height} flex items-center justify-center`}>
        {isLoading ? (
          <LoadingIndicator message="Fetching historical time series..." />
        ) : error ? (
          <div className="w-full max-w-md">
            <ErrorMessage
              title="Unable to load chart metrics"
              message={error.message || 'The backend service endpoint is currently offline.'}
              onRetry={onRefresh}
              isNetworkError={error.isAxiosError}
            />
          </div>
        ) : isEmpty ? (
          <div className="w-full">
            <EmptyState
              type="backend-pending"
              title={emptyTitle || 'No Chart Data'}
              description={
                emptyDescription ||
                'Chart requires live data from the FastAPI ETL pipeline. Start backend server to populate.'
              }
              actionText={onRefresh ? 'Retry Query' : undefined}
              onAction={onRefresh}
            />
          </div>
        ) : (
          <div className="w-full h-full">{children}</div>
        )}
      </div>

      {/* Optional Card Footer Description */}
      {description && (
        <div className="mt-3 flex items-start gap-1.5 border-t border-slate-800/60 pt-2 text-[11px] text-slate-400">
          <Info className="h-3.5 w-3.5 shrink-0 text-slate-400 mt-0.5" />
          <span>{description}</span>
        </div>
      )}
    </div>
  );
};

export default ChartCard;
