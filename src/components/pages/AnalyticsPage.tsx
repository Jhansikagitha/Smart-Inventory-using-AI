import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  PieChart,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Package,
} from 'lucide-react';
import { StatCard } from '../common/StatCard.tsx';
import { AreaLineChart, CategoryDonutChart } from '../common/ChartComponents.tsx';
import { api } from '../../services/api.ts';
import { AnalyticsData } from '../../types.ts';

export const AnalyticsPage: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'today' | '7d' | '30d' | '3m' | '1y'>('30d');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.getAnalytics(timeframe);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  const timelineData =
    data?.salesTimeline.map((item) => ({
      label: item.date.slice(5),
      value: item.revenue,
      secondary: item.profit,
    })) || [];

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header & Timeframe Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
            Advanced Retail Analytics & Financial Intelligence
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluate gross profit margins, category revenue shares, top SKUs, and dead stock risk
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Segmented Filter */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs">
            {(['today', '7d', '30d', '3m', '1y'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  timeframe === t
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t === 'today'
                  ? 'Today'
                  : t === '7d'
                  ? '7 Days'
                  : t === '30d'
                  ? '30 Days'
                  : t === '3m'
                  ? '3 Months'
                  : '1 Year'}
              </button>
            ))}
          </div>

          <button
            onClick={fetchAnalytics}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            title="Refresh analytics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          title="Period Revenue"
          value={`$${(data?.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtext="Total processed gross sales"
          icon={DollarSign}
        />
        <StatCard
          title="Gross Profit"
          value={`$${(data?.totalProfit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtext="Revenue minus wholesale cost"
          icon={TrendingUp}
          variant="indigo"
        />
        <StatCard
          title="Profit Margin"
          value={`${data?.profitMargin || 0}%`}
          subtext="Average store mark-up"
          icon={BarChart3}
        />
        <StatCard
          title="Average Order Value"
          value={`$${(data?.aov || 0).toFixed(2)}`}
          subtext={`Across ${data?.totalTransactions || 0} customer orders`}
          icon={Package}
        />
      </div>

      {/* Financial Trajectory & Category Share */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-5 bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Revenue & Margin Performance Over Time</h2>
              <p className="text-xs text-slate-500">Gross Sales (Indigo) vs Gross Margin (Emerald)</p>
            </div>
          </div>
          <AreaLineChart
            data={timelineData}
            primaryLabel="Revenue"
            secondaryLabel="Gross Profit"
            valuePrefix="$"
            height={240}
          />
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Inventory Capital Allocation</h2>
            <CategoryDonutChart categories={data?.categoriesList || []} />
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
            Total Inventory Valuation: <strong className="text-slate-900 font-mono">${(data?.totalInventoryValue || 0).toLocaleString()}</strong>
          </div>
        </div>
      </div>

      {/* Product Analytics: Best Sellers vs Slow Moving / Dead Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Selling Products */}
        <div className="p-5 bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-emerald-50 text-emerald-700">
                <ArrowUpRight className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-semibold text-slate-900">Top 5 Best-Selling Products</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">By volume</span>
          </div>

          <div className="divide-y divide-slate-100">
            {(data?.topSelling || []).map((prod, i) => (
              <div key={prod.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-slate-400 w-4">#{i + 1}</span>
                  <div>
                    <span className="font-semibold text-slate-900 block">{prod.name}</span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Generated ${(prod.revenue || 0).toFixed(2)} in revenue
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900 font-mono tabular-nums text-sm">{prod.qty}</span>
                  <span className="text-[10px] text-slate-400 block">units sold</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Slow Moving / Dead Stock */}
        <div className="p-5 bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-amber-50 text-amber-700">
                <ArrowDownRight className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-semibold text-slate-900">Slow-Moving & Dead Stock Watchlist</h3>
            </div>
            <span className="text-xs text-amber-700 font-medium">Tied Capital</span>
          </div>

          <div className="divide-y divide-slate-100">
            {(data?.slowMoving || []).map((prod, i) => (
              <div key={prod.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-900 block">{prod.name}</span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {prod.quantityInStock} units idle on shelf
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-amber-800 font-mono tabular-nums">
                    ${(prod.valueTiedUp || 0).toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-400 block">capital tied up</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
