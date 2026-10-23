import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Globe2,
  MapPin,
  TrendingUp,
  Sparkles,
  Table2,
  BarChart3,
  Gauge,
  Info,
  ChevronLeft,
  ChevronRight,
  Activity,
  ShieldCheck,
  Server,
} from 'lucide-react';

const navigationItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Global Analytics', path: '/global', icon: Globe2 },
  { name: 'India Analytics', path: '/india', icon: MapPin },
  { name: 'Trends Analysis', path: '/trends', icon: TrendingUp },
  { name: 'COVID-19 Prediction', path: '/prediction', icon: Sparkles },
  { name: 'Data Explorer', path: '/explorer', icon: Table2 },
  { name: 'Data Analysis', path: '/analysis', icon: BarChart3 },
  { name: 'Model Performance', path: '/models', icon: Gauge },
  { name: 'About', path: '/about', icon: Info },
];

export const Sidebar = ({ isCollapsed, setIsCollapsed, mobileOpen, setMobileOpen, backendStatus }) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-800 bg-slate-950/95 backdrop-blur-xl transition-all duration-300 ease-in-out lg:static ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand / Logo Section */}
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 shadow-md shadow-cyan-500/20">
              <Activity className="h-5 w-5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="text-sm font-bold tracking-tight text-white">
                  COVID Analytics
                </span>
                <span className="text-[10px] font-medium text-cyan-400 tracking-wider uppercase">
                  & Prediction System
                </span>
              </div>
            )}
          </div>

          {/* Collapse Toggle for Desktop */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700/60 bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-300 shadow-sm border border-cyan-500/30'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`
                }
                title={isCollapsed ? item.name : undefined}
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    />
                    {!isCollapsed && (
                      <span className="truncate">{item.name}</span>
                    )}

                    {/* Active Indicator dot */}
                    {isActive && (
                      <span
                        className={`absolute rounded-full bg-cyan-400 shadow-sm shadow-cyan-400 ${
                          isCollapsed
                            ? 'right-2 top-2 h-1.5 w-1.5'
                            : 'right-3 h-1.5 w-1.5'
                        }`}
                      />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Backend & Academic Status Footer */}
        <div className="border-t border-slate-800/80 p-3 bg-slate-950/60">
          {!isCollapsed ? (
            <div className="space-y-2">
              {/* API Connection Indicator */}
              <div className="flex items-center justify-between rounded-lg bg-slate-900/80 border border-slate-800 px-2.5 py-1.5 text-[11px]">
                <div className="flex items-center gap-2 truncate">
                  <span
                    className={`h-2 w-2 rounded-full shrink-0 ${
                      backendStatus === 'connected'
                        ? 'bg-emerald-400 shadow-sm shadow-emerald-400'
                        : backendStatus === 'connecting'
                        ? 'bg-amber-400 animate-pulse'
                        : 'bg-rose-400'
                    }`}
                  />
                  <span className="text-slate-300 truncate">
                    {backendStatus === 'connected'
                      ? 'API Connected'
                      : backendStatus === 'connecting'
                      ? 'Connecting...'
                      : 'Backend Offline'}
                  </span>
                </div>
                <Server className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              </div>

              {/* Academic Label */}
              <div className="flex items-center gap-1.5 px-1 text-[10px] text-slate-400">
                <ShieldCheck className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                <span className="truncate">B.Tech AIML Capstone</span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center" title={`API: ${backendStatus}`}>
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  backendStatus === 'connected'
                    ? 'bg-emerald-400'
                    : backendStatus === 'connecting'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-rose-400'
                }`}
              />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
