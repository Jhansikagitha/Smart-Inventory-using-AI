import {
  User,
  Product,
  InventoryItem,
  InventoryLog,
  Order,
  SaleRecord,
  PredictionOutput,
  ExpiryRecord,
  NotificationItem,
  AIInsight,
  Supplier,
  AnalyticsData,
} from '../types.ts';

const BASE_URL = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('smartstock_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const headers = { ...getAuthHeaders(), ...options.headers };

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (error: any) {
    console.error(`API request error on ${endpoint}:`, error);
    throw error;
  }
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  register: (data: { name: string; email: string; phone?: string; password: string; confirmPassword?: string }) =>
    request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getCurrentUser: () => request<{ user: User }>('/auth/me'),

  forgotPassword: (email: string) =>
    request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  // Products
  getProducts: (params?: { category?: string; stockStatus?: string; search?: string; sort?: string }) => {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.stockStatus) query.append('stockStatus', params.stockStatus);
    if (params?.search) query.append('search', params.search);
    if (params?.sort) query.append('sort', params.sort);
    return request<Product[]>(`/products?${query.toString()}`);
  },

  getProductById: (id: string) => request<Product>(`/products/${id}`),

  createProduct: (productData: Partial<Product>) =>
    request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    }),

  updateProduct: (id: string, updates: Partial<Product>) =>
    request<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  deleteProduct: (id: string) =>
    request<{ message: string }>(`/products/${id}`, {
      method: 'DELETE',
    }),

  toggleWishlist: (productId: string) =>
    request<{ productId: string; isWishlisted: boolean }>(`/products/${productId}/wishlist`, {
      method: 'POST',
    }),

  // Inventory
  getInventory: () => request<InventoryItem[]>('/inventory'),
  getInventoryLogs: () => request<InventoryLog[]>('/inventory/logs'),

  stockIn: (id: string, data: { quantity: number; unitCost?: number; supplierName?: string; reason?: string }) =>
    request<Product>(`/inventory/${id}/stock-in`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  stockOut: (id: string, data: { quantity: number; reason?: string }) =>
    request<Product>(`/inventory/${id}/stock-out`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  bulkImport: (items: any[]) =>
    request<{ importedCount: number; products: Product[] }>('/inventory/bulk-import', {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),

  // Orders
  getOrders: (params?: { search?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
    return request<Order[]>(`/orders?${query.toString()}`);
  },

  createOrder: (orderData: {
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    paymentMethod: string;
    items: { productId: string; quantity: number }[];
  }) =>
    request<{ order: Order; sale: SaleRecord }>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    }),

  updateOrderStatus: (id: string, status: Order['orderStatus']) =>
    request<Order>(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  // Sales
  getSales: () =>
    request<{
      metrics: {
        todayRevenue: number;
        weeklyRevenue: number;
        monthlyRevenue: number;
        totalRevenue: number;
        totalTransactions: number;
        averageOrderValue: number;
      };
      sales: SaleRecord[];
    }>('/sales'),

  // AI Demand Predictions
  getPredictions: () =>
    request<{
      summary: {
        totalProjectedDemand7d: number;
        totalRestockRecommended: number;
        highRiskCount: number;
        averageConfidence: number;
      };
      predictions: PredictionOutput[];
    }>('/predictions'),

  recalculatePredictions: () =>
    request<{ message: string; timestamp: string; predictions: PredictionOutput[] }>('/predictions/recalculate', {
      method: 'POST',
    }),

  // Expiry
  getExpiryRecords: () =>
    request<{
      summary: {
        expiredCount: number;
        expiring7dCount: number;
        totalAtRiskValue: number;
      };
      records: ExpiryRecord[];
    }>('/expiry'),

  applyClearanceDiscount: (id: string, discountPercent: number) =>
    request<{ message: string; product: Product }>(`/expiry/${id}/discount`, {
      method: 'POST',
      body: JSON.stringify({ discountPercent }),
    }),

  removeExpiredStock: (id: string) =>
    request<{ message: string }>(`/expiry/${id}/remove`, {
      method: 'POST',
    }),

  // Alerts & Notifications
  getAlerts: () => request<{ unreadCount: number; notifications: NotificationItem[] }>('/alerts'),
  markAlertRead: (id: string) => request<{ success: boolean }>(`/alerts/${id}/read`, { method: 'PUT' }),
  markAllAlertsRead: () => request<{ success: boolean }>('/alerts/mark-all-read', { method: 'POST' }),
  dismissAlert: (id: string) => request<{ success: boolean }>(`/alerts/${id}`, { method: 'DELETE' }),

  // Analytics
  getAnalytics: (timeframe: 'today' | '7d' | '30d' | '3m' | '1y' = '30d') =>
    request<AnalyticsData>(`/analytics?timeframe=${timeframe}`),

  // AI Insights
  getInsights: () => request<AIInsight[]>('/insights'),
  resolveInsight: (id: string) => request<{ success: boolean }>(`/insights/${id}/resolve`, { method: 'POST' }),

  // Suppliers
  getSuppliers: () => request<Supplier[]>('/suppliers'),
  createSupplier: (data: Partial<Supplier>) =>
    request<Supplier>('/suppliers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateSupplier: (id: string, updates: Partial<Supplier>) =>
    request<Supplier>(`/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  deleteSupplier: (id: string) =>
    request<{ message: string }>(`/suppliers/${id}`, {
      method: 'DELETE',
    }),

  // Admin Users
  getUsers: () => request<User[]>('/users'),
  updateUserRole: (id: string, role: 'admin' | 'staff', status?: 'active' | 'inactive') =>
    request<User>(`/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role, status }),
    }),

  // Search
  universalSearch: (query: string) =>
    request<{
      products: Product[];
      orders: Order[];
      suppliers: Supplier[];
      sales: SaleRecord[];
    }>(`/search?q=${encodeURIComponent(query)}`),

  // Reports
  getReport: (type: 'sales' | 'inventory' | 'expiry' | 'low-stock' | 'predictions') =>
    request<{ title: string; generatedAt: string; data: any[] }>(`/reports/${type}`),
};
