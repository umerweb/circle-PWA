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
    <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm hover:border-slate-300 transition-all">
      <div className="flex items-center justify-between text-slate-500 mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">{title}</span>
        {icon && <div className="text-emerald-700 bg-emerald-50 p-2 rounded-lg">{icon}</div>}
      </div>
      <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-mono">
        {value}
      </div>
      {(subtitle || trend) && (
        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
          <span>{subtitle}</span>
          {trend && (
            <span
              className={`font-medium ${
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
