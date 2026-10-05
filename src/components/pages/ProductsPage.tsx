import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  ShoppingCart,
  Heart,
  Filter,
  Eye,
  LayoutGrid,
  List,
  Sparkles,
  AlertTriangle,
  Package,
} from 'lucide-react';
import { Product } from '../../types.ts';
import { api } from '../../services/api.ts';
import { useCart } from '../../context/CartContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

interface ProductsPageProps {
  onOpenProductDetail: (product: Product) => void;
  onOpenAddProduct: () => void;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({
  onOpenProductDetail,
  onOpenAddProduct,
}) => {
  const { addToCart } = useCart();
  const { isStaff } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStockStatus, setSelectedStockStatus] = useState('All');
  const [sortBy, setSortBy] = useState('name_asc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const categories = [
    'All',
    'Groceries',
    'Beverages',
    'Snacks',
    'Dairy',
    'Personal Care',
    'Household',
    'Other',
  ];

  const stockStatuses = ['All', 'In Stock', 'Low Stock', 'Critical', 'Out of Stock'];

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await api.getProducts({
        category: selectedCategory,
        stockStatus: selectedStockStatus,
        search,
        sort: sortBy,
      });
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, selectedStockStatus, sortBy]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const handleToggleWishlist = async (productId: string) => {
    try {
      const res = await api.toggleWishlist(productId);
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, isWishlisted: res.isWishlisted } : p))
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">Product & Merchandise Catalog</h1>
          <p className="text-xs text-slate-500 mt-0.5">Explore store inventory, check real-time stock levels, and dispatch directly to POS cart</p>
        </div>

        <div className="flex items-center gap-2">
          {isStaff && (
            <button
              onClick={onOpenAddProduct}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
        {/* Category Segmented Controls */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100/70 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search, Stock filter, and Sort row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
          {/* Search */}
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by title, SKU, brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Stock Filter */}
          <div>
            <select
              value={selectedStockStatus}
              onChange={(e) => setSelectedStockStatus(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
            >
              {stockStatuses.map((s) => (
                <option key={s} value={s}>
                  Stock: {s}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
            >
              <option value="name_asc">Sort: Name (A-Z)</option>
              <option value="price_asc">Sort: Price (Low to High)</option>
              <option value="price_desc">Sort: Price (High to Low)</option>
              <option value="stock_desc">Sort: Highest Stock</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="py-16 text-center text-xs text-slate-400">
          Loading catalog products...
        </div>
      )}

      {/* Empty State */}
      {!loading && products.length === 0 && (
        <div className="py-16 text-center bg-white rounded-xl border border-slate-200 p-8 space-y-3">
          <Package className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-900">No products match your criteria</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your category filter, clearing your search query, or add a new product to your inventory.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('All');
              setSelectedStockStatus('All');
              setSearch('');
            }}
            className="px-3.5 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Grid View */}
      {!loading && viewMode === 'grid' && products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => {
            const isOutOfStock = product.quantity === 0;
            const isLowStock = product.quantity > 0 && product.quantity <= product.reorderLevel;

            return (
              <div
                key={product.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col justify-between hover:border-slate-300 transition-all duration-150 group"
              >
                {/* Image and badges */}
                <div className="relative h-44 bg-slate-50 overflow-hidden flex items-center justify-center p-4 border-b border-slate-100">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-400">
                      <Package className="w-8 h-8" />
                      <span className="text-[10px] mt-1">{product.category}</span>
                    </div>
                  )}

                  {/* Stock Status Tag */}
                  <div className="absolute top-2.5 left-2.5">
                    {isOutOfStock ? (
                      <span className="px-2 py-0.5 text-[10px] font-semibold text-red-700 bg-red-100/90 rounded backdrop-blur-xs">
                        Out of Stock
                      </span>
                    ) : isLowStock ? (
                      <span className="px-2 py-0.5 text-[10px] font-semibold text-amber-800 bg-amber-100/90 rounded backdrop-blur-xs">
                        Low Stock ({product.quantity})
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] font-medium text-emerald-800 bg-emerald-50 rounded">
                        {product.quantity} in stock
                      </span>
                    )}
                  </div>

                  {/* Wishlist toggle */}
                  <button
                    onClick={() => handleToggleWishlist(product.id)}
                    className="absolute top-2.5 right-2.5 p-1.5 rounded-md bg-white/90 hover:bg-white text-slate-400 hover:text-red-500 shadow-xs transition-colors"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${
                        product.isWishlisted ? 'fill-red-500 text-red-500' : ''
                      }`}
                    />
                  </button>
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-1">
                      <span>{product.sku}</span>
                      <span>{product.category}</span>
                    </div>
                    <h3
                      onClick={() => onOpenProductDetail(product)}
                      className="text-xs font-bold text-slate-900 hover:text-indigo-600 cursor-pointer line-clamp-2 leading-snug"
                    >
                      {product.name}
                    </h3>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-base font-bold font-mono text-slate-900 tabular-nums">
                        ${product.price.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        Cost: ${product.cost.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onOpenProductDetail(product)}
                        className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                        title="View specifications"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => addToCart(product, 1)}
                        disabled={isOutOfStock}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 rounded-lg transition-colors shadow-xs"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {!loading && viewMode === 'table' && products.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4 font-mono">SKU</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Price</th>
                <th className="py-3 px-4 text-right">In Stock</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 font-mono">Expiry</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => {
                const isOutOfStock = p.quantity === 0;
                const isLowStock = p.quantity > 0 && p.quantity <= p.reorderLevel;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center border border-slate-200">
                          {p.image ? (
                            <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <span
                          onClick={() => onOpenProductDetail(p)}
                          className="font-medium text-slate-900 hover:text-indigo-600 cursor-pointer max-w-xs truncate"
                        >
                          {p.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">{p.sku}</td>
                    <td className="py-3 px-4 text-slate-600">{p.category}</td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 tabular-nums">
                      ${p.price.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-900">
                      {p.quantity}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-medium rounded ${
                          isOutOfStock
                            ? 'bg-red-50 text-red-700'
                            : isLowStock
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{p.expiryDate}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onOpenProductDetail(p)}
                          className="p-1 text-slate-500 hover:text-slate-800 rounded"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => addToCart(p, 1)}
                          disabled={isOutOfStock}
                          className="px-2.5 py-1 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 rounded"
                        >
                          + Cart
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
