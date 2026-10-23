import React from 'react';
import { AlertCircle, RefreshCw, ServerOff } from 'lucide-react';

export const ErrorMessage = ({
  title = 'Failed to load data',
  message,
  onRetry,
  isNetworkError = false,
}) => {
  return (
    <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-5 backdrop-blur-md">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-rose-500/20 p-2 text-rose-400">
          {isNetworkError ? (
            <ServerOff className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
        </div>
        <div className="flex-1 space-y-1">
          <h4 className="text-sm font-semibold text-rose-200">{title}</h4>
          <p className="text-xs text-rose-300/80 leading-relaxed">
            {message || 'Unable to connect to the backend API service. Please verify that the FastAPI backend server is running and reachable.'}
          </p>
          {isNetworkError && (
            <div className="mt-2 text-[11px] text-slate-400 font-mono bg-slate-900/60 p-2 rounded border border-slate-800">
              Expected API: {import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001'}
            </div>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-rose-500/20 px-3 py-1.5 text-xs font-medium text-rose-200 hover:bg-rose-500/30 transition-colors border border-rose-500/30"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry Connection
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;
