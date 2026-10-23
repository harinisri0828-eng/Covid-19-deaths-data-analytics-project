import React from 'react';
import { Database, Filter, Server, ArrowRight } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = Database,
  title = 'No Data Available',
  description = 'Data has not been ingested or the query returned 0 records.',
  actionText,
  onAction,
  type = 'default', // 'default', 'backend-pending', 'filtered'
}) => {
  const isPendingBackend = type === 'backend-pending';

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-8 text-center backdrop-blur-sm">
      <div className="rounded-2xl bg-slate-800/80 p-4 text-slate-400 shadow-inner">
        {isPendingBackend ? (
          <Server className="h-8 w-8 text-amber-400 animate-pulse" />
        ) : type === 'filtered' ? (
          <Filter className="h-8 w-8 text-cyan-400" />
        ) : (
          <Icon className="h-8 w-8 text-slate-400" />
        )}
      </div>

      <h3 className="mt-4 text-base font-semibold text-slate-200">{title}</h3>
      <p className="mt-1 text-xs text-slate-400 max-w-md leading-relaxed">
        {description}
      </p>

      {isPendingBackend && (
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400 border border-amber-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
          Awaiting FastAPI Backend Connection
        </div>
      )}

      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-cyan-600/20 px-3.5 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-600/30 transition-colors border border-cyan-500/30 shadow-sm"
        >
          {actionText}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};

export default EmptyState;
