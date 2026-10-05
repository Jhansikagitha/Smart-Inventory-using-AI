import React, { useState, useEffect } from 'react';
import { Search, X, Package, ShoppingBag, Truck, DollarSign, ArrowRight } from 'lucide-react';
import { api } from '../../services/api.ts';
import { Product, Order, Supplier, SaleRecord } from '../../types.ts';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string, itemId?: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    products: Product[];
    orders: Order[];
    suppliers: Supplier[];
    sales: SaleRecord[];
  }>({
    products: [],
    orders: [],
    suppliers: [],
    sales: [],
  });

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults({ products: [], orders: [], suppliers: [], sales: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ products: [], orders: [], suppliers: [], sales: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.universalSearch(query);
        setResults(data);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const totalHits =
    results.products.length + results.orders.length + results.suppliers.length + results.sales.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search products, orders, suppliers, SKU..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 rounded border border-slate-200">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4">
          {loading && (
            <div className="py-8 text-center text-xs text-slate-400 font-medium">
              Searching database...
            </div>
          )}

          {!loading && query && totalHits === 0 && (
            <div className="py-8 text-center text-xs text-slate-400">
              No matching records found for "{query}"
            </div>
          )}

          {!query && (
            <div className="py-6 px-4 text-xs text-slate-400">
              <div className="font-medium text-slate-600 mb-2">Suggested Searches</div>
              <div className="flex flex-wrap gap-1.5">
                {['Whole Milk', 'Basmati Rice', 'ORD-2026', 'GreenValley', 'Snacks', 'Out of Stock'].map(
                  (tag) => (
                    <button
                      key={tag}
                      onClick={() => setQuery(tag)}
                      className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs transition-colors"
                    >
                      {tag}
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {/* Products Section */}
          {results.products.length > 0 && (
            <div>
              <div className="px-2 pb-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" />
                Products ({results.products.length})
              </div>
              <div className="space-y-1">
                {results.products.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      onNavigate('products', p.id);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600">
                          {p.name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {p.sku} · Stock: {p.quantity} units · ${p.price.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Orders Section */}
          {results.orders.length > 0 && (
            <div>
              <div className="px-2 pb-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5" />
                Orders ({results.orders.length})
              </div>
              <div className="space-y-1">
                {results.orders.map((o) => (
                  <div
                    key={o.id}
                    onClick={() => {
                      onNavigate('orders', o.id);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600">
                        {o.orderNumber} – {o.customerName}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {o.date} · ${o.totalAmount.toFixed(2)} · {o.orderStatus}
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suppliers Section */}
          {results.suppliers.length > 0 && (
            <div>
              <div className="px-2 pb-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5" />
                Suppliers ({results.suppliers.length})
              </div>
              <div className="space-y-1">
                {results.suppliers.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      onNavigate('suppliers', s.id);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600">
                        {s.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Contact: {s.contactPerson} · {s.phone}
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sales Section */}
          {results.sales.length > 0 && (
            <div>
              <div className="px-2 pb-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" />
                Sales Transactions ({results.sales.length})
              </div>
              <div className="space-y-1">
                {results.sales.map((sl) => (
                  <div
                    key={sl.id}
                    onClick={() => {
                      onNavigate('sales');
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600">
                        {sl.saleNumber} – {sl.customerName}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {sl.date} · ${sl.totalAmount.toFixed(2)} ({sl.itemCount} items)
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
