import React, { useState } from 'react';
import { X, ShoppingCart, Heart, Calendar, Truck, ShieldCheck, AlertTriangle, Cpu } from 'lucide-react';
import { Product } from '../../types.ts';
import { useCart } from '../../context/CartContext.tsx';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onEdit?: (product: Product) => void;
  onToggleWishlist?: (productId: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onEdit,
  onToggleWishlist,
}) => {
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);

  if (!product) return null;

  const handleAddToCart = () => {
    addToCart(product, qty);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2000);
  };

  const margin = product.price > 0 ? ((product.price - product.cost) / product.price) * 100 : 0;
  const isLowStock = product.quantity <= product.reorderLevel;
  const isOutOfStock = product.quantity === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
        {/* Product Image / Visual Showcase */}
        <div className="md:w-1/2 bg-slate-50 flex items-center justify-center p-6 border-b md:border-b-0 md:border-r border-slate-200 relative">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              referrerPolicy="no-referrer"
              className="max-h-64 object-contain rounded-xl shadow-sm"
            />
          ) : (
            <div className="w-48 h-48 rounded-xl bg-indigo-50 border border-indigo-100 flex flex-col items-center justify-center text-center p-4">
              <span className="text-3xl font-bold text-indigo-600 mb-2">
                {product.name.charAt(0)}
              </span>
              <span className="text-xs font-medium text-slate-500">{product.category}</span>
            </div>
          )}

          {/* Quick status pill */}
          <div className="absolute top-4 left-4">
            {isOutOfStock ? (
              <span className="px-2.5 py-1 text-xs font-semibold text-red-700 bg-red-100 rounded-md">
                Out of Stock
              </span>
            ) : isLowStock ? (
              <span className="px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-100 rounded-md">
                Low Stock ({product.quantity} left)
              </span>
            ) : (
              <span className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-100 rounded-md">
                In Stock ({product.quantity} units)
              </span>
            )}
          </div>
        </div>

        {/* Product Details & Actions */}
        <div className="md:w-1/2 p-6 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="text-xs font-mono text-slate-500 uppercase">{product.sku}</span>
              <button
                onClick={onClose}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h2 className="text-lg font-bold text-slate-900 leading-snug mb-1">{product.name}</h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
              <span>{product.category}</span>
              <span>·</span>
              <span>Rating: {product.rating} ★</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              {product.description || 'Quality retail merchandise packaged for general consumer convenience.'}
            </p>

            {/* Financial & Inventory Grid */}
            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs mb-4">
              <div>
                <span className="text-slate-400 block text-[11px]">Retail Price</span>
                <span className="font-semibold text-slate-900 text-base font-mono tabular-nums">
                  ${product.price.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Cost / Unit</span>
                <span className="font-medium text-slate-700 font-mono tabular-nums">
                  ${product.cost.toFixed(2)} ({margin.toFixed(0)}% margin)
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Batch Number</span>
                <span className="font-mono text-slate-700">{product.batchNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Expiry Date</span>
                <span className="font-mono text-slate-700">{product.expiryDate || 'N/A'}</span>
              </div>
            </div>

            {/* Supplier reference */}
            <div className="flex items-center gap-2 text-xs text-slate-600 mb-4">
              <Truck className="w-3.5 h-3.5 text-slate-400" />
              <span>Supplier: <strong>{product.supplierName || 'Default Vendor'}</strong></span>
            </div>
          </div>

          {/* Cart Quantity & Action Buttons */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            {!isOutOfStock ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100"
                  >
                    -
                  </button>
                  <span className="px-3 py-1.5 text-xs font-mono font-semibold text-slate-900 min-w-8 text-center">
                    {qty}
                  </span>
                  <button
                    onClick={() => setQty(Math.min(product.quantity, qty + 1))}
                    className="px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Add to POS Cart (${(qty * product.price).toFixed(2)})</span>
                </button>

                {onToggleWishlist && (
                  <button
                    onClick={() => onToggleWishlist(product.id)}
                    className={`p-2 rounded-lg border transition-colors ${
                      product.isWishlisted
                        ? 'border-red-200 bg-red-50 text-red-600'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                    title="Toggle wishlist"
                  >
                    <Heart className="w-4 h-4 fill-current" />
                  </button>
                )}
              </div>
            ) : (
              <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg text-center font-medium">
                Product is currently out of stock. Use Restock PO to replenish.
              </div>
            )}

            {addedNotice && (
              <div className="text-center text-xs text-emerald-600 font-medium animate-in fade-in">
                ✓ Added to cart successfully!
              </div>
            )}

            {onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(product);
                }}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-800 transition-colors"
              >
                Edit Product Information →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
