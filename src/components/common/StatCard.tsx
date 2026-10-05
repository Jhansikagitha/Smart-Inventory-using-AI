import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  variant?: 'default' | 'critical' | 'warning' | 'indigo';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  trend,
  variant = 'default',
  onClick,
}) => {
  const borderVariants = {
    default: 'border-slate-200 hover:border-slate-300',
    critical: 'border-red-200 bg-red-50/20 hover:border-red-300',
    warning: 'border-amber-200 bg-amber-50/20 hover:border-amber-300',
    indigo: 'border-indigo-200 bg-indigo-50/20 hover:border-indigo-300',
  };

  const iconVariants = {
    default: 'bg-slate-100 text-slate-700',
    critical: 'bg-red-100 text-red-700',
    warning: 'bg-amber-100 text-amber-700',
    indigo: 'bg-indigo-100 text-indigo-700',
  };

  return (
    <div
      onClick={onClick}
      className={`p-5 bg-white rounded-xl border transition-all duration-150 ${borderVariants[variant]} ${
        onClick ? 'cursor-pointer hover:shadow-sm' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</span>
        <div className={`p-2 rounded-lg ${iconVariants[variant]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-2xl font-semibold tracking-tight text-slate-900 font-mono tabular-nums">
          {value}
        </span>
        {trend && (
          <span
            className={`text-xs font-medium tabular-nums ${
              trend.isPositive ? 'text-emerald-700' : 'text-red-700'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>
      {subtext && <p className="mt-1 text-xs text-slate-500 truncate">{subtext}</p>}
    </div>
  );
};
