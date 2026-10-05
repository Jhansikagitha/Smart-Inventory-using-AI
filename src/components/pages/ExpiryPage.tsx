import React, { useState, useEffect } from 'react';
import {
  CalendarClock,
  AlertTriangle,
  Percent,
  Trash2,
  Tag,
  DollarSign,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { StatCard } from '../common/StatCard.tsx';
import { ExpiryRecord } from '../../types.ts';
import { api } from '../../services/api.ts';

interface ExpiryPageProps {
  onOpenDiscount: (item: any) => void;
}

export const ExpiryPage: React.FC<ExpiryPageProps> = ({ onOpenDiscount }) => {
  const [records, setRecords] = useState<ExpiryRecord[]>([]);
  const [summary, setSummary] = useState({
    expiredCount: 0,
    expiring7dCount: 0,
    totalAtRiskValue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const fetchExpiry = async () => {
    setLoading(true);
    try {
      const res = await api.getExpiryRecords();
      setRecords(res.records);
      setSummary(res.summary);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpiry();
  }, []);

  const handleRemoveExpired = async (productId: string, productName: string) => {
    if (!window.confirm(`Write-off and remove expired stock of "${productName}" from active shelves?`)) {
      return;
    }

    try {
      const res = await api.removeExpiredStock(productId);
      setActionNotice(res.message);
      setTimeout(() => setActionNotice(null), 3000);
      fetchExpiry();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrioritize = (productName: string) => {
    setActionNotice(`Priority front-facing shelf flag activated for "${productName}".`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const filtered = records.filter((r) => {
    if (statusFilter === 'All') return true;
    if (statusFilter === 'AtRisk') return r.status !== 'Safe';
    return r.status === statusFilter;
  });

  const statusStyles: Record<string, string> = {
    Expired: 'bg-red-100 text-red-800 border-red-200 font-bold',
    'Expiring Today': 'bg-red-50 text-red-700 border-red-200 font-semibold',
    'Expiring in 3 Days': 'bg-amber-100 text-amber-800 border-amber-200 font-semibold',
    'Expiring in 7 Days': 'bg-amber-50 text-amber-700 border-amber-200',
    Safe: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
            Expiry & Perishable Shelf-Life Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor lot lifecycles, apply markdown clearances before spoilage, and execute compliance write-offs
          </p>
        </div>

        <button
          onClick={fetchExpiry}
          className="self-start sm:self-auto p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          title="Refresh shelf life data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
        </button>
      </div>

      {actionNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          title="Total At-Risk Value"
          value={`$${summary.totalAtRiskValue.toFixed(2)}`}
          subtext="Potential inventory spoilage loss"
          icon={DollarSign}
          variant={summary.totalAtRiskValue > 0 ? 'warning' : 'default'}
        />
        <StatCard
          title="Expiring Within 7 Days"
          value={`${summary.expiring7dCount} Batches`}
          subtext="Eligible for promotional clearance"
          icon={CalendarClock}
          variant={summary.expiring7dCount > 0 ? 'warning' : 'default'}
        />
        <StatCard
          title="Expired Batches"
          value={`${summary.expiredCount} Lots`}
          subtext="Requires immediate removal"
          icon={AlertTriangle}
          variant={summary.expiredCount > 0 ? 'critical' : 'default'}
        />
        <StatCard
          title="Safe Shelf Stock"
          value={`${records.filter((r) => r.status === 'Safe').length} Batches`}
          subtext="Lifecycle > 7 days"
          icon={CheckCircle2}
        />
      </div>

      {/* Table & Filtering */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden space-y-4 p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-slate-900">Perishable Lots & Expiry Tracker</h2>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs overflow-x-auto max-w-full">
            {[
              { id: 'All', label: 'All Batches' },
              { id: 'AtRisk', label: 'All At-Risk' },
              { id: 'Expired', label: 'Expired' },
              { id: 'Expiring Today', label: 'Expiring Today' },
              { id: 'Expiring in 3 Days', label: 'In 3 Days' },
              { id: 'Expiring in 7 Days', label: 'In 7 Days' },
              { id: 'Safe', label: 'Safe' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
                  statusFilter === f.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-3">Product Name</th>
                <th className="py-3 px-3 font-mono">Batch No</th>
                <th className="py-3 px-3 text-right">Units on Hand</th>
                <th className="py-3 px-3 font-mono">Expiry Date</th>
                <th className="py-3 px-3 text-center">Days Remaining</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">At-Risk Value</th>
                <th className="py-3 px-3">Action Recommendations</th>
                <th className="py-3 px-3 text-right">Quick Execution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r) => (
                <tr key={r.productId} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-900 max-w-xs truncate">{r.productName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{r.sku} · {r.category}</div>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600">{r.batchNumber}</td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                    {r.quantity}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600">{r.expiryDate}</td>
                  <td className="py-3 px-3 text-center font-mono tabular-nums font-bold">
                    <span className={r.daysRemaining <= 3 ? 'text-red-700' : 'text-slate-700'}>
                      {r.daysRemaining <= 0 ? `${Math.abs(r.daysRemaining)}d ago` : `${r.daysRemaining} days`}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`px-2 py-0.5 text-[10px] rounded border ${statusStyles[r.status] || ''}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-semibold tabular-nums text-slate-900">
                    ${r.atRiskValue.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-slate-600 text-[11px] max-w-xs">
                    {r.recommendation}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {r.status === 'Expired' ? (
                        <button
                          onClick={() => handleRemoveExpired(r.productId, r.productName)}
                          className="px-2.5 py-1 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
                        >
                          Write Off
                        </button>
                      ) : r.status !== 'Safe' ? (
                        <>
                          <button
                            onClick={() => onOpenDiscount(r)}
                            className="px-2.5 py-1 text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded transition-colors"
                          >
                            Markdown
                          </button>
                          <button
                            onClick={() => handlePrioritize(r.productName)}
                            className="px-2 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded"
                            title="Flag on front shelves"
                          >
                            Prioritize
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] text-emerald-700 font-medium">Nominal</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
