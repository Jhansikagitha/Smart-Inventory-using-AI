import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, Order, SaleRecord } from '../types.ts';
import { api } from '../services/api.ts';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  tax: number;
  grandTotal: number;
  checkout: (details: {
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    paymentMethod: string;
  }) => Promise<{ order: Order; sale: SaleRecord }>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('smartstock_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('smartstock_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product, quantity: number = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(product.quantity, item.quantity + quantity) }
            : item
        );
      }
      return [...prev, { product, quantity: Math.min(product.quantity, Math.max(1, quantity)) }];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: Math.min(item.product.quantity, quantity) }
          : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = Math.round(cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0) * 100) / 100;
  const tax = Math.round(subtotal * 0.05 * 100) / 100;
  const grandTotal = Math.round((subtotal + tax) * 100) / 100;

  const checkout = async (details: {
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    paymentMethod: string;
  }) => {
    if (cart.length === 0) throw new Error('Cart is empty');

    const payload = {
      ...details,
      items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
    };

    const res = await api.createOrder(payload);
    clearCart();
    return res;
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalItems,
        subtotal,
        tax,
        grandTotal,
        checkout,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
