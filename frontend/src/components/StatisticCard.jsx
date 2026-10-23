import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export const StatisticCard = ({
  title,
  value,
  subtext,
  icon: Icon,
  trend,
  trendType = 'neutral', // 'positive', 'negative', 'neutral'
  color = 'cyan', // 'cyan', 'rose', 'emerald', 'amber', 'purple', 'blue'
  isLoading = false,
  badgeText,
}) => {
  const colorStyles = {
    cyan: {
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20 hover:border-cyan-500/40',
      text: 'text-cyan-400',
      glow: 'shadow-cyan-500/5',
      iconBg: 'bg-cyan-500/15 text-cyan-400',
    },
    rose: {
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20 hover:border-rose-500/40',
      text: 'text-rose-400',
      glow: 'shadow-rose-500/5',
      iconBg: 'bg-rose-500/15 text-rose-400',
    },
    emerald: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      text: 'text-emerald-400',
      glow: 'shadow-emerald-500/5',
      iconBg: 'bg-emerald-500/15 text-emerald-400',
    },
    amber: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20 hover:border-amber-500/40',
      text: 'text-amber-400',
      glow: 'shadow-amber-500/5',
      iconBg: 'bg-amber-500/15 text-amber-400',
    },
    purple: {
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20 hover:border-purple-500/40',
      text: 'text-purple-400',
      glow: 'shadow-purple-500/5',
      iconBg: 'bg-purple-500/15 text-purple-400',
    },
    blue: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20 hover:border-blue-500/40',
      text: 'text-blue-400',
      glow: 'shadow-blue-500/5',
      iconBg: 'bg-blue-500/15 text-blue-400',
    },
  };

  const scheme = colorStyles[color] || colorStyles.cyan;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border ${scheme.border} bg-slate-900/60 p-5 backdrop-blur-md transition-all duration-200 shadow-lg ${scheme.glow}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              {title}
            </span>
            {badgeText && (
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300 border border-slate-700">
                {badgeText}
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="h-8 w-28 animate-pulse rounded bg-slate-800 my-1" />
          ) : (
            <div className="text-2xl font-bold tracking-tight text-white">
              {value !== undefined && value !== null ? value : (
                <span className="text-base font-normal text-slate-500 italic">
                  Awaiting Data
                </span>
              )}
            </div>
          )}

          {subtext && (
            <p className="text-xs text-slate-400">
              {subtext}
            </p>
          )}
        </div>

        {Icon && (
          <div className={`rounded-lg p-2.5 ${scheme.iconBg}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      {trend && !isLoading && (
        <div className="mt-4 flex items-center gap-1.5 text-xs">
          {trendType === 'positive' && (
            <span className="flex items-center font-medium text-emerald-400">
              <ArrowUpRight className="mr-0.5 h-3.5 w-3.5" />
              {trend}
            </span>
          )}
          {trendType === 'negative' && (
            <span className="flex items-center font-medium text-rose-400">
              <ArrowDownRight className="mr-0.5 h-3.5 w-3.5" />
              {trend}
            </span>
          )}
          {trendType === 'neutral' && (
            <span className="flex items-center font-medium text-slate-400">
              <Minus className="mr-0.5 h-3.5 w-3.5" />
              {trend}
            </span>
          )}
          <span className="text-slate-400">vs historical baseline</span>
        </div>
      )}
    </div>
  );
};

export default StatisticCard;
