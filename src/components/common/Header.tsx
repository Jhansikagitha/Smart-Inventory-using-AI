import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  ShoppingCart,
  User as UserIcon,
  LogOut,
  Shield,
  CheckCircle2,
  Menu,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useCart } from '../../context/CartContext.tsx';
import { useNotifications } from '../../context/NotificationContext.tsx';

interface HeaderProps {
  currentTab: string;
  onOpenSearch: () => void;
  onNavigate: (tab: string) => void;
  onToggleMobileSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenSearch,
  onNavigate,
  onToggleMobileSidebar,
}) => {
  const { user, logout } = useAuth();
  const { totalItems, grandTotal } = useCart();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const tabTitles: Record<string, string> = {
    dashboard: 'Dashboard Overview',
    products: 'Product Catalog',
    inventory: 'Inventory Management',
    orders: 'Customer Orders',
    cart: 'Point of Sale & Cart',
    wishlist: 'Saved Wishlist',
    sales: 'Sales Ledger',
    predictions: 'AI Demand Prediction & Reorder Engine',
    expiry: 'Expiry & Shelf-Life Management',
    alerts: 'Central Alerts & Notification Center',
    analytics: 'Business Analytics & Valuation',
    insights: 'Executive AI Advisory Feed',
    suppliers: 'Supplier Directory',
    reports: 'Business & Export Reports',
    users: 'User & Access Governance',
  };

  const currentTitle = tabTitles[currentTab] || 'SmartStock AI';

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-white border-b border-slate-200">
      {/* Zone 1: Contextual Page Title or Mobile Menu */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg lg:hidden"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="text-sm font-semibold tracking-tight text-slate-900 truncate">
          {currentTitle}
        </div>
      </div>

      {/* Zone 2: Universal Search Trigger */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-1.5 text-xs text-slate-400 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>Search products, orders, suppliers, SKU...</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white rounded border border-slate-200">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Zone 3: Primary Actions (Search mobile, POS Cart, Notifications, User) */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Mobile search button */}
        <button
          onClick={onOpenSearch}
          className="p-2 text-slate-600 hover:text-slate-900 rounded-lg md:hidden"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Cart / POS Quick button */}
        <button
          onClick={() => onNavigate('cart')}
          className="relative flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
        >
          <ShoppingCart className="w-4 h-4 text-slate-600" />
          <span className="hidden sm:inline">POS Cart</span>
          {totalItems > 0 && (
            <span className="px-1.5 py-0.2 text-[11px] font-semibold text-white bg-indigo-600 rounded-full font-mono tabular-nums">
              {totalItems}
            </span>
          )}
          {grandTotal > 0 && (
            <span className="hidden md:inline text-xs font-mono font-semibold text-slate-900 ml-1">
              ${grandTotal.toFixed(2)}
            </span>
          )}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-600 rounded-full ring-2 ring-white"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-900">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-medium bg-red-100 text-red-700 rounded-md font-mono">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No active notifications
                  </div>
                ) : (
                  notifications.slice(0, 6).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`p-3 text-xs transition-colors cursor-pointer ${
                        n.isRead ? 'bg-white opacity-70' : 'bg-indigo-50/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="font-semibold text-slate-900">{n.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{n.createdAt}</span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">{n.message}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2 border-t border-slate-100 bg-slate-50 text-center">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    onNavigate('alerts');
                  }}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                >
                  View all alerts & history →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-semibold flex items-center justify-center text-xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="font-medium text-slate-900 leading-tight truncate max-w-[110px]">
                {user?.name?.split(' ')[0] || 'User'}
              </div>
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wide">
                {user?.role || 'Staff'}
              </div>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50">
              <div className="px-3 py-2 border-b border-slate-100">
                <div className="text-xs font-semibold text-slate-900 truncate">{user?.name}</div>
                <div className="text-[11px] text-slate-500 font-mono truncate">{user?.email}</div>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 text-[10px] font-medium bg-indigo-50 text-indigo-700 rounded capitalize">
                    {user?.role} Access
                  </span>
                </div>
              </div>

              {user?.role === 'admin' && (
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onNavigate('users');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Shield className="w-3.5 h-3.5 text-slate-400" />
                  <span>Admin User Manager</span>
                </button>
              )}

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  logout();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5 text-red-500" />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
