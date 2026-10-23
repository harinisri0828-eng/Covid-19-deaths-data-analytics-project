import React from 'react';
import {
  ShieldCheck,
  Cpu,
  Database,
  Code2,
  ExternalLink,
  BookOpen,
  Server,
} from 'lucide-react';

export const About = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Hero Header Banner */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-cyan-950/30 p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
            <ShieldCheck className="h-4 w-4" />
            B.Tech Artificial Intelligence & Machine Learning Capstone
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            COVID-19 Analytics and Prediction System
          </h1>
          <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
            An end-to-end Data Engineering, Exploratory Analytics, and Machine Learning platform built to ingest, clean, store, visualize, and forecast historical epidemiological trends using authentic real-world datasets.
          </p>
        </div>
      </div>

      {/* Tech Stack Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Frontend */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
          <div className="flex items-center gap-2 text-cyan-400 mb-3">
            <Code2 className="h-5 w-5" />
            <h3 className="font-semibold text-white text-sm">Frontend Tier</h3>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-300">
            <li>• <strong className="text-white">React 19 & Vite:</strong> Ultra-fast modern SPA</li>
            <li>• <strong className="text-white">Tailwind CSS v4:</strong> Dark theme dashboard</li>
            <li>• <strong className="text-white">React Router v7:</strong> Multi-page navigation</li>
            <li>• <strong className="text-white">Recharts:</strong> Interactive SVG graphs</li>
            <li>• <strong className="text-white">Lucide React:</strong> Premium iconography</li>
            <li>• <strong className="text-white">Axios:</strong> Centralized API client</li>
          </ul>
        </div>

        {/* Backend */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
          <div className="flex items-center gap-2 text-purple-400 mb-3">
            <Server className="h-5 w-5" />
            <h3 className="font-semibold text-white text-sm">Backend Engine</h3>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-300">
            <li>• <strong className="text-white">Python 3.14 & FastAPI:</strong> Async REST APIs</li>
            <li>• <strong className="text-white">Uvicorn:</strong> ASGI production server</li>
            <li>• <strong className="text-white">Pandas & NumPy:</strong> Vectorized ETL pipeline</li>
            <li>• <strong className="text-white">Scikit-learn:</strong> Predictive regressors</li>
            <li>• <strong className="text-white">Joblib:</strong> Model serialization</li>
            <li>• <strong className="text-white">Pydantic v2:</strong> Request/response schemas</li>
          </ul>
        </div>

        {/* Database */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
          <div className="flex items-center gap-2 text-emerald-400 mb-3">
            <Database className="h-5 w-5" />
            <h3 className="font-semibold text-white text-sm">Database & Storage</h3>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-300">
            <li>• <strong className="text-white">PostgreSQL:</strong> Production relational DB</li>
            <li>• <strong className="text-white">SQLAlchemy 2.0:</strong> ORM models</li>
            <li>• <strong className="text-white">Psycopg 3:</strong> High-performance driver</li>
            <li>• <strong className="text-white">SQLite Fallback:</strong> Zero-friction dev</li>
            <li>• <strong className="text-white">Indexed Queries:</strong> Date & ISO code indices</li>
            <li>• <strong className="text-white">CSV Data Lake:</strong> Raw & processed archives</li>
          </ul>
        </div>

        {/* DevOps & QA */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
          <div className="flex items-center gap-2 text-amber-400 mb-3">
            <Cpu className="h-5 w-5" />
            <h3 className="font-semibold text-white text-sm">DevOps & Testing</h3>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-300">
            <li>• <strong className="text-white">Pytest & HTTPX:</strong> API integration tests</li>
            <li>• <strong className="text-white">Render Backend:</strong> Web service hosting</li>
            <li>• <strong className="text-white">Render / Vercel:</strong> Static frontend build</li>
            <li>• <strong className="text-white">Environment Config:</strong> .env separation</li>
            <li>• <strong className="text-white">Zero Fake Data:</strong> Authentic sourcing</li>
            <li>• <strong className="text-white">Clean Error Handling:</strong> Offline resiliency</li>
          </ul>
        </div>
      </div>

      {/* Verified Data Sources Section */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md space-y-4">
        <div className="flex items-center gap-2 text-white font-semibold text-sm">
          <BookOpen className="h-5 w-5 text-cyan-400" />
          <h2>Authentic Historical Data Sources</h2>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          In strict compliance with academic standards, this system never fabricates or generates synthetic COVID-19 statistics. All metrics reflect actual recorded historical observations:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <a
            href="https://covid.ourworldindata.org/data/owid-covid-data.csv"
            target="_blank"
            rel="noopener noreferrer"
            className="group block rounded-lg border border-slate-800 bg-slate-950 p-4 hover:border-cyan-500/40 transition-colors"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-cyan-400 mb-1">
              <span>Our World in Data (OWID)</span>
              <ExternalLink className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <p className="text-[11px] text-slate-400">
              Global COVID-19 repository containing confirmed cases, deaths, hospitalizations, testing, and vaccination rates across 200+ countries.
            </p>
          </a>

          <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
            <div className="text-xs font-semibold text-amber-400 mb-1">
              India MoHFW & Covid19India Archive
            </div>
            <p className="text-[11px] text-slate-400">
              State-level granularity covering confirmed, active, recovered, and deceased cases across 36 Indian States and Union Territories.
            </p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
            <div className="text-xs font-semibold text-rose-400 mb-1">
              All Weekly Excess Deaths
            </div>
            <p className="text-[11px] text-slate-400">
              Demographic mortality baseline datasets measuring excess weekly deaths above expected statistical baselines.
            </p>
          </div>
        </div>
      </div>

      {/* Academic Methodology Details */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md space-y-3">
        <h3 className="text-sm font-semibold text-white">Machine Learning & ETL Methodology</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300 leading-relaxed">
          <div>
            <h4 className="font-semibold text-cyan-300 mb-1">1. ETL & Feature Engineering</h4>
            <p className="text-slate-400">
              Raw records are cleaned, null-imputed, and transformed with rolling windows (7-day, 14-day), lagged case counts ($t-1, t-7, t-14$), day-of-week one-hot encodings, and transmission velocity derivatives.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-purple-300 mb-1">2. Forecasting & Evaluation</h4>
            <p className="text-slate-400">
              Multiple Scikit-learn regressors (Random Forest, Gradient Boosting, Ridge, Polynomial) are trained on temporal train-test splits and benchmarked against $R^2$, RMSE, MAE, and MAPE metrics to ensure robust out-of-sample generalization.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
