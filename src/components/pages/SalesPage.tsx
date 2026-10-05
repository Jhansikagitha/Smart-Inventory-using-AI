import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  Receipt,
  CreditCard,
  Calendar,
  RefreshCw,
  ArrowUpRight,
} from 'lucide-react';
import { StatCard } from '../common/StatCard.tsx';
import { AreaLineChart } from '../common/ChartComponents.tsx';
import { api } from '../../services/api.ts';
import { SaleRecord } from '../../types.ts';

export const SalesPage: React.FC = () => {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [metrics, setMetrics] = useState({
    todayRevenue: 0,
    weeklyRevenue: 0,
    monthlyRevenue: 0,
    totalRevenue: 0,
    totalTransactions: 0,
    averageOrderValue: 0,
  });
  const [timeline, setTimeline] = useState<{ label: string; value: number; secondary?: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSalesData = async () => {
    setLoading(true);
    try {
      const [salesRes, analytics] = await Promise.all([api.getSales(), api.getAnalytics('30d')]);
      setSales(salesRes.sales);
      setMetrics(salesRes.metrics);
      setTimeline(
        analytics.salesTimeline.map((item) => ({
          label: item.date.slice(5),
          value: item.revenue,
          secondary: item.profit,
        }))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, []);

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">Sales Management & Financial Ledger</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit store gross revenue, transaction volumes, profit margins, and line-item payment records
          </p>
        </div>

        <button
          onClick={fetchSalesData}
          className="self-start sm:self-auto p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          title="Refresh sales ledger"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
        </button>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          title="Today's Sales"
          value={`$${metrics.todayRevenue.toFixed(2)}`}
          subtext="Cleared cash & digital POS"
          icon={DollarSign}
        />
        <StatCard
          title="Past 7 Days"
          value={`$${metrics.weeklyRevenue.toFixed(2)}`}
          subtext="Rolling 7-day volume"
          icon={TrendingUp}
        />
        <StatCard
          title="Monthly Revenue"
          value={`$${metrics.monthlyRevenue.toFixed(2)}`}
          subtext="Past 30 calendar days"
          icon={Receipt}
        />
        <StatCard
          title="Average Order (AOV)"
          value={`$${metrics.averageOrderValue.toFixed(2)}`}
          subtext={`Across ${metrics.totalTransactions} transactions`}
          icon={CreditCard}
        />
      </div>

      {/* Sales Trajectory Chart */}
      <div className="p-5 bg-white rounded-xl border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Daily Sales Revenue (Past 30 Days)</h2>
            <p className="text-xs text-slate-500">Gross sales receipts vs estimated net margin</p>
          </div>
        </div>
        <AreaLineChart
          data={timeline}
          primaryLabel="Daily Sales"
          secondaryLabel="Gross Margin"
          valuePrefix="$"
          height={240}
        />
      </div>

      {/* Sales Transactions Ledger */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Historical Sales Transactions</h3>
          <span className="text-xs text-slate-500 font-mono">{sales.length} logged entries</span>
        </div>

        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4 font-mono">Sale ID</th>
              <th className="py-3 px-4 font-mono">Order Ref</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4 font-mono">Date</th>
              <th className="py-3 px-4">Line Items</th>
              <th className="py-3 px-4 text-right">Units</th>
              <th className="py-3 px-4">Payment Method</th>
              <th className="py-3 px-4 text-right">Sale Total</th>
              <th className="py-3 px-4 text-right">Profit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sales.map((sale) => (
              <tr key={sale.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3 px-4 font-mono font-medium text-slate-900">{sale.saleNumber}</td>
                <td className="py-3 px-4 font-mono text-slate-500">{sale.orderId}</td>
                <td className="py-3 px-4 font-medium text-slate-900">{sale.customerName}</td>
                <td className="py-3 px-4 font-mono text-slate-500">{sale.date}</td>
                <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                  {sale.items.map((i) => `${i.productName} (x${i.quantity})`).join(', ')}
                </td>
                <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">{sale.itemCount}</td>
                <td className="py-3 px-4 text-slate-600">{sale.paymentMethod}</td>
                <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-slate-900">
                  ${sale.totalAmount.toFixed(2)}
                </td>
                <td className="py-3 px-4 text-right font-mono font-medium tabular-nums text-emerald-700">
                  +${sale.profit.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
