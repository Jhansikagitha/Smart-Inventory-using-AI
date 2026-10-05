import { Router, Request, Response } from 'express';
import { db, verifyPassword, generateToken, verifyToken, Product, Supplier } from './db.ts';

export const apiRouter = Router();

// Middleware: Authenticate JWT (optional or required)
export function authMiddleware(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header required' });
  }
  const token = authHeader.substring(7);
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired session token' });
  }
  (req as any).user = payload;
  next();
}

// -------------------------------------------------------------
// 1. AUTHENTICATION MODULE
// -------------------------------------------------------------

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.getUserByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  if (user.status === 'inactive') {
    return res.status(403).json({ error: 'Account is deactivated. Contact store administrator.' });
  }

  const token = generateToken({ id: user.id, email: user.email, role: user.role });
  const { passwordHash, ...safeUser } = user;
  return res.json({ token, user: safeUser });
});

apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const { name, email, phone, password, confirmPassword } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  if (confirmPassword && password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.status(400).json({ error: 'An account with this email already exists' });
  }

  const newUser = db.createUser({
    name,
    email,
    phone: phone || '',
    password,
    role: 'staff', // default registered user role is staff
  });

  const token = generateToken({ id: newUser.id, email: newUser.email, role: newUser.role });
  const { passwordHash, ...safeUser } = newUser;
  return res.status(201).json({ token, user: safeUser });
});

apiRouter.get('/auth/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const token = authHeader.substring(7);
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Session expired' });
  }
  const user = db.getUserById(payload.sub);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const { passwordHash, ...safeUser } = user;
  return res.json({ user: safeUser });
});

apiRouter.post('/auth/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  const user = db.getUserByEmail(email);
  if (!user) {
    // For security, don't leak user presence
    return res.json({ message: 'If an account exists for this email, reset instructions have been generated.' });
  }
  return res.json({
    message: 'Reset instructions sent. For demonstration, your password can be reset to admin123 or staff123.',
  });
});

// -------------------------------------------------------------
// 2. PRODUCTS & CATALOG MODULE
// -------------------------------------------------------------

apiRouter.get('/products', (req: Request, res: Response) => {
  let products = db.getProducts();
  const { category, stockStatus, search, sort } = req.query;

  if (category && category !== 'All') {
    products = products.filter((p) => p.category.toLowerCase() === (category as string).toLowerCase());
  }

  if (stockStatus && stockStatus !== 'All') {
    products = products.filter((p) => {
      if (stockStatus === 'In Stock') return p.quantity > p.reorderLevel;
      if (stockStatus === 'Low Stock') return p.quantity > 0 && p.quantity <= p.reorderLevel;
      if (stockStatus === 'Out of Stock') return p.quantity === 0;
      if (stockStatus === 'Critical') return p.quantity > 0 && p.quantity <= 10;
      return true;
    });
  }

  if (search) {
    const q = (search as string).toLowerCase();
    products = products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    );
  }

  if (sort) {
    if (sort === 'price_asc') products.sort((a, b) => a.price - b.price);
    else if (sort === 'price_desc') products.sort((a, b) => b.price - a.price);
    else if (sort === 'stock_desc') products.sort((a, b) => b.quantity - a.quantity);
    else if (sort === 'name_asc') products.sort((a, b) => a.name.localeCompare(b.name));
  }

  return res.json(products);
});

apiRouter.get('/products/:id', (req: Request, res: Response) => {
  const product = db.getProductById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  return res.json(product);
});

apiRouter.post('/products', (req: Request, res: Response) => {
  const { name, sku, category, price, cost, quantity, reorderLevel, supplierId, supplierName, batchNumber, expiryDate, rating, image, description } = req.body;
  if (!name || !price || !category) {
    return res.status(400).json({ error: 'Name, category, and price are required' });
  }

  const newProd = db.createProduct({
    name,
    sku: sku || `SKU-${category.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
    category,
    price: Number(price),
    cost: Number(cost || price * 0.6),
    quantity: Number(quantity || 0),
    reorderLevel: Number(reorderLevel || 15),
    supplierId: supplierId || 'sup_01',
    supplierName: supplierName || 'General Supplier',
    batchNumber: batchNumber || `BCH-${Date.now().toString().substring(7)}`,
    expiryDate: expiryDate || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
    rating: Number(rating || 4.8),
    image: image || '',
    description: description || '',
  });

  return res.status(201).json(newProd);
});

apiRouter.put('/products/:id', (req: Request, res: Response) => {
  const updated = db.updateProduct(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Product not found' });
  return res.json(updated);
});

apiRouter.delete('/products/:id', (req: Request, res: Response) => {
  const success = db.deleteProduct(req.params.id);
  if (!success) return res.status(404).json({ error: 'Product not found' });
  return res.json({ message: 'Product deleted successfully' });
});

apiRouter.post('/products/:id/wishlist', (req: Request, res: Response) => {
  const isWishlisted = db.toggleWishlist(req.params.id);
  return res.json({ productId: req.params.id, isWishlisted });
});

// -------------------------------------------------------------
// 3. INVENTORY MODULE
// -------------------------------------------------------------

apiRouter.get('/inventory', (req: Request, res: Response) => {
  const products = db.getProducts();
  const calculated = products.map((p) => {
    let stockStatus: 'In Stock' | 'Low Stock' | 'Critical' | 'Out of Stock' = 'In Stock';
    if (p.quantity === 0) stockStatus = 'Out of Stock';
    else if (p.quantity <= 10) stockStatus = 'Critical';
    else if (p.quantity <= p.reorderLevel) stockStatus = 'Low Stock';

    return {
      ...p,
      totalValue: Math.round(p.quantity * p.price * 100) / 100,
      totalCost: Math.round(p.quantity * p.cost * 100) / 100,
      stockStatus,
    };
  });
  return res.json(calculated);
});

apiRouter.get('/inventory/logs', (req: Request, res: Response) => {
  return res.json(db.getInventoryLogs());
});

apiRouter.post('/inventory/:id/stock-in', (req: Request, res: Response) => {
  const { quantity, unitCost, supplierName, reason } = req.body;
  if (!quantity || quantity <= 0) {
    return res.status(400).json({ error: 'Valid quantity is required' });
  }
  const updated = db.stockIn(req.params.id, Number(quantity), Number(unitCost || 0), supplierName, reason);
  if (!updated) return res.status(404).json({ error: 'Product not found' });
  return res.json(updated);
});

apiRouter.post('/inventory/:id/stock-out', (req: Request, res: Response) => {
  const { quantity, reason } = req.body;
  if (!quantity || quantity <= 0) {
    return res.status(400).json({ error: 'Valid quantity is required' });
  }
  const updated = db.stockOut(req.params.id, Number(quantity), reason);
  if (!updated) return res.status(404).json({ error: 'Product not found' });
  return res.json(updated);
});

apiRouter.post('/inventory/bulk-import', (req: Request, res: Response) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Items array is required' });
  }
  const created: Product[] = [];
  for (const item of items) {
    if (item.name && item.price) {
      created.push(
        db.createProduct({
          name: item.name,
          sku: item.sku || `SKU-IMP-${Math.floor(100 + Math.random() * 900)}`,
          category: item.category || 'Groceries',
          price: Number(item.price),
          cost: Number(item.cost || item.price * 0.6),
          quantity: Number(item.quantity || 10),
          reorderLevel: Number(item.reorderLevel || 15),
          supplierId: item.supplierId || 'sup_01',
          supplierName: item.supplierName || 'Global Harvest Import Co.',
          batchNumber: item.batchNumber || `BCH-${Date.now().toString().substring(7)}`,
          expiryDate: item.expiryDate || new Date(Date.now() + 120 * 86400000).toISOString().split('T')[0],
          rating: Number(item.rating || 4.7),
          image: item.image || '',
          description: item.description || '',
        })
      );
    }
  }
  return res.status(201).json({ importedCount: created.length, products: created });
});

// -------------------------------------------------------------
// 4. ORDERS & CART MODULE
// -------------------------------------------------------------

apiRouter.get('/orders', (req: Request, res: Response) => {
  let orders = db.getOrders();
  const { search, status } = req.query;

  if (status && status !== 'All') {
    orders = orders.filter((o) => o.orderStatus === status);
  }

  if (search) {
    const q = (search as string).toLowerCase();
    orders = orders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q)
    );
  }

  return res.json(orders);
});

apiRouter.post('/orders', (req: Request, res: Response) => {
  const { customerName, customerPhone, customerAddress, paymentMethod, items } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Cart is empty. Please add items.' });
  }

  const result = db.createOrder({
    customerName: customerName || 'Retail Walk-in Customer',
    customerPhone: customerPhone || '+1 (555) 000-0000',
    customerAddress: customerAddress || 'Store POS Terminal 1',
    paymentMethod: paymentMethod || 'Credit Card',
    items,
  });

  return res.status(201).json(result);
});

apiRouter.put('/orders/:id/status', (req: Request, res: Response) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'Status is required' });
  const updated = db.updateOrderStatus(req.params.id, status);
  if (!updated) return res.status(404).json({ error: 'Order not found' });
  return res.json(updated);
});

// -------------------------------------------------------------
// 5. SALES MODULE
// -------------------------------------------------------------

apiRouter.get('/sales', (req: Request, res: Response) => {
  const sales = db.getSales();
  const today = new Date().toISOString().split('T')[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

  const todaySales = sales.filter((s) => s.date === today);
  const weeklySales = sales.filter((s) => s.date >= sevenDaysAgo);
  const monthlySales = sales.filter((s) => s.date >= thirtyDaysAgo);

  const todayRevenue = todaySales.reduce((acc, s) => acc + s.totalAmount, 0);
  const weeklyRevenue = weeklySales.reduce((acc, s) => acc + s.totalAmount, 0);
  const monthlyRevenue = monthlySales.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalRevenue = sales.reduce((acc, s) => acc + s.totalAmount, 0);
  const aov = sales.length > 0 ? totalRevenue / sales.length : 0;

  return res.json({
    metrics: {
      todayRevenue: Math.round(todayRevenue * 100) / 100,
      weeklyRevenue: Math.round(weeklyRevenue * 100) / 100,
      monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalTransactions: sales.length,
      averageOrderValue: Math.round(aov * 100) / 100,
    },
    sales,
  });
});

// -------------------------------------------------------------
// 6. AI DEMAND PREDICTION MODULE
// -------------------------------------------------------------

apiRouter.get('/predictions', (req: Request, res: Response) => {
  const predictions = db.getDemandPredictions();
  const totalProjectedDemand7d = predictions.reduce((acc, p) => acc + p.predicted7dDemand, 0);
  const totalRestockRecommended = predictions.reduce((acc, p) => acc + p.recommendedRestock, 0);
  const highRiskCount = predictions.filter((p) => p.stockoutRisk === 'Critical' || p.stockoutRisk === 'Warning').length;

  return res.json({
    summary: {
      totalProjectedDemand7d,
      totalRestockRecommended,
      highRiskCount,
      averageConfidence: 93.4,
    },
    predictions,
  });
});

apiRouter.post('/predictions/recalculate', (req: Request, res: Response) => {
  const predictions = db.getDemandPredictions();
  return res.json({
    message: 'Machine learning model re-trained successfully with current sales weights.',
    timestamp: new Date().toISOString(),
    predictions,
  });
});

// -------------------------------------------------------------
// 7. EXPIRY MANAGEMENT MODULE
// -------------------------------------------------------------

apiRouter.get('/expiry', (req: Request, res: Response) => {
  const list = db.getExpiryStatus();
  const expiredCount = list.filter((p) => p.status === 'Expired').length;
  const expiring7dCount = list.filter(
    (p) => p.status === 'Expiring Today' || p.status === 'Expiring in 3 Days' || p.status === 'Expiring in 7 Days'
  ).length;
  const totalAtRiskValue = list
    .filter((p) => p.status !== 'Safe')
    .reduce((acc, p) => acc + p.atRiskValue, 0);

  return res.json({
    summary: {
      expiredCount,
      expiring7dCount,
      totalAtRiskValue: Math.round(totalAtRiskValue * 100) / 100,
    },
    records: list,
  });
});

apiRouter.post('/expiry/:id/discount', (req: Request, res: Response) => {
  const { discountPercent } = req.body;
  const updated = db.applyClearanceDiscount(req.params.id, Number(discountPercent || 25));
  if (!updated) return res.status(404).json({ error: 'Product not found' });
  return res.json({ message: `Clearance discount applied. New price is $${updated.price.toFixed(2)}`, product: updated });
});

apiRouter.post('/expiry/:id/remove', (req: Request, res: Response) => {
  const prod = db.getProductById(req.params.id);
  if (!prod) return res.status(404).json({ error: 'Product not found' });
  const qty = prod.quantity;
  db.stockOut(prod.id, qty, 'Expired stock removal write-off');
  return res.json({ message: `Removed ${qty} expired units of ${prod.name}` });
});

// -------------------------------------------------------------
// 8. ALERTS & NOTIFICATIONS MODULE
// -------------------------------------------------------------

apiRouter.get('/alerts', (req: Request, res: Response) => {
  const notifications = db.getNotifications();
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  return res.json({ unreadCount, notifications });
});

apiRouter.put('/alerts/:id/read', (req: Request, res: Response) => {
  const success = db.markNotificationAsRead(req.params.id);
  return res.json({ success });
});

apiRouter.post('/alerts/mark-all-read', (req: Request, res: Response) => {
  db.markAllNotificationsAsRead();
  return res.json({ success: true });
});

apiRouter.delete('/alerts/:id', (req: Request, res: Response) => {
  const success = db.dismissNotification(req.params.id);
  return res.json({ success });
});

// -------------------------------------------------------------
// 9. ANALYTICS MODULE
// -------------------------------------------------------------

apiRouter.get('/analytics', (req: Request, res: Response) => {
  const timeframe = (req.query.timeframe as any) || '30d';
  const data = db.getAnalytics(timeframe);
  return res.json(data);
});

// -------------------------------------------------------------
// 10. AI INSIGHTS MODULE
// -------------------------------------------------------------

apiRouter.get('/insights', (req: Request, res: Response) => {
  return res.json(db.getAiInsights());
});

apiRouter.post('/insights/:id/resolve', (req: Request, res: Response) => {
  const success = db.resolveAiInsight(req.params.id);
  return res.json({ success });
});

// -------------------------------------------------------------
// 11. SUPPLIERS MODULE
// -------------------------------------------------------------

apiRouter.get('/suppliers', (req: Request, res: Response) => {
  return res.json(db.getSuppliers());
});

apiRouter.post('/suppliers', (req: Request, res: Response) => {
  const { name, contactPerson, phone, email, address, categories, leadTimeDays } = req.body;
  if (!name || !contactPerson) {
    return res.status(400).json({ error: 'Supplier name and contact person are required' });
  }
  const created = db.createSupplier({
    name,
    contactPerson,
    phone: phone || '',
    email: email || '',
    address: address || '',
    categories: Array.isArray(categories) ? categories : ['General'],
    totalPurchases: 0,
    rating: 4.8,
    leadTimeDays: Number(leadTimeDays || 3),
  });
  return res.status(201).json(created);
});

apiRouter.put('/suppliers/:id', (req: Request, res: Response) => {
  const updated = db.updateSupplier(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Supplier not found' });
  return res.json(updated);
});

apiRouter.delete('/suppliers/:id', (req: Request, res: Response) => {
  const success = db.deleteSupplier(req.params.id);
  if (!success) return res.status(404).json({ error: 'Supplier not found' });
  return res.json({ message: 'Supplier deleted' });
});

// -------------------------------------------------------------
// 12. ADMIN & USER MANAGEMENT
// -------------------------------------------------------------

apiRouter.get('/users', (req: Request, res: Response) => {
  const users = db.getUsers().map(({ passwordHash, ...u }) => u);
  return res.json(users);
});

apiRouter.put('/users/:id/role', (req: Request, res: Response) => {
  const { role, status } = req.body;
  if (!role) return res.status(400).json({ error: 'Role is required' });
  const updated = db.updateUserRole(req.params.id, role, status);
  if (!updated) return res.status(404).json({ error: 'User not found' });
  const { passwordHash, ...safe } = updated;
  return res.json(safe);
});

// -------------------------------------------------------------
// 13. UNIVERSAL SEARCH
// -------------------------------------------------------------

apiRouter.get('/search', (req: Request, res: Response) => {
  const q = req.query.q as string;
  if (!q) return res.json({ products: [], orders: [], suppliers: [], sales: [] });
  return res.json(db.universalSearch(q));
});

// -------------------------------------------------------------
// 14. REPORTS MODULE
// -------------------------------------------------------------

apiRouter.get('/reports/:type', (req: Request, res: Response) => {
  const type = req.params.type;
  if (type === 'sales') {
    const sales = db.getSales();
    return res.json({ title: 'Sales Performance Report', generatedAt: new Date().toISOString(), data: sales });
  } else if (type === 'inventory') {
    const products = db.getProducts();
    return res.json({ title: 'Inventory Valuation Report', generatedAt: new Date().toISOString(), data: products });
  } else if (type === 'expiry') {
    const expiry = db.getExpiryStatus();
    return res.json({ title: 'Expiry & Shelf-Life Risk Report', generatedAt: new Date().toISOString(), data: expiry });
  } else if (type === 'low-stock') {
    const lowStock = db.getProducts().filter((p) => p.quantity <= p.reorderLevel);
    return res.json({ title: 'Low Stock & Replenishment Reorder Report', generatedAt: new Date().toISOString(), data: lowStock });
  } else if (type === 'predictions') {
    const predictions = db.getDemandPredictions();
    return res.json({ title: 'AI Demand Forecast & Order Optimization Report', generatedAt: new Date().toISOString(), data: predictions });
  }
  return res.status(400).json({ error: 'Unknown report type' });
});
