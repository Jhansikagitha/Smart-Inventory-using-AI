import React, { useState } from 'react';
import {
  ShoppingCart,
  Trash2,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Banknote,
  Smartphone,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { useCart } from '../../context/CartContext.tsx';
import { Order } from '../../types.ts';

interface CartPageProps {
  onNavigate: (tab: string) => void;
  onOpenInvoice: (order: Order) => void;
}

export const CartPage: React.FC<CartPageProps> = ({ onNavigate, onOpenInvoice }) => {
  const { cart, updateQuantity, removeFromCart, clearCart, subtotal, tax, grandTotal, checkout } = useCart();

  const [customerName, setCustomerName] = useState('Alex Henderson');
  const [customerPhone, setCustomerPhone] = useState('+1 (555) 349-8821');
  const [customerAddress, setCustomerAddress] = useState('423 Westlake Blvd, Suite 2B');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Credit Card' | 'UPI / Bank Transfer' | 'Store Credit'>(
    'Credit Card'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const result = await checkout({
        customerName,
        customerPhone,
        customerAddress,
        paymentMethod,
      });

      setCompletedOrder(result.order);
    } catch (err: any) {
      setError(err.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">Point of Sale & Cart Checkout</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Process customer counter transactions, dispatch online retail orders, and auto-decrement warehouse stock
        </p>
      </div>

      {completedOrder ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-xl mx-auto space-y-4 shadow-sm animate-in fade-in duration-200">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Order Placed Successfully!</h2>
            <p className="text-xs text-slate-500 mt-1">
              Order ID: <strong className="font-mono text-slate-900">{completedOrder.orderNumber}</strong>
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-left space-y-1.5 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500">Customer:</span>
              <span className="text-slate-900">{completedOrder.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Billed:</span>
              <span className="text-indigo-600 font-bold">${completedOrder.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Payment:</span>
              <span className="text-slate-700">{completedOrder.paymentMethod} (Paid)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Stock Decrement:</span>
              <span className="text-emerald-700 font-semibold">✓ Automatically updated</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onOpenInvoice(completedOrder)}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
            >
              Print Tax Invoice
            </button>
            <button
              onClick={() => {
                setCompletedOrder(null);
                onNavigate('products');
              }}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              New Transaction
            </button>
          </div>
        </div>
      ) : cart.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto space-y-3">
          <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto" />
          <h2 className="text-sm font-semibold text-slate-900">Your POS cart is currently empty</h2>
          <p className="text-xs text-slate-500">
            Browse the product catalog or master inventory to add retail items to this customer order.
          </p>
          <button
            onClick={() => onNavigate('products')}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
          >
            Browse Product Catalog →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items List (2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">Cart Items</span>
                <span className="px-2 py-0.5 text-xs font-mono bg-slate-100 text-slate-700 rounded-md">
                  {cart.length} unique SKU{cart.length > 1 ? 's' : ''}
                </span>
              </div>
              <button
                onClick={clearCart}
                className="text-xs text-red-600 hover:text-red-700 font-medium"
              >
                Clear Cart
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {cart.map((item) => {
                const p = item.product;
                const lineTotal = item.quantity * p.price;

                return (
                  <div key={p.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 shrink-0">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <ShoppingCart className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-900">{p.name}</h4>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {p.sku} · ${p.price.toFixed(2)} each · {p.quantity} available in stock
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateQuantity(p.id, item.quantity - 1)}
                          className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                        >
                          -
                        </button>
                        <span className="px-2.5 py-1 text-xs font-mono font-semibold text-slate-900 min-w-7 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(p.id, item.quantity + 1)}
                          className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                        >
                          +
                        </button>
                      </div>

                      {/* Line Subtotal */}
                      <div className="text-right min-w-16">
                        <span className="font-mono font-semibold text-xs text-slate-900 tabular-nums">
                          ${lineTotal.toFixed(2)}
                        </span>
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => removeFromCart(p.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Checkout & Customer Details (1 col) */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
              Checkout & Customer Details
            </h3>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleCheckout} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Store / Shipping Address</label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1.5">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'Credit Card', icon: CreditCard },
                    { id: 'Cash', icon: Banknote },
                    { id: 'UPI / Bank Transfer', icon: Smartphone },
                    { id: 'Store Credit', icon: ShieldCheck },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`flex items-center gap-1.5 p-2 rounded-lg border text-left transition-colors ${
                        paymentMethod === m.id
                          ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 font-semibold'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <m.icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{m.id}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Order Financial Calculation */}
              <div className="pt-3 border-t border-slate-100 space-y-1.5 font-mono">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="tabular-nums">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Sales Tax (5%):</span>
                  <span className="tabular-nums">${tax.toFixed(2)}</span>
                </div>
                <div className="border-t border-slate-100 pt-1.5 flex justify-between text-slate-900 font-bold text-sm">
                  <span>Grand Total:</span>
                  <span className="text-indigo-600 tabular-nums">${grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg shadow-sm transition-colors"
              >
                <span>{loading ? 'Processing Order...' : `Place Order ($${grandTotal.toFixed(2)})`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
