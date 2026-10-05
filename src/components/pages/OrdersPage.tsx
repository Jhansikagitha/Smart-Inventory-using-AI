import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  Printer,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { Order } from '../../types.ts';
import { api } from '../../services/api.ts';

interface OrdersPageProps {
  onOpenInvoice: (order: Order) => void;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({ onOpenInvoice }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await api.getOrders({ search, status: statusFilter });
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchOrders, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const handleStatusChange = async (orderId: string, newStatus: Order['orderStatus']) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, orderStatus: newStatus } : o))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const statuses = ['All', 'Pending', 'Confirmed', 'Processing', 'Completed', 'Cancelled'];

  const statusStyles = {
    Pending: 'bg-amber-50 text-amber-700 border-amber-200',
    Confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
    Processing: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Cancelled: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">Customer Orders</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor fulfillment workflows, review payment records, and generate print-ready tax invoices
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="self-start sm:self-auto p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          title="Refresh orders"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Order ID, customer name, phone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                Status: {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4 font-mono">Order ID</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4 font-mono">Date</th>
              <th className="py-3 px-4">Purchased Items</th>
              <th className="py-3 px-4 text-right">Total Amount</th>
              <th className="py-3 px-4 text-center">Payment</th>
              <th className="py-3 px-4 text-center">Order Status</th>
              <th className="py-3 px-4 text-right">Invoice</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((order) => {
              const totalQuantity = order.items.reduce((acc, i) => acc + i.quantity, 0);

              return (
                <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-slate-900">{order.orderNumber}</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{order.customerName}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{order.customerPhone}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">{order.date}</td>
                  <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                    {order.items.map((i) => `${i.productName} (x${i.quantity})`).join(', ')}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold tabular-nums text-slate-900">
                    ${order.totalAmount.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 rounded">
                      {order.paymentStatus} ({order.paymentMethod})
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <select
                      value={order.orderStatus}
                      onChange={(e) => handleStatusChange(order.id, e.target.value as any)}
                      className={`text-[11px] font-semibold px-2 py-1 rounded border focus:outline-none cursor-pointer ${
                        statusStyles[order.orderStatus]
                      }`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Processing">Processing</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onOpenInvoice(order)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Invoice</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
