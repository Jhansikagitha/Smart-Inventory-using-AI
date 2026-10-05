import React, { useState } from 'react';
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Trash2,
  Check,
  Package,
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext.tsx';

interface AlertsPageProps {
  onNavigate: (tab: string) => void;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({ onNavigate }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, dismiss } = useNotifications();
  const [filterType, setFilterType] = useState<string>('All');

  const filtered = notifications.filter((n) => {
    if (filterType === 'All') return true;
    if (filterType === 'Unread') return !n.isRead;
    return n.type === filterType;
  });

  const getIcon = (type: string) => {
    if (type === 'critical') return <AlertTriangle className="w-5 h-5 text-red-600" />;
    if (type === 'warning') return <AlertCircle className="w-5 h-5 text-amber-600" />;
    return <Sparkles className="w-5 h-5 text-indigo-600" />;
  };

  const getBorderColor = (type: string, isRead: boolean) => {
    if (isRead) return 'border-slate-200 bg-white opacity-75';
    if (type === 'critical') return 'border-red-200 bg-red-50/20';
    if (type === 'warning') return 'border-amber-200 bg-amber-50/20';
    return 'border-indigo-200 bg-indigo-50/20';
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
              Operations Alert & Notification Center
            </h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700 rounded-md font-mono">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated exception alerts generated for stockouts, shelf expirations, and sudden demand spikes
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <Check className="w-3.5 h-3.5 text-slate-500" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs max-w-md">
        {[
          { id: 'All', label: 'All Alerts' },
          { id: 'Unread', label: `Unread (${unreadCount})` },
          { id: 'critical', label: 'Critical' },
          { id: 'warning', label: 'Warnings' },
          { id: 'insight', label: 'AI Insights' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterType(f.id)}
            className={`flex-1 py-1.5 rounded-md font-medium text-center transition-colors ${
              filterType === f.id
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-900">No active alerts</h3>
            <p className="text-xs text-slate-500">
              All inventory levels and perishable shelf-lives are currently within safe thresholds.
            </p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${getBorderColor(
                item.type,
                item.isRead
              )}`}
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2 rounded-lg bg-white shadow-xs border border-slate-100 shrink-0 mt-0.5">
                  {getIcon(item.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{item.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{item.createdAt}</span>
                    {!item.isRead && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 mt-1 leading-relaxed">{item.message}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!item.isRead && (
                  <button
                    onClick={() => markAsRead(item.id)}
                    className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Read
                  </button>
                )}
                <button
                  onClick={() => dismiss(item.id)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white transition-colors"
                  title="Dismiss alert"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
