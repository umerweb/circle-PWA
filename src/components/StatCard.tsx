import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: string;
  trendType?: 'positive' | 'neutral' | 'attention';
}

export function StatCard({ title, value, subtitle, icon, trend, trendType = 'neutral' }: StatCardProps) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 sm:p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between text-slate-500 mb-1.5 gap-1">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 truncate">
            {title}
          </span>
          {icon && (
            <div className="text-emerald-700 bg-emerald-50 p-1.5 sm:p-2 rounded-lg shrink-0">
              {icon}
            </div>
          )}
        </div>
        <div className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900 font-mono break-all sm:break-normal">
          {value}
        </div>
      </div>
      {(subtitle || trend) && (
        <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 gap-0.5">
          <span className="truncate">{subtitle}</span>
          {trend && (
            <span
              className={`font-semibold shrink-0 ${
                trendType === 'positive'
                  ? 'text-emerald-700'
                  : trendType === 'attention'
                  ? 'text-amber-700'
                  : 'text-slate-600'
              }`}
            >
              {trend}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
