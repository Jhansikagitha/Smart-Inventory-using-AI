import React, { useState } from 'react';
import { X, Percent, Check, AlertCircle } from 'lucide-react';
import { api } from '../../services/api.ts';

interface ClearanceDiscountModalProps {
  isOpen: boolean;
  item: {
    productId: string;
    productName: string;
    sku: string;
    price: number;
    cost: number;
    daysRemaining: number;
  } | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ClearanceDiscountModal: React.FC<ClearanceDiscountModalProps> = ({
  isOpen,
  item,
  onClose,
  onSuccess,
}) => {
  const [percent, setPercent] = useState<number>(25);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  const discountedPrice = Math.max(item.cost, Math.round(item.price * (1 - percent / 100) * 100) / 100);

  const handleApply = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.applyClearanceDiscount(item.productId, percent);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to apply discount');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
              <Percent className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Apply Clearance Markdown</h3>
              <p className="text-[11px] text-slate-500 font-mono">{item.sku} · {item.productName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
              {error}
            </div>
          )}

          <div className="p-3 bg-amber-50/50 border border-amber-200/60 rounded-xl text-amber-800 text-xs">
            <div className="font-semibold flex items-center gap-1.5 mb-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Shelf-Life Notice: {item.daysRemaining <= 0 ? 'Expired' : `${item.daysRemaining} days remaining`}</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Markdown helps recover working capital and inventory cost before write-off.
            </p>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1.5">Select Discount Tier</label>
            <div className="grid grid-cols-4 gap-2">
              {[15, 25, 35, 50].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setPercent(pct)}
                  className={`py-2 text-xs font-semibold rounded-lg border transition-colors ${
                    percent === pct
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {pct}% OFF
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <div className="flex justify-between text-slate-500">
              <span>Original Price:</span>
              <span className="line-through font-mono tabular-nums">${item.price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-slate-900 text-sm">
              <span>New Clearance Price:</span>
              <span className="text-emerald-700 font-mono tabular-nums">${discountedPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Floor Cost / Unit:</span>
              <span className="font-mono tabular-nums">${item.cost.toFixed(2)}</span>
            </div>
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
              type="button"
              disabled={loading}
              onClick={handleApply}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'Applying...' : 'Apply Markdown'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
