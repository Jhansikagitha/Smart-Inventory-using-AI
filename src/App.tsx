import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { CartProvider } from './context/CartContext.tsx';
import { NotificationProvider } from './context/NotificationContext.tsx';

// Layout & Common
import { Header } from './components/common/Header.tsx';
import { Sidebar } from './components/common/Sidebar.tsx';
import { GlobalSearchModal } from './components/common/GlobalSearchModal.tsx';

// Modals
import { ProductDetailModal } from './components/modals/ProductDetailModal.tsx';
import { AddEditProductModal } from './components/modals/AddEditProductModal.tsx';
import { StockInOutModal } from './components/modals/StockInOutModal.tsx';
import { InvoiceModal } from './components/modals/InvoiceModal.tsx';
import { RestockOrderModal } from './components/modals/RestockOrderModal.tsx';
import { ClearanceDiscountModal } from './components/modals/ClearanceDiscountModal.tsx';

// Pages
import { AuthPages } from './components/pages/AuthPages.tsx';
import { DashboardPage } from './components/pages/DashboardPage.tsx';
import { ProductsPage } from './components/pages/ProductsPage.tsx';
import { InventoryPage } from './components/pages/InventoryPage.tsx';
import { OrdersPage } from './components/pages/OrdersPage.tsx';
import { CartPage } from './components/pages/CartPage.tsx';
import { WishlistPage } from './components/pages/WishlistPage.tsx';
import { SalesPage } from './components/pages/SalesPage.tsx';
import { PredictionsPage } from './components/pages/PredictionsPage.tsx';
import { ExpiryPage } from './components/pages/ExpiryPage.tsx';
import { AlertsPage } from './components/pages/AlertsPage.tsx';
import { AnalyticsPage } from './components/pages/AnalyticsPage.tsx';
import { AiInsightsPage } from './components/pages/AiInsightsPage.tsx';
import { SuppliersPage } from './components/pages/SuppliersPage.tsx';
import { ReportsPage } from './components/pages/ReportsPage.tsx';
import { UsersPage } from './components/pages/UsersPage.tsx';
import { SettingsPage } from './components/pages/SettingsPage.tsx';

import { Product, Order } from './types.ts';

function MainAppShell() {
  const { user, isLoading } = useAuth();

  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Modal State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [addEditModalOpen, setAddEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [stockModalType, setStockModalType] = useState<'IN' | 'OUT'>('IN');
  const [stockProduct, setStockProduct] = useState<Product | null>(null);

  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [restockProduct, setRestockProduct] = useState<any | null>(null);
  const [clearanceItem, setClearanceItem] = useState<any | null>(null);

  // Keyboard shortcut Ctrl+K / Cmd+K for universal search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-mono">Initializing SmartStock AI...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPages />;
  }

  const navigateTo = (tab: string, itemId?: string) => {
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-row">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onNavigate={navigateTo}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header
          currentTab={currentTab}
          onOpenSearch={() => setSearchOpen(true)}
          onNavigate={navigateTo}
          onToggleMobileSidebar={() => setMobileSidebarOpen((prev) => !prev)}
        />

        <main className="flex-1 pb-16">
          {currentTab === 'dashboard' && (
            <DashboardPage
              onNavigate={navigateTo}
              onOpenProductDetail={(p) => setSelectedProduct(p)}
              onOpenInvoice={(o) => setInvoiceOrder(o)}
              onOpenRestock={(p) => setRestockProduct(p)}
            />
          )}

          {currentTab === 'products' && (
            <ProductsPage
              onOpenProductDetail={(p) => setSelectedProduct(p)}
              onOpenAddProduct={() => {
                setEditingProduct(null);
                setAddEditModalOpen(true);
              }}
            />
          )}

          {currentTab === 'inventory' && (
            <InventoryPage
              onOpenAddProduct={() => {
                setEditingProduct(null);
                setAddEditModalOpen(true);
              }}
              onOpenEditProduct={(p) => {
                setEditingProduct(p);
                setAddEditModalOpen(true);
              }}
              onOpenStockInOut={(p, type) => {
                setStockProduct(p);
                setStockModalType(type);
                setStockModalOpen(true);
              }}
            />
          )}

          {currentTab === 'orders' && (
            <OrdersPage onOpenInvoice={(o) => setInvoiceOrder(o)} />
          )}

          {currentTab === 'cart' && (
            <CartPage
              onNavigate={navigateTo}
              onOpenInvoice={(o) => setInvoiceOrder(o)}
            />
          )}

          {currentTab === 'wishlist' && (
            <WishlistPage
              onNavigate={navigateTo}
              onOpenProductDetail={(p) => setSelectedProduct(p)}
            />
          )}

          {currentTab === 'sales' && <SalesPage />}

          {currentTab === 'predictions' && (
            <PredictionsPage onOpenRestock={(p) => setRestockProduct(p)} />
          )}

          {currentTab === 'expiry' && (
            <ExpiryPage onOpenDiscount={(item) => setClearanceItem(item)} />
          )}

          {currentTab === 'alerts' && <AlertsPage onNavigate={navigateTo} />}

          {currentTab === 'analytics' && <AnalyticsPage />}

          {currentTab === 'insights' && (
            <AiInsightsPage
              onNavigate={navigateTo}
              onOpenRestock={(p) => setRestockProduct(p)}
              onOpenDiscount={(item) => setClearanceItem(item)}
            />
          )}

          {currentTab === 'suppliers' && <SuppliersPage />}

          {currentTab === 'reports' && <ReportsPage />}

          {currentTab === 'users' && <UsersPage />}

          {currentTab === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* Global Modals */}
      <GlobalSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={navigateTo}
      />

      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onEdit={(p) => {
          setEditingProduct(p);
          setAddEditModalOpen(true);
        }}
      />

      <AddEditProductModal
        isOpen={addEditModalOpen}
        product={editingProduct}
        onClose={() => setAddEditModalOpen(false)}
        onSaved={() => {
          // Re-trigger current tab refresh if needed
        }}
      />

      <StockInOutModal
        isOpen={stockModalOpen}
        type={stockModalType}
        product={stockProduct}
        onClose={() => setStockModalOpen(false)}
        onSaved={() => {}}
      />

      <InvoiceModal
        order={invoiceOrder}
        onClose={() => setInvoiceOrder(null)}
      />

      <RestockOrderModal
        isOpen={!!restockProduct}
        product={restockProduct}
        onClose={() => setRestockProduct(null)}
        onSuccess={() => {}}
      />

      <ClearanceDiscountModal
        isOpen={!!clearanceItem}
        item={clearanceItem}
        onClose={() => setClearanceItem(null)}
        onSuccess={() => {}}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <NotificationProvider>
          <MainAppShell />
        </NotificationProvider>
      </CartProvider>
    </AuthProvider>
  );
}
