import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  Download,
  Upload,
  Search,
  Edit2,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { InventoryItem, Product } from '../../types.ts';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';

interface InventoryPageProps {
  onOpenAddProduct: () => void;
  onOpenEditProduct: (product: Product) => void;
  onOpenStockInOut: (product: Product, type: 'IN' | 'OUT') => void;
}

export const InventoryPage: React.FC<InventoryPageProps> = ({
  onOpenAddProduct,
  onOpenEditProduct,
  onOpenStockInOut,
}) => {
  const { isStaff, isAdmin } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const data = await api.getInventory();
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete SKU "${name}" from master inventory?`)) return;
    try {
      await api.deleteProduct(id);
      fetchInventory();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportCsv = () => {
    const headers = [
      'SKU',
      'Product Name',
      'Category',
      'Quantity',
      'Unit Price',
      'Unit Cost',
      'Total Value',
      'Supplier',
      'Batch Number',
      'Expiry Date',
      'Reorder Level',
      'Status',
    ];

    const rows = items.map((i) => [
      i.sku,
      `"${i.name.replace(/"/g, '""')}"`,
      i.category,
      i.quantity,
      `$${i.price.toFixed(2)}`,
      `$${i.cost.toFixed(2)}`,
      `$${i.totalValue.toFixed(2)}`,
      `"${(i.supplierName || '').replace(/"/g, '""')}"`,
      i.batchNumber,
      i.expiryDate,
      i.reorderLevel,
      i.stockStatus,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `Master_Inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkImportSample = async () => {
    const sampleItems = [
      {
        name: 'Whole Grain Rolled Oats (1kg)',
        sku: 'SKU-GRC-901',
        category: 'Groceries',
        price: 4.25,
        cost: 2.2,
        quantity: 40,
        reorderLevel: 15,
        supplierName: 'Global Harvest Import Co.',
      },
      {
        name: 'Pure Sparkling Mineral Water (750ml)',
        sku: 'SKU-BEV-902',
        category: 'Beverages',
        price: 2.8,
        cost: 1.3,
        quantity: 48,
        reorderLevel: 20,
        supplierName: 'Apex Beverage Distributors',
      },
    ];

    try {
      await api.bulkImport(sampleItems);
      alert('Sample SKU bulk import successful (+2 items).');
      fetchInventory();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase()) ||
      item.supplierName?.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || item.stockStatus === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalInventoryValuation = filteredItems.reduce((acc, i) => acc + i.totalValue, 0);
  const totalUnits = filteredItems.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header and Bulk Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">Inventory Master Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit inventory levels, track batch numbers & valuation, and record stock-in / stock-out transactions
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {isStaff && (
            <button
              onClick={handleBulkImportSample}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              title="Bulk import demo SKUs"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Bulk Sample</span>
            </button>
          )}

          {isStaff && (
            <button
              onClick={onOpenAddProduct}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          )}

          <button
            onClick={fetchInventory}
            className="p-1.5 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            title="Refresh inventory"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200 text-xs">
        <div>
          <span className="text-slate-400 block text-[11px]">Filtered Valuation</span>
          <span className="font-bold text-base text-slate-900 font-mono tabular-nums">
            ${totalInventoryValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px]">Total Units on Hand</span>
          <span className="font-semibold text-base text-slate-900 font-mono tabular-nums">
            {totalUnits.toLocaleString()} units
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px]">Tracked SKUs</span>
          <span className="font-semibold text-base text-slate-900 font-mono tabular-nums">
            {filteredItems.length} items
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px]">Formula Verification</span>
          <span className="text-slate-600 font-mono text-[11px]">Valuation = Qty × Unit Price</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by SKU, product name, vendor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
          >
            <option value="All">All Categories</option>
            <option value="Groceries">Groceries</option>
            <option value="Beverages">Beverages</option>
            <option value="Snacks">Snacks</option>
            <option value="Dairy">Dairy</option>
            <option value="Personal Care">Personal Care</option>
            <option value="Household">Household</option>
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
          >
            <option value="All">All Stock Statuses</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Critical">Critical (&lt; 10 units)</option>
            <option value="Out of Stock">Out of Stock (0 units)</option>
          </select>
        </div>
      </div>

      {/* Master Inventory Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4 font-mono">Product ID / SKU</th>
              <th className="py-3 px-4">Product Name</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4 text-right">Qty</th>
              <th className="py-3 px-4 text-right">Unit Price</th>
              <th className="py-3 px-4 text-right">Total Value</th>
              <th className="py-3 px-4">Supplier</th>
              <th className="py-3 px-4 font-mono">Batch</th>
              <th className="py-3 px-4 font-mono">Expiry</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Stock Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredItems.map((item) => {
              const statusColors = {
                'In Stock': 'bg-emerald-50 text-emerald-700',
                'Low Stock': 'bg-amber-50 text-amber-700',
                Critical: 'bg-orange-50 text-orange-700 font-semibold',
                'Out of Stock': 'bg-red-50 text-red-700 font-bold',
              };

              return (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-600 font-medium">{item.sku}</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900 max-w-xs truncate">{item.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">Reorder threshold: {item.reorderLevel} units</div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{item.category}</td>
                  <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-slate-900">
                    {item.quantity}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                    ${item.price.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-indigo-700">
                    ${item.totalValue.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-slate-600 max-w-[140px] truncate" title={item.supplierName}>
                    {item.supplierName || 'Default Supplier'}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{item.batchNumber || '—'}</td>
                  <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{item.expiryDate}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-0.5 text-[10px] rounded ${statusColors[item.stockStatus]}`}>
                      {item.stockStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Stock in */}
                      <button
                        onClick={() => onOpenStockInOut(item, 'IN')}
                        className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                        title="Stock In (+ units)"
                      >
                        <ArrowDownRight className="w-4 h-4" />
                      </button>

                      {/* Stock out */}
                      <button
                        onClick={() => onOpenStockInOut(item, 'OUT')}
                        className="p-1.5 text-red-700 hover:bg-red-50 rounded transition-colors"
                        title="Stock Out (- units)"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </button>

                      {/* Edit */}
                      {isStaff && (
                        <button
                          onClick={() => onOpenEditProduct(item)}
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded transition-colors"
                          title="Edit details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Delete */}
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(item.id, item.name)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete SKU"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
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
