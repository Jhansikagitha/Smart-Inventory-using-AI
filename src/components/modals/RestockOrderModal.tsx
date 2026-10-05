import React, { useState } from 'react';
import { X, Truck, Check, Sparkles } from 'lucide-react';
import { api } from '../../services/api.ts';

interface RestockOrderModalProps {
  isOpen: boolean;
  product: {
    id: string;
    name: string;
    sku: string;
    currentStock: number;
    recommendedRestock: number;
    unitCost: number;
    supplierName?: string;
  } | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const RestockOrderModal: React.FC<RestockOrderModalProps> = ({
  isOpen,
  product,
  onClose,
  onSuccess,
}) => {
  const [quantity, setQuantity] = useState<number>(product?.recommendedRestock || 50);
  const [unitCost, setUnitCost] = useState<number>(product?.unitCost || 2.0);
  const [supplierName, setSupplierName] = useState<string>(product?.supplierName || 'Default Vendor');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (product) {
      setQuantity(Math.max(10, product.recommendedRestock || 50));
      setUnitCost(product.unitCost || 2.0);
      setSupplierName(product.supplierName || 'Global Harvest Import Co.');
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const totalCost = Math.round(quantity * unitCost * 100) / 100;

  const handleConfirmRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) return;
    setLoading(true);
    setError(null);

    try {
      await api.stockIn(product.id, {
        quantity,
        unitCost,
        supplierName,
        reason: 'AI Demand Forecast automated PO replenishment',
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Restock submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">AI Restock Purchase Order</h3>
              <p className="text-[11px] text-slate-500 font-mono">{product.sku} · {product.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleConfirmRestock} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
              {error}
            </div>
          )}

          <div className="p-3 bg-indigo-50/40 rounded-xl border border-indigo-100 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">Current Units on Hand</span>
              <span className="font-semibold text-slate-900 font-mono tabular-nums">
                {product.currentStock} units
              </span>
            </div>
            <div className="text-right">
              <span className="text-indigo-600 block text-[11px] font-medium">AI Recommended Batch</span>
              <span className="font-semibold text-indigo-700 font-mono tabular-nums text-sm">
                +{product.recommendedRestock || quantity} units
              </span>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Restock Order Quantity (Units)</label>
            <input
              type="number"
              min="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 font-mono text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Vendor / Supplier</label>
            <input
              type="text"
              required
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Negotiated Unit Cost ($)</label>
            <input
              type="number"
              step="0.01"
              required
              value={unitCost}
              onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
            <span className="text-slate-500">Total Purchase Order Value:</span>
            <span className="font-semibold text-slate-900 font-mono text-sm">${totalCost.toFixed(2)}</span>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'Submitting PO...' : 'Approve & Intake Stock'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
