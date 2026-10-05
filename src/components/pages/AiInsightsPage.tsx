import React, { useState, useEffect } from 'react';
import {
  Lightbulb,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Package,
  Percent,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { AIInsight } from '../../types.ts';
import { api } from '../../services/api.ts';

interface AiInsightsPageProps {
  onNavigate: (tab: string) => void;
  onOpenRestock: (product: any) => void;
  onOpenDiscount: (item: any) => void;
}

export const AiInsightsPage: React.FC<AiInsightsPageProps> = ({
  onNavigate,
  onOpenRestock,
  onOpenDiscount,
}) => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [executingId, setExecutingId] = useState<string | null>(null);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const data = await api.getInsights();
      setInsights(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const handleResolve = async (id: string) => {
    setExecutingId(id);
    try {
      await api.resolveInsight(id);
      setInsights((prev) =>
        prev.map((ins) => (ins.id === id ? { ...ins, resolved: true } : ins))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setExecutingId(null);
    }
  };

  const severityColors = {
    CRITICAL: 'bg-red-50 text-red-700 border-red-200',
    RECOMMENDED: 'bg-amber-50 text-amber-700 border-amber-200',
    OPPORTUNITY: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    OPTIMIZATION: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
              Executive AI Advisory Feed
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-100 text-indigo-700 rounded-md">
              Automated Business Intelligence
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Algorithmic diagnostics detecting stockout hazards, perishable clearance windows, and basket-size opportunities
          </p>
        </div>

        <button
          onClick={fetchInsights}
          className="self-start sm:self-auto p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          title="Refresh insights"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Synthesizing business telemetry...</div>
        ) : (
          insights.map((ins) => {
            const isResolved = ins.resolved;

            return (
              <div
                key={ins.id}
                className={`p-6 bg-white rounded-2xl border transition-all ${
                  isResolved ? 'border-slate-200 opacity-60' : 'border-slate-200 hover:border-slate-300 shadow-xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-md border ${
                        severityColors[ins.severity]
                      }`}
                    >
                      {ins.severity}
                    </span>
                    <span className="text-xs font-mono text-slate-400">{ins.createdAt}</span>
                  </div>

                  {isResolved && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Action Executed</span>
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-1.5">{ins.title}</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium uppercase tracking-wider mb-0.5">
                      Root Cause Diagnostics
                    </span>
                    <p className="text-slate-700 leading-relaxed">{ins.reason}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium uppercase tracking-wider mb-0.5">
                      Quantified Business Impact
                    </span>
                    <p className="text-indigo-900 font-medium leading-relaxed">{ins.expectedImpact}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <div className="text-xs text-slate-600">
                    Recommended Action: <strong className="text-slate-900">{ins.recommendedAction}</strong>
                  </div>

                  {!isResolved && (
                    <div className="flex items-center gap-2 shrink-0">
                      {ins.actionType === 'restock' && (
                        <button
                          onClick={() => {
                            onNavigate('predictions');
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
                        >
                          <Package className="w-3.5 h-3.5" />
                          <span>Draft Replenishment PO</span>
                        </button>
                      )}

                      {ins.actionType === 'discount' && (
                        <button
                          onClick={() => {
                            onNavigate('expiry');
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors"
                        >
                          <Percent className="w-3.5 h-3.5" />
                          <span>Apply Markdown</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleResolve(ins.id)}
                        disabled={executingId === ins.id}
                        className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                      >
                        {executingId === ins.id ? 'Resolving...' : 'Mark Completed'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
