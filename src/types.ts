export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'staff';
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  cost: number;
  quantity: number;
  reorderLevel: number;
  supplierId: string;
  supplierName: string;
  batchNumber: string;
  expiryDate: string;
  rating: number;
  image: string;
  description: string;
  isWishlisted?: boolean;
}

export interface InventoryItem extends Product {
  totalValue: number;
  totalCost: number;
  stockStatus: 'In Stock' | 'Low Stock' | 'Critical' | 'Out of Stock';
}

export interface InventoryLog {
  id: string;
  productId: string;
  productName: string;
  type: 'IN' | 'OUT' | 'SALE' | 'ADJUSTMENT';
  quantity: number;
  balanceAfter: number;
  unitPrice: number;
  reason: string;
  batchNumber: string;
  date: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  paymentMethod: 'Cash' | 'Credit Card' | 'UPI / Bank Transfer' | 'Store Credit';
  paymentStatus: 'Paid' | 'Pending';
  orderStatus: 'Pending' | 'Confirmed' | 'Processing' | 'Completed' | 'Cancelled';
  subtotal: number;
  tax: number;
  totalAmount: number;
  date: string;
  items: OrderItem[];
}

export interface SaleRecord {
  id: string;
  saleNumber: string;
  orderId: string;
  customerName: string;
  totalAmount: number;
  profit: number;
  paymentMethod: string;
  date: string;
  itemCount: number;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    unitCost: number;
    subtotal: number;
  }[];
}

export interface PredictionOutput {
  productId: string;
  productName: string;
  sku: string;
  category: string;
  currentStock: number;
  reorderLevel: number;
  unitPrice: number;
  unitCost: number;
  historical7dSales: number;
  historical30dSales: number;
  predicted7dDemand: number;
  predicted30dDemand: number;
  recommendedRestock: number;
  demandTrend: 'High' | 'Stable' | 'Declining';
  confidenceScore: number;
  stockCoverDays: number;
  stockoutRisk: 'Critical' | 'Warning' | 'Low';
  aiRecommendation: string;
  dailyForecast: { day: string; predicted: number; actual?: number }[];
}

export interface ExpiryRecord {
  productId: string;
  productName: string;
  sku: string;
  category: string;
  batchNumber: string;
  quantity: number;
  price: number;
  cost: number;
  expiryDate: string;
  daysRemaining: number;
  status: 'Expired' | 'Expiring Today' | 'Expiring in 3 Days' | 'Expiring in 7 Days' | 'Safe';
  recommendation: string;
  atRiskValue: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'critical' | 'warning' | 'insight';
  category: 'stock' | 'expiry' | 'demand' | 'order';
  productId?: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}

export interface AIInsight {
  id: string;
  title: string;
  reason: string;
  severity: 'CRITICAL' | 'RECOMMENDED' | 'OPTIMIZATION' | 'OPPORTUNITY';
  recommendedAction: string;
  actionType: 'restock' | 'discount' | 'transfer' | 'bundle';
  relatedProductId?: string;
  relatedProductName?: string;
  expectedImpact: string;
  resolved: boolean;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  categories: string[];
  totalPurchases: number;
  rating: number;
  leadTimeDays: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface AnalyticsData {
  timeframe: string;
  totalRevenue: number;
  totalProfit: number;
  profitMargin: number;
  totalTransactions: number;
  aov: number;
  totalInventoryValue: number;
  totalInventoryCost: number;
  totalUnitsInStock: number;
  totalProducts: number;
  outOfStockCount: number;
  lowStockCount: number;
  salesTimeline: { date: string; revenue: number; profit: number; orders: number }[];
  categoriesList: { category: string; productCount: number; inventoryValue: number; totalUnits: number }[];
  topSelling: { id: string; name: string; qty: number; revenue: number }[];
  slowMoving: { id: string; name: string; quantityInStock: number; valueTiedUp: number }[];
}
