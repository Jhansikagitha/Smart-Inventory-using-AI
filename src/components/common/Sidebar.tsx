import React from 'react';
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingBag,
  ShoppingCart,
  Heart,
  TrendingUp,
  Cpu,
  CalendarClock,
  Bell,
  BarChart3,
  Lightbulb,
  Truck,
  FileSpreadsheet,
  Users,
  Settings,
  Sparkles,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useCart } from '../../context/CartContext.tsx';
import { useNotifications } from '../../context/NotificationContext.tsx';

interface SidebarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onNavigate,
  mobileOpen,
  onCloseMobile,
}) => {
  const { user, isAdmin } = useAuth();
  const { totalItems } = useCart();
  const { unreadCount } = useNotifications();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'Core' },
    { id: 'products', label: 'Products', icon: Package, section: 'Inventory & Store' },
    { id: 'inventory', label: 'Inventory Master', icon: Boxes, section: 'Inventory & Store' },
    { id: 'orders', label: 'Orders', icon: ShoppingBag, section: 'Inventory & Store' },
    { id: 'cart', label: 'Cart & POS', icon: ShoppingCart, badge: totalItems > 0 ? totalItems : undefined, section: 'Inventory & Store' },
    { id: 'wishlist', label: 'Wishlist', icon: Heart, section: 'Inventory & Store' },
    { id: 'sales', label: 'Sales Management', icon: TrendingUp, section: 'Commercial' },
    { id: 'predictions', label: 'AI Demand Prediction', icon: Cpu, isAi: true, section: 'AI Intelligence' },
    { id: 'insights', label: 'AI Business Insights', icon: Lightbulb, isAi: true, section: 'AI Intelligence' },
    { id: 'expiry', label: 'Expiry Management', icon: CalendarClock, section: 'Operations' },
    { id: 'alerts', label: 'Alerts & Notices', icon: Bell, badge: unreadCount > 0 ? unreadCount : undefined, badgeCritical: true, section: 'Operations' },
    { id: 'analytics', label: 'Business Analytics', icon: BarChart3, section: 'Operations' },
    { id: 'suppliers', label: 'Suppliers', icon: Truck, section: 'Operations' },
    { id: 'reports', label: 'Reports & Export', icon: FileSpreadsheet, section: 'Operations' },
    ...(isAdmin ? [{ id: 'users', label: 'Users & Roles', icon: Users, section: 'Administration' }] : []),
    { id: 'settings', label: 'Store Settings', icon: Settings, section: 'Administration' },
  ];

  // Group by sections
  const sections = ['Core', 'AI Intelligence', 'Inventory & Store', 'Commercial', 'Operations', 'Administration'];

  const content = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-inner">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-white leading-none">
              SmartStock <span className="text-indigo-400">AI</span>
            </div>
            <div className="text-[10px] text-slate-400 tracking-wide mt-0.5">
              Intelligent Inventory
            </div>
          </div>
        </div>
        <button
          onClick={onCloseMobile}
          className="p-1 text-slate-400 hover:text-white rounded-lg lg:hidden"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {sections.map((sec) => {
          const items = navItems.filter((i) => i.section === sec);
          if (items.length === 0) return null;

          return (
            <div key={sec}>
              <div className="px-2 pb-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                {sec}
              </div>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 text-xs font-medium rounded-lg transition-colors duration-150 ${
                        isActive
                          ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-white' : item.isAi ? 'text-indigo-400' : 'text-slate-400'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge !== undefined && (
                        <span
                          className={`px-1.5 py-0.2 text-[10px] font-mono rounded-full ${
                            isActive
                              ? 'bg-white text-indigo-700'
                              : item.badgeCritical
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-indigo-500/20 text-indigo-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Profile Strip */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between px-2 py-1.5 rounded-lg">
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-7 h-7 rounded-md bg-indigo-900/60 border border-indigo-700/50 flex items-center justify-center text-xs font-semibold text-indigo-300">
              {user?.role === 'admin' ? 'AD' : 'ST'}
            </div>
            <div className="truncate text-left">
              <div className="text-xs font-medium text-slate-200 truncate">{user?.name || 'Staff User'}</div>
              <div className="text-[10px] text-slate-500 font-mono capitalize">{user?.role || 'Staff'} Mode</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 h-screen sticky top-0 shrink-0 border-r border-slate-800 select-none">
        {content}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-xs h-full bg-slate-900 shadow-2xl z-10">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
