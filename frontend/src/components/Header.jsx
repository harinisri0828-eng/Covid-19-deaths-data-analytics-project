import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, RefreshCw, AlertCircle, CheckCircle2, Shield } from 'lucide-react';

const routeTitles = {
  '/': { title: 'COVID-19 Executive Dashboard', subtitle: 'Global & National real-time epidemiological overview' },
  '/global': { title: 'Global Analytics & Geospatial Metrics', subtitle: 'Comparative country trends, transmission rates & cumulative cases' },
  '/india': { title: 'India National & State-Level Analytics', subtitle: 'State-wise active cases, recovery ratio, testing & vaccination progress' },
  '/trends': { title: 'Epidemiological Trends & Wave Dynamics', subtitle: 'Moving averages, reproduction rates, wave transitions & excess mortality' },
  '/prediction': { title: 'COVID-19 Predictive Intelligence', subtitle: 'Machine learning forecasting models, feature weights & scenario projection' },
  '/explorer': { title: 'Interactive Historical Data Explorer', subtitle: 'Filterable, searchable tabular COVID-19 dataset with instant CSV export' },
  '/analysis': { title: 'Exploratory Data Analysis & Statistics', subtitle: 'Variance analysis, correlation matrices, distribution profiles & outliers' },
  '/models': { title: 'ML Model Performance & Evaluation', subtitle: 'Regression benchmarks, MAE, RMSE, R² scores, residual distributions' },
  '/about': { title: 'System Architecture & Documentation', subtitle: 'B.Tech AI & ML academic project scope, ETL methodology & data sources' },
};

export const Header = ({ onMenuClick, backendStatus, onCheckHealth, isCheckingHealth }) => {
  const location = useLocation();
  const currentInfo = routeTitles[location.pathname] || {
    title: 'COVID-19 Analytics System',
    subtitle: 'Data Analytics and Engineering Platform',
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 sm:px-6 backdrop-blur-xl">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-300 hover:bg-slate-800 hover:text-white lg:hidden transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
            {currentInfo.title}
          </h1>
          <p className="hidden sm:block text-[11px] text-slate-400">
            {currentInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Status Pill & Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Academic Project Badge */}
        <div className="hidden md:flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-3 py-1 text-[11px] text-cyan-300 font-medium">
          <Shield className="h-3.5 w-3.5 text-cyan-400" />
          <span>B.Tech AI & ML</span>
        </div>

        {/* Backend API Connection Status Button */}
        <button
          onClick={onCheckHealth}
          disabled={isCheckingHealth}
          className={`group flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
            backendStatus === 'connected'
              ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300 hover:bg-emerald-950/40'
              : backendStatus === 'connecting'
              ? 'border-amber-500/30 bg-amber-950/20 text-amber-300 hover:bg-amber-950/40'
              : 'border-rose-500/30 bg-rose-950/20 text-rose-300 hover:bg-rose-950/40'
          }`}
          title="Click to check API status"
        >
          {backendStatus === 'connected' ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          ) : backendStatus === 'connecting' ? (
            <RefreshCw className="h-3.5 w-3.5 text-amber-400 animate-spin" />
          ) : (
            <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
          )}

          <span className="hidden sm:inline">
            {backendStatus === 'connected'
              ? 'Backend API Live'
              : backendStatus === 'connecting'
              ? 'Checking API...'
              : 'API Awaiting Connection'}
          </span>

          <RefreshCw
            className={`h-3 w-3 text-slate-400 opacity-60 group-hover:opacity-100 ${
              isCheckingHealth ? 'animate-spin' : ''
            }`}
          />
        </button>
      </div>
    </header>
  );
};

export default Header;
