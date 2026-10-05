import React, { useState, useEffect } from 'react';
import { Heart, ShoppingCart, Trash2, Package, ArrowRight } from 'lucide-react';
import { Product } from '../../types.ts';
import { api } from '../../services/api.ts';
import { useCart } from '../../context/CartContext.tsx';

interface WishlistPageProps {
  onNavigate: (tab: string) => void;
  onOpenProductDetail: (product: Product) => void;
}

export const WishlistPage: React.FC<WishlistPageProps> = ({ onNavigate, onOpenProductDetail }) => {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const all = await api.getProducts();
      setProducts(all.filter((p) => p.isWishlisted));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemove = async (id: string) => {
    try {
      await api.toggleWishlist(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMoveToCart = (product: Product) => {
    addToCart(product, 1);
    handleRemove(product.id);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">Saved Wishlist & Reorder Queue</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Quickly access frequently purchased retail inventory items and move them directly to the POS cart
        </p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading wishlist...</div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
          <Heart className="w-12 h-12 text-slate-300 mx-auto" />
          <h2 className="text-sm font-semibold text-slate-900">No saved products in wishlist</h2>
          <p className="text-xs text-slate-500">
            Click the heart icon on any catalog product card to pin it here for rapid replenishment.
          </p>
          <button
            onClick={() => onNavigate('products')}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
          >
            Explore Catalog →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => {
            const isOutOfStock = p.quantity === 0;

            return (
              <div
                key={p.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col justify-between p-4 space-y-3 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-lg bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100 shrink-0">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-400">{p.sku}</span>
                      <button
                        onClick={() => handleRemove(p.id)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded"
                        title="Remove from wishlist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <h3
                      onClick={() => onOpenProductDetail(p)}
                      className="text-xs font-bold text-slate-900 hover:text-indigo-600 cursor-pointer truncate"
                    >
                      {p.name}
                    </h3>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {isOutOfStock ? (
                        <span className="text-red-600 font-semibold">Out of Stock</span>
                      ) : (
                        <span>{p.quantity} units available</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="font-mono font-bold text-sm text-slate-900 tabular-nums">
                    ${p.price.toFixed(2)}
                  </span>

                  <button
                    onClick={() => handleMoveToCart(p)}
                    disabled={isOutOfStock}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 rounded-lg transition-colors shadow-xs"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Move to Cart</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
