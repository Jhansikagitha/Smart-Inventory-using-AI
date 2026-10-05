import React, { useState } from 'react';
import { X, ArrowDownRight, ArrowUpRight, Check } from 'lucide-react';
import { Product } from '../../types.ts';
import { api } from '../../services/api.ts';

interface StockInOutModalProps {
  isOpen: boolean;
  type: 'IN' | 'OUT';
  product: Product | null;
  onClose: () => void;
  onSaved: () => void;
}

export const StockInOutModal: React.FC<StockInOutModalProps> = ({
  isOpen,
  type,
  product,
  onClose,
  onSaved,
}) => {
  const [quantity, setQuantity] = useState<number>(10);
  const [unitCost, setUnitCost] = useState<number>(product?.cost || 0);
  const [supplierName, setSupplierName] = useState<string>(product?.supplierName || '');
  const [reason, setReason] = useState<string>(
    type === 'IN' ? 'Stock replenishment from supplier' : 'Damaged / expired inventory write-off'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) {
      setError('Quantity must be greater than zero');
      return;
    }
    if (type === 'OUT' && quantity > product.quantity) {
      setError(`Cannot remove ${quantity} units. Only ${product.quantity} currently on hand.`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (type === 'IN') {
        await api.stockIn(product.id, {
          quantity,
          unitCost,
          supplierName,
          reason,
        });
      } else {
        await api.stockOut(product.id, {
          quantity,
          reason,
        });
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const isStockIn = type === 'IN';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-lg ${
                isStockIn ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
              }`}
            >
              {isStockIn ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                {isStockIn ? 'Stock In (Replenishment)' : 'Stock Out (Write-off / Adjustment)'}
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">{product.sku} · {product.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
              {error}
            </div>
          )}

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Current Stock on Hand:</span>
            <span className="font-semibold text-slate-900 font-mono tabular-nums text-sm">
              {product.quantity} units
            </span>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Quantity to {isStockIn ? 'Add' : 'Deduct'} *
            </label>
            <input
              type="number"
              min="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 font-mono text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <div className="mt-1 text-[11px] text-slate-500 font-mono">
              Balance after adjustment:{' '}
              <strong className="text-slate-900">
                {isStockIn ? product.quantity + quantity : Math.max(0, product.quantity - quantity)} units
              </strong>
            </div>
          </div>

          {isStockIn && (
            <>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Supplier / Vendor</label>
                <input
                  type="text"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Unit Cost ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={unitCost}
                  onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </>
          )}

          <div>
            <label className="block font-medium text-slate-700 mb-1">Reason / Note</label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
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
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white rounded-lg transition-colors disabled:opacity-50 ${
                isStockIn ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'Processing...' : isStockIn ? 'Confirm Stock In' : 'Confirm Stock Out'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
