import React, { useState, useEffect } from 'react';
import { X, Package, Check, Image as ImageIcon } from 'lucide-react';
import { Product, Supplier } from '../../types.ts';
import { api } from '../../services/api.ts';

interface AddEditProductModalProps {
  isOpen: boolean;
  product?: Product | null;
  onClose: () => void;
  onSaved: () => void;
}

export const AddEditProductModal: React.FC<AddEditProductModalProps> = ({
  isOpen,
  product,
  onClose,
  onSaved,
}) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'Groceries',
    price: 0,
    cost: 0,
    quantity: 0,
    reorderLevel: 15,
    supplierId: 'sup_01',
    supplierName: 'GreenValley Organic Farms',
    batchNumber: '',
    expiryDate: '',
    rating: 4.8,
    image: '',
    description: '',
  });

  useEffect(() => {
    async function loadSuppliers() {
      try {
        const list = await api.getSuppliers();
        setSuppliers(list);
      } catch (err) {
        console.error(err);
      }
    }
    loadSuppliers();
  }, []);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        sku: product.sku,
        category: product.category,
        price: product.price,
        cost: product.cost,
        quantity: product.quantity,
        reorderLevel: product.reorderLevel,
        supplierId: product.supplierId || 'sup_01',
        supplierName: product.supplierName || 'Default Supplier',
        batchNumber: product.batchNumber || '',
        expiryDate: product.expiryDate || '',
        rating: product.rating || 4.8,
        image: product.image || '',
        description: product.description || '',
      });
    } else {
      const futureDate = new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0];
      setFormData({
        name: '',
        sku: `SKU-RET-${Math.floor(100 + Math.random() * 900)}`,
        category: 'Groceries',
        price: 4.99,
        cost: 2.5,
        quantity: 25,
        reorderLevel: 15,
        supplierId: 'sup_01',
        supplierName: 'GreenValley Organic Farms',
        batchNumber: `BCH-${Date.now().toString().substring(7)}`,
        expiryDate: futureDate,
        rating: 4.8,
        image: '',
        description: '',
      });
    }
  }, [product, isOpen]);

  if (!isOpen) return null;

  const categories = [
    'Groceries',
    'Beverages',
    'Snacks',
    'Dairy',
    'Personal Care',
    'Household',
    'Other',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.price <= 0) {
      setError('Product name and valid price are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (product) {
        await api.updateProduct(product.id, formData);
      } else {
        await api.createProduct(formData);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-900">
              {product ? 'Edit Product Details' : 'Add New Inventory SKU'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block font-medium text-slate-700 mb-1">Product Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Organic Pure Honey (500g)"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">SKU Identifier</label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-3 py-2 font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 uppercase"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Department / Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Selling Price ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Unit Cost ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Initial Quantity (Units)</label>
              <input
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Reorder Alert Threshold</label>
              <input
                type="number"
                min="1"
                value={formData.reorderLevel}
                onChange={(e) => setFormData({ ...formData, reorderLevel: parseInt(e.target.value) || 10 })}
                className="w-full px-3 py-2 font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Supplier</label>
              <select
                value={formData.supplierId}
                onChange={(e) => {
                  const s = suppliers.find((sup) => sup.id === e.target.value);
                  setFormData({
                    ...formData,
                    supplierId: e.target.value,
                    supplierName: s?.name || 'General Supplier',
                  });
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white truncate"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Batch Code</label>
              <input
                type="text"
                placeholder="e.g. BCH-2026-09"
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                className="w-full px-3 py-2 font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Expiry Date</label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full px-3 py-2 font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Image URL / Path</label>
              <input
                type="text"
                placeholder="/src/assets/images/..."
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 truncate"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-medium text-slate-700 mb-1">Product Description</label>
              <textarea
                rows={2}
                placeholder="Product attributes, storage conditions, packaging..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
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
              <span>{loading ? 'Saving SKU...' : product ? 'Update SKU' : 'Create Product'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
