import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Package,
  Layers,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { StatCard } from '../common/StatCard.tsx';
import { BarComparisonChart } from '../common/ChartComponents.tsx';
import { api } from '../../services/api.ts';
import { PredictionOutput } from '../../types.ts';

interface PredictionsPageProps {
  onOpenRestock: (product: any) => void;
}

export const PredictionsPage: React.FC<PredictionsPageProps> = ({ onOpenRestock }) => {
  const [predictions, setPredictions] = useState<PredictionOutput[]>([]);
  const [summary, setSummary] = useState({
    totalProjectedDemand7d: 0,
    totalRestockRecommended: 0,
    highRiskCount: 0,
    averageConfidence: 93.4,
  });
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [retrainNotice, setRetrainNotice] = useState<string | null>(null);
  const [filterRisk, setFilterRisk] = useState<string>('All');
  const [selectedProduct, setSelectedProduct] = useState<PredictionOutput | null>(null);

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const res = await api.getPredictions();
      setPredictions(res.predictions);
      setSummary(res.summary);
      if (res.predictions.length > 0 && !selectedProduct) {
        setSelectedProduct(res.predictions[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, []);

  const handleRetrain = async () => {
    setRetraining(true);
    setRetrainNotice(null);
    try {
      const res = await api.recalculatePredictions();
      setPredictions(res.predictions);
      setRetrainNotice('Scikit-learn style ML weights successfully updated with latest transactional velocity.');
      setTimeout(() => setRetrainNotice(null), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setRetraining(false);
    }
  };

  const filtered = predictions.filter((p) => {
    if (filterRisk === 'All') return true;
    if (filterRisk === 'HighRisk') return p.stockoutRisk === 'Critical' || p.stockoutRisk === 'Warning';
    if (filterRisk === 'Restock') return p.recommendedRestock > 0;
    if (filterRisk === 'HighTrend') return p.demandTrend === 'High';
    return true;
  });

  const comparisonData = predictions.slice(0, 8).map((p) => ({
    label: p.productName.split(' ')[0],
    actual: p.historical7dSales,
    predicted: p.predicted7dDemand,
  }));

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header and Re-Train Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
              AI Demand Prediction & Stock Forecasting
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-100 text-indigo-700 rounded-md">
              Linear Regression + Seasonality
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Machine learning model trained on historical burn rates, day-of-week seasonality, and category elasticity
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRetrain}
            disabled={retraining}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{retraining ? 'Re-training ML Model...' : 'Re-train Model'}</span>
          </button>

          <button
            onClick={fetchPredictions}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            title="Refresh predictions"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {retrainNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{retrainNotice}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          title="Projected 7-Day Demand"
          value={`${summary.totalProjectedDemand7d} units`}
          subtext="Store-wide forecasted sales"
          icon={TrendingUp}
          variant="indigo"
        />
        <StatCard
          title="Recommended Restock"
          value={`${summary.totalRestockRecommended} units`}
          subtext="Suggested PO replenishment"
          icon={Package}
          variant="warning"
        />
        <StatCard
          title="Stockout Risk SKUs"
          value={summary.highRiskCount}
          subtext="Projected run-out < 5 days"
          icon={AlertTriangle}
          variant={summary.highRiskCount > 0 ? 'critical' : 'default'}
        />
        <StatCard
          title="Model Confidence"
          value={`${summary.averageConfidence.toFixed(1)}%`}
          subtext="Historical fit coefficient (R²)"
          icon={Cpu}
        />
      </div>

      {/* Actual Sales vs Predicted Demand Chart */}
      <div className="p-5 bg-white rounded-xl border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Historical Sales vs AI 7-Day Predicted Demand</h2>
            <p className="text-xs text-slate-500">Dark Slate: Past 7-Day Actual Sales · Indigo: Next 7-Day Projected Need</p>
          </div>
        </div>
        <BarComparisonChart data={comparisonData} height={240} />
      </div>

      {/* Selected Product Daily Forecast & Deep Dive */}
      {selectedProduct && (
        <div className="p-5 bg-slate-900 text-white rounded-2xl shadow-sm border border-slate-800">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 text-xs text-indigo-400 font-mono">
                <span>{selectedProduct.sku}</span>
                <span>·</span>
                <span>{selectedProduct.category}</span>
                <span>·</span>
                <span>Confidence: {selectedProduct.confidenceScore}%</span>
              </div>
              <h3 className="text-base font-bold text-white mt-1">{selectedProduct.productName}</h3>
              <p className="text-xs text-slate-300 mt-1">{selectedProduct.aiRecommendation}</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block font-mono">Runway Cover</span>
                <span className="text-sm font-bold text-indigo-300 font-mono">
                  {selectedProduct.stockCoverDays} days left
                </span>
              </div>
              <button
                onClick={() => onOpenRestock(selectedProduct)}
                className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-sm"
              >
                Restock {selectedProduct.recommendedRestock > 0 ? selectedProduct.recommendedRestock : 25} Units →
              </button>
            </div>
          </div>

          {/* 7-Day Day-of-Week Forecast Grid */}
          <div className="pt-4">
            <span className="text-xs font-medium text-slate-400 block mb-2">
              Next 7 Days Predictive Demand Breakdown (Daily Units):
            </span>
            <div className="grid grid-cols-7 gap-2 text-center text-xs">
              {selectedProduct.dailyForecast.map((df, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60 font-mono">
                  <span className="text-[10px] text-slate-400 block">{df.day}</span>
                  <span className="text-sm font-bold text-white block mt-1">{df.predicted}</span>
                  <span className="text-[10px] text-indigo-400">units</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs & Master Prediction Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden space-y-4 p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900">SKU Demand Predictions</span>
            <span className="text-xs text-slate-500 font-mono">({filtered.length} SKUs)</span>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs">
            {[
              { id: 'All', label: 'All SKUs' },
              { id: 'HighRisk', label: 'Urgent Risk' },
              { id: 'Restock', label: 'Restock Needed' },
              { id: 'HighTrend', label: 'High Velocity' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterRisk(f.id)}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  filterRisk === f.id
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
                <th className="py-3 px-3 font-mono">SKU</th>
                <th className="py-3 px-3 text-right">Current Stock</th>
                <th className="py-3 px-3 text-right">7-Day Actual</th>
                <th className="py-3 px-3 text-right font-semibold text-indigo-700">7d Forecast</th>
                <th className="py-3 px-3 text-right font-semibold text-indigo-700">30d Forecast</th>
                <th className="py-3 px-3 text-center">Trend</th>
                <th className="py-3 px-3 text-right">Recommended PO</th>
                <th className="py-3 px-3 text-center">Confidence</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => {
                const isSelected = selectedProduct?.productId === item.productId;

                return (
                  <tr
                    key={item.productId}
                    onClick={() => setSelectedProduct(item)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-indigo-50/50' : 'hover:bg-slate-50/70'
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900 max-w-xs truncate">{item.productName}</div>
                      <div className="text-[10px] text-slate-500">{item.category}</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">{item.sku}</td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                      {item.currentStock}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-600">
                      {item.historical7dSales}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold tabular-nums text-indigo-600">
                      {item.predicted7dDemand}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-indigo-600">
                      {item.predicted30dDemand}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded ${
                          item.demandTrend === 'High'
                            ? 'bg-emerald-50 text-emerald-700'
                            : item.demandTrend === 'Declining'
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {item.demandTrend === 'High' && <TrendingUp className="w-3 h-3" />}
                        {item.demandTrend === 'Declining' && <TrendingDown className="w-3 h-3" />}
                        {item.demandTrend === 'Stable' && <Minus className="w-3 h-3" />}
                        <span>{item.demandTrend}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold tabular-nums">
                      {item.recommendedRestock > 0 ? (
                        <span className="text-amber-700">+{item.recommendedRestock} units</span>
                      ) : (
                        <span className="text-emerald-700">Optimal (0)</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center font-mono tabular-nums text-slate-600">
                      {item.confidenceScore}%
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenRestock(item);
                        }}
                        className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                          item.recommendedRestock > 0
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {item.recommendedRestock > 0 ? 'Restock PO' : 'View PO'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
