import React, { useState, useEffect } from 'react';
import {
  Package,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  AlertTriangle,
  CalendarClock,
  Ban,
  Cpu,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Plus,
  ExternalLink,
} from 'lucide-react';
import { StatCard } from '../common/StatCard.tsx';
import { AreaLineChart, BarComparisonChart, CategoryDonutChart } from '../common/ChartComponents.tsx';
import { api } from '../../services/api.ts';
import { Order, SaleRecord, Product, PredictionOutput, ExpiryRecord, NotificationItem } from '../../types.ts';

interface DashboardPageProps {
  onNavigate: (tab: string, itemId?: string) => void;
  onOpenProductDetail: (product: Product) => void;
  onOpenInvoice: (order: Order) => void;
  onOpenRestock: (product: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onOpenProductDetail,
  onOpenInvoice,
  onOpenRestock,
}) => {
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'today' | '7d' | '30d'>('7d');

  const [metrics, setMetrics] = useState({
    totalProducts: 0,
    totalInventoryValue: 0,
    todaySales: 0,
    totalOrders: 0,
    lowStockCount: 0,
    expiringSoonCount: 0,
    outOfStockCount: 0,
    predictedDemand7d: 0,
  });

  const [salesTimeline, setSalesTimeline] = useState<{ label: string; value: number; secondary?: number }[]>([]);
  const [categoriesData, setCategoriesData] = useState<any[]>([]);
  const [comparisonData, setComparisonData] = useState<{ label: string; actual: number; predicted: number }[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [recentSales, setRecentSales] = useState<SaleRecord[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [expiryAlerts, setExpiryAlerts] = useState<ExpiryRecord[]>([]);
  const [topPrediction, setTopPrediction] = useState<PredictionOutput | null>(null);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [analytics, orders, salesRes, products, predictionsRes, expiryRes] = await Promise.all([
        api.getAnalytics(timeframe),
        api.getOrders(),
        api.getSales(),
        api.getProducts(),
        api.getPredictions(),
        api.getExpiryRecords(),
      ]);

      setMetrics({
        totalProducts: products.length,
        totalInventoryValue: analytics.totalInventoryValue,
        todaySales: salesRes.metrics.todayRevenue,
        totalOrders: orders.length,
        lowStockCount: products.filter((p) => p.quantity > 0 && p.quantity <= p.reorderLevel).length,
        expiringSoonCount: expiryRes.summary.expiring7dCount,
        outOfStockCount: products.filter((p) => p.quantity === 0).length,
        predictedDemand7d: predictionsRes.summary.totalProjectedDemand7d,
      });

      // Sales timeline mapping
      setSalesTimeline(
        analytics.salesTimeline.map((item) => ({
          label: item.date.slice(5),
          value: item.revenue,
          secondary: item.profit,
        }))
      );

      setCategoriesData(analytics.categoriesList);

      // Comparison data for top 6 products
      const topPreds = predictionsRes.predictions.slice(0, 6).map((p) => ({
        label: p.productName.split(' ')[0],
        actual: p.historical7dSales,
        predicted: p.predicted7dDemand,
      }));
      setComparisonData(topPreds);

      // Find highest urgency recommendation
      const urgent = predictionsRes.predictions.find(
        (p) => p.recommendedRestock > 0 && (p.stockoutRisk === 'Critical' || p.demandTrend === 'High')
      );
      setTopPrediction(urgent || predictionsRes.predictions[0] || null);

      setRecentOrders(orders.slice(0, 5));
      setRecentSales(salesRes.sales.slice(0, 5));
      setLowStockProducts(products.filter((p) => p.quantity <= p.reorderLevel).slice(0, 5));
      setExpiryAlerts(expiryRes.records.filter((r) => r.status !== 'Safe').slice(0, 4));
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [timeframe]);

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Action & Timeframe Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">Store Performance & Operations</h1>
          <p className="text-xs text-slate-500 mt-0.5">Real-time inventory valuation, point-of-sale volume, and machine learning forecasts</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Segmented Timeframe Switcher */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg">
            {(['today', '7d', '30d'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  timeframe === t
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t === 'today' ? 'Today' : t === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
              </button>
            ))}
          </div>

          <button
            onClick={loadDashboardData}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            title="Refresh metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* AI Recommendation Highlight Banner */}
      {topPrediction && (
        <div className="p-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-xl shadow-sm border border-indigo-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-lg shrink-0 mt-0.5 border border-indigo-400/30">
              <Sparkles className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-300">
                  AI Smart Recommendation
                </span>
                <span className="px-1.5 py-0.2 text-[10px] font-mono rounded bg-indigo-700/60 text-indigo-200">
                  {topPrediction.confidenceScore}% confidence
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-100 font-medium mt-0.5 leading-relaxed">
                “{topPrediction.productName} is projected to see high demand ({topPrediction.predicted7dDemand} units in next 7 days). Current stock is {topPrediction.currentStock} units.”
              </p>
              <p className="text-[11px] text-indigo-200/80 mt-0.5">
                Recommended Action: Restock {topPrediction.recommendedRestock} units from {topPrediction.sku} to avoid weekend stockout.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onOpenRestock(topPrediction)}
              className="px-3.5 py-2 text-xs font-semibold bg-white text-indigo-900 hover:bg-indigo-50 rounded-lg transition-colors whitespace-nowrap shadow-sm"
            >
              Draft Restock PO ({topPrediction.recommendedRestock} units)
            </button>
            <button
              onClick={() => onNavigate('predictions')}
              className="p-2 text-indigo-200 hover:text-white rounded-lg hover:bg-indigo-700/40 transition-colors"
              title="View all forecasts"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 8 Top KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          title="Total Products"
          value={metrics.totalProducts}
          subtext="Active SKUs in catalog"
          icon={Package}
          onClick={() => onNavigate('products')}
        />
        <StatCard
          title="Inventory Valuation"
          value={`$${metrics.totalInventoryValue.toLocaleString()}`}
          subtext="At current retail pricing"
          icon={DollarSign}
          onClick={() => onNavigate('inventory')}
        />
        <StatCard
          title="Today's Sales"
          value={`$${metrics.todaySales.toFixed(2)}`}
          subtext="Gross store POS revenue"
          icon={TrendingUp}
          trend={{ value: '+14.2% vs avg', isPositive: true }}
          onClick={() => onNavigate('sales')}
        />
        <StatCard
          title="Total Orders"
          value={metrics.totalOrders}
          subtext="Customer orders logged"
          icon={ShoppingBag}
          onClick={() => onNavigate('orders')}
        />
        <StatCard
          title="Low Stock"
          value={metrics.lowStockCount}
          subtext="At or below reorder point"
          icon={AlertTriangle}
          variant={metrics.lowStockCount > 0 ? 'warning' : 'default'}
          onClick={() => onNavigate('inventory')}
        />
        <StatCard
          title="Expiring Soon"
          value={metrics.expiringSoonCount}
          subtext="Within 7 calendar days"
          icon={CalendarClock}
          variant={metrics.expiringSoonCount > 0 ? 'warning' : 'default'}
          onClick={() => onNavigate('expiry')}
        />
        <StatCard
          title="Out of Stock"
          value={metrics.outOfStockCount}
          subtext="Zero shelf inventory"
          icon={Ban}
          variant={metrics.outOfStockCount > 0 ? 'critical' : 'default'}
          onClick={() => onNavigate('inventory')}
        />
        <StatCard
          title="AI Forecast (7d)"
          value={`${metrics.predictedDemand7d} units`}
          subtext="Aggregated demand forecast"
          icon={Cpu}
          variant="indigo"
          onClick={() => onNavigate('predictions')}
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales & Profit Timeline (2 cols) */}
        <div className="lg:col-span-2 p-5 bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Revenue & Profit Trajectory</h2>
              <p className="text-xs text-slate-500">Gross revenue (Indigo) vs Operating gross margin (Emerald)</p>
            </div>
            <button
              onClick={() => onNavigate('sales')}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>Sales ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <AreaLineChart
            data={salesTimeline}
            primaryLabel="Revenue"
            secondaryLabel="Gross Profit"
            valuePrefix="$"
            height={230}
          />
        </div>

        {/* Category Breakdown (1 col) */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-900">Inventory Value by Category</h2>
              <span className="text-[11px] text-slate-400 font-mono">Real-time split</span>
            </div>
            <CategoryDonutChart categories={categoriesData} />
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <button
              onClick={() => onNavigate('analytics')}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
            >
              Explore detailed analytics →
            </button>
          </div>
        </div>
      </div>

      {/* AI Comparison Chart & Urgency Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Actual vs Predicted Demand */}
        <div className="lg:col-span-2 p-5 bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-slate-900">Predicted Demand vs Actual Sales (Units)</h2>
                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-indigo-50 text-indigo-700 rounded">
                  Machine Learning Model
                </span>
              </div>
              <p className="text-xs text-slate-500">Comparing past 7-day velocity to next 7-day regression projection</p>
            </div>
            <button
              onClick={() => onNavigate('predictions')}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>Full forecast</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <BarComparisonChart data={comparisonData} height={230} />
        </div>

        {/* Operations Urgency Watchlist */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-900">Stock & Expiry Alerts</h2>
              <span className="text-xs font-mono text-amber-600 font-medium">Urgent</span>
            </div>

            <div className="space-y-2.5">
              {expiryAlerts.map((exp) => (
                <div
                  key={exp.productId}
                  className="p-2.5 rounded-lg border border-amber-200/70 bg-amber-50/30 flex items-center justify-between text-xs"
                >
                  <div className="truncate mr-2">
                    <span className="font-semibold text-slate-900 block truncate">{exp.productName}</span>
                    <span className="text-[11px] text-amber-700 font-mono">
                      {exp.status} ({exp.daysRemaining <= 0 ? 'Expired' : `${exp.daysRemaining}d left`}) · {exp.quantity} units
                    </span>
                  </div>
                  <button
                    onClick={() => onNavigate('expiry')}
                    className="px-2 py-1 text-[11px] font-medium text-amber-800 bg-amber-100 hover:bg-amber-200 rounded shrink-0"
                  >
                    Action
                  </button>
                </div>
              ))}

              {lowStockProducts.slice(0, 2).map((p) => (
                <div
                  key={p.id}
                  className="p-2.5 rounded-lg border border-red-200/70 bg-red-50/30 flex items-center justify-between text-xs"
                >
                  <div className="truncate mr-2">
                    <span className="font-semibold text-slate-900 block truncate">{p.name}</span>
                    <span className="text-[11px] text-red-700 font-mono">
                      {p.quantity === 0 ? 'Out of stock' : `Low stock (${p.quantity}/${p.reorderLevel})`}
                    </span>
                  </div>
                  <button
                    onClick={() => onOpenRestock(p)}
                    className="px-2 py-1 text-[11px] font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded shrink-0"
                  >
                    Restock
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              onClick={() => onNavigate('expiry')}
              className="font-medium text-indigo-600 hover:text-indigo-800"
            >
              Expiry Center →
            </button>
            <button
              onClick={() => onNavigate('alerts')}
              className="font-medium text-slate-500 hover:text-slate-800"
            >
              All notifications ({metrics.lowStockCount + metrics.expiringSoonCount})
            </button>
          </div>
        </div>
      </div>

      {/* Recent Orders & Recent Sales Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="p-5 bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900">Recent Customer Orders</h2>
            <button
              onClick={() => onNavigate('orders')}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase">
                  <th className="py-2">Order ID</th>
                  <th className="py-2">Customer</th>
                  <th className="py-2 text-right">Amount</th>
                  <th className="py-2 text-center">Status</th>
                  <th className="py-2 text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 font-mono text-slate-700">{ord.orderNumber}</td>
                    <td className="py-2.5 font-medium text-slate-900">{ord.customerName}</td>
                    <td className="py-2.5 text-right font-mono font-semibold tabular-nums text-slate-900">
                      ${ord.totalAmount.toFixed(2)}
                    </td>
                    <td className="py-2.5 text-center">
                      <span className="px-2 py-0.5 text-[10px] font-medium bg-emerald-50 text-emerald-700 rounded-md">
                        {ord.orderStatus}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => onOpenInvoice(ord)}
                        className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800"
                      >
                        Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Sales Activity */}
        <div className="p-5 bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900">Recent POS Sales Ledger</h2>
            <button
              onClick={() => onNavigate('sales')}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>Sales module</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase">
                  <th className="py-2">Sale No</th>
                  <th className="py-2">Items</th>
                  <th className="py-2 text-right">Total</th>
                  <th className="py-2">Method</th>
                  <th className="py-2 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentSales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 font-mono text-slate-700">{s.saleNumber}</td>
                    <td className="py-2.5 text-slate-600">
                      {s.itemCount} unit{s.itemCount > 1 ? 's' : ''}
                    </td>
                    <td className="py-2.5 text-right font-mono font-semibold tabular-nums text-slate-900">
                      ${s.totalAmount.toFixed(2)}
                    </td>
                    <td className="py-2.5 text-slate-600 text-[11px]">{s.paymentMethod}</td>
                    <td className="py-2.5 text-right font-mono text-slate-400 text-[11px]">{s.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
