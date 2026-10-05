import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { calculateDemandPrediction, PredictionOutput } from './aiEngine.ts';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
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
  expiryDate: string; // YYYY-MM-DD
  rating: number;
  image: string;
  description: string;
  isWishlisted?: boolean;
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

export interface HistoricalSale {
  productId: string;
  date: string;
  quantity: number;
  revenue: number;
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

export interface DatabaseSchema {
  users: User[];
  products: Product[];
  suppliers: Supplier[];
  inventoryLogs: InventoryLog[];
  orders: Order[];
  sales: SaleRecord[];
  notifications: NotificationItem[];
  historicalSales: HistoricalSale[];
  aiInsights: AIInsight[];
  wishlist: string[]; // product IDs
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'smartstock_db.json');

// Password helper using PBKDF2
export function hashPassword(password: string): string {
  const salt = 'smartstock_salt_retail_2026';
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// Generate simple secure JWT simulation
export function generateToken(user: { id: string; email: string; role: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + 86400 * 7,
    })
  ).toString('base64url');
  const secret = 'smartstock_jwt_secret_key_super_secure_2026';
  const signature = crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

export function verifyToken(token: string): { sub: string; email: string; role: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;
    const secret = 'smartstock_jwt_secret_key_super_secure_2026';
    const expectedSig = crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
    if (expectedSig !== signature) return null;
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    if (parsed.exp < Math.floor(Date.now() / 1000)) return null;
    return parsed;
  } catch {
    return null;
  }
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadOrSeed();
  }

  private loadOrSeed(): DatabaseSchema {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      } catch (err) {
        console.error('Failed reading DB, reseeding:', err);
      }
    }

    const seeded = this.createSeedData();
    this.save(seeded);
    return seeded;
  }

  private save(dataToSave?: DatabaseSchema) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave || this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving database:', err);
    }
  }

  private createSeedData(): DatabaseSchema {
    const now = new Date();
    const dateStr = (daysOffset: number) => {
      const d = new Date(now.getTime() + daysOffset * 86400000);
      return d.toISOString().split('T')[0];
    };

    // Pre-seeded Users
    const users: User[] = [
      {
        id: 'usr_admin_01',
        name: 'Sarah Jenkins (Store Admin)',
        email: 'admin@smartstock.io',
        phone: '+1 (555) 234-8901',
        passwordHash: hashPassword('admin123'),
        role: 'admin',
        status: 'active',
        createdAt: dateStr(-120),
      },
      {
        id: 'usr_staff_01',
        name: 'David Miller (Inventory Specialist)',
        email: 'staff@smartstock.io',
        phone: '+1 (555) 789-4321',
        passwordHash: hashPassword('staff123'),
        role: 'staff',
        status: 'active',
        createdAt: dateStr(-90),
      },
    ];

    // Pre-seeded Suppliers
    const suppliers: Supplier[] = [
      {
        id: 'sup_01',
        name: 'GreenValley Organic Farms',
        contactPerson: 'Marcus Vance',
        phone: '+1 (555) 111-2233',
        email: 'orders@greenvalleyfarms.com',
        address: '445 Rural Meadow Rd, Sonoma, CA',
        categories: ['Dairy', 'Groceries'],
        totalPurchases: 42800,
        rating: 4.9,
        leadTimeDays: 2,
      },
      {
        id: 'sup_02',
        name: 'Global Harvest Import Co.',
        contactPerson: 'Priya Sharma',
        phone: '+1 (555) 333-4455',
        email: 'supply@globalharvest.net',
        address: '890 Harbor Way, Newark, NJ',
        categories: ['Groceries', 'Snacks'],
        totalPurchases: 68400,
        rating: 4.8,
        leadTimeDays: 5,
      },
      {
        id: 'sup_03',
        name: 'PureBotanics Naturals',
        contactPerson: 'Elena Rostova',
        phone: '+1 (555) 555-6677',
        email: 'accounts@purebotanics.com',
        address: '12 Evergreen Blvd, Portland, OR',
        categories: ['Personal Care', 'Household'],
        totalPurchases: 29500,
        rating: 4.7,
        leadTimeDays: 3,
      },
      {
        id: 'sup_04',
        name: 'Apex Beverage Distributors',
        contactPerson: 'Lucas Bennett',
        phone: '+1 (555) 777-8899',
        email: 'sales@apexbeverages.com',
        address: '300 Commerce Dr, Austin, TX',
        categories: ['Beverages'],
        totalPurchases: 34100,
        rating: 4.6,
        leadTimeDays: 2,
      },
    ];

    // Pre-seeded realistic retail products using generated images
    const products: Product[] = [
      {
        id: 'prod_01',
        name: 'Organic Farm Whole Milk (500ml)',
        sku: 'SKU-DRY-010',
        category: 'Dairy',
        price: 2.49,
        cost: 1.4,
        quantity: 28,
        reorderLevel: 30,
        supplierId: 'sup_01',
        supplierName: 'GreenValley Organic Farms',
        batchNumber: 'BCH-2026-DRY09',
        expiryDate: dateStr(4), // Expiring in 4 days!
        rating: 4.9,
        image: '/src/assets/images/dairy_fresh_milk_1791208770278.jpg',
        description: 'Pasture-raised, non-homogenized whole milk with natural cream top. Farm fresh daily delivery.',
      },
      {
        id: 'prod_02',
        name: 'Royal Basmati Rice (5kg Bag)',
        sku: 'SKU-GRC-021',
        category: 'Groceries',
        price: 14.99,
        cost: 9.5,
        quantity: 35,
        reorderLevel: 25,
        supplierId: 'sup_02',
        supplierName: 'Global Harvest Import Co.',
        batchNumber: 'BCH-2026-GRC44',
        expiryDate: dateStr(180),
        rating: 4.8,
        image: '/src/assets/images/grocery_organic_rice_1791208786965.jpg',
        description: 'Aged Himalayan long-grain aromatic basmati rice. Slender grains, perfect fluffy texture.',
      },
      {
        id: 'prod_03',
        name: 'Artisanal Butter Shortbread Biscuits (250g)',
        sku: 'SKU-SNK-035',
        category: 'Snacks',
        price: 3.99,
        cost: 2.1,
        quantity: 64,
        reorderLevel: 20,
        supplierId: 'sup_02',
        supplierName: 'Global Harvest Import Co.',
        batchNumber: 'BCH-2026-SNK12',
        expiryDate: dateStr(45),
        rating: 4.7,
        image: '/src/assets/images/snack_artisan_biscuits_1791208802358.jpg',
        description: 'Traditional slow-baked golden shortbread biscuits with pure creamery butter and sea salt.',
      },
      {
        id: 'prod_04',
        name: 'Cold Pressed Pure Citrus Juice (1L)',
        sku: 'SKU-BEV-042',
        category: 'Beverages',
        price: 4.5,
        cost: 2.6,
        quantity: 8,
        reorderLevel: 20,
        supplierId: 'sup_04',
        supplierName: 'Apex Beverage Distributors',
        batchNumber: 'BCH-2026-BEV19',
        expiryDate: dateStr(6), // Expiring in 6 days!
        rating: 4.8,
        image: '/src/assets/images/beverage_citrus_juice_1791208816352.jpg',
        description: '100% freshly squeezed Valencia oranges with pulp. Never from concentrate, rich in Vitamin C.',
      },
      {
        id: 'prod_05',
        name: 'Botanical Olive Oil Soap Bar (200g)',
        sku: 'SKU-PER-055',
        category: 'Personal Care',
        price: 5.99,
        cost: 2.8,
        quantity: 82,
        reorderLevel: 15,
        supplierId: 'sup_03',
        supplierName: 'PureBotanics Naturals',
        batchNumber: 'BCH-2026-PER08',
        expiryDate: dateStr(360),
        rating: 4.9,
        image: '/src/assets/images/personal_care_olive_soap_1791208834857.jpg',
        description: 'Cold-saponified Greek extra virgin olive oil soap enriched with chamomile extracts.',
      },
      {
        id: 'prod_06',
        name: 'Pure Refined Cane Sugar (1kg)',
        sku: 'SKU-GRC-012',
        category: 'Groceries',
        price: 2.19,
        cost: 1.2,
        quantity: 0, // OUT OF STOCK!
        reorderLevel: 40,
        supplierId: 'sup_02',
        supplierName: 'Global Harvest Import Co.',
        batchNumber: 'BCH-2026-GRC10',
        expiryDate: dateStr(240),
        rating: 4.5,
        image: '',
        description: 'Ultra-fine granulated pure cane sugar for daily tea, coffee, and home confectionery.',
      },
      {
        id: 'prod_07',
        name: 'Cold Brew Arabica Whole Beans (500g)',
        sku: 'SKU-BEV-088',
        category: 'Beverages',
        price: 12.5,
        cost: 7.2,
        quantity: 42,
        reorderLevel: 18,
        supplierId: 'sup_04',
        supplierName: 'Apex Beverage Distributors',
        batchNumber: 'BCH-2026-BEV31',
        expiryDate: dateStr(90),
        rating: 4.9,
        image: '',
        description: 'Single-origin Ethiopian Yirgacheffe medium-dark roast with chocolate and berry undertones.',
      },
      {
        id: 'prod_08',
        name: 'Greek Style Plain Yogurt (400g)',
        sku: 'SKU-DRY-015',
        category: 'Dairy',
        price: 3.29,
        cost: 1.8,
        quantity: 14,
        reorderLevel: 25,
        supplierId: 'sup_01',
        supplierName: 'GreenValley Organic Farms',
        batchNumber: 'BCH-2026-DRY22',
        expiryDate: dateStr(2), // Expiring in 2 days!
        rating: 4.7,
        image: '',
        description: 'Triple-strained whole milk probiotic Greek yogurt. Extra thick, high protein, zero additives.',
      },
      {
        id: 'prod_09',
        name: 'Sea Salt Roasted Almonds (200g)',
        sku: 'SKU-SNK-044',
        category: 'Snacks',
        price: 6.49,
        cost: 3.7,
        quantity: 55,
        reorderLevel: 20,
        supplierId: 'sup_02',
        supplierName: 'Global Harvest Import Co.',
        batchNumber: 'BCH-2026-SNK50',
        expiryDate: dateStr(120),
        rating: 4.6,
        image: '',
        description: 'Californian whole nonpareil almonds dry-roasted to perfection with fine sea salt crystals.',
      },
      {
        id: 'prod_10',
        name: 'Eco Dishwashing Liquid Citrus (750ml)',
        sku: 'SKU-HSH-003',
        category: 'Household',
        price: 4.25,
        cost: 2.1,
        quantity: 38,
        reorderLevel: 15,
        supplierId: 'sup_03',
        supplierName: 'PureBotanics Naturals',
        batchNumber: 'BCH-2026-HSH04',
        expiryDate: dateStr(300),
        rating: 4.7,
        image: '',
        description: 'Plant-powered degreasing formula with organic lemon rind extract. Biodegradable and gentle.',
      },
      {
        id: 'prod_11',
        name: 'Multipurpose Surface Sanitizer (500ml)',
        sku: 'SKU-HSH-008',
        category: 'Household',
        price: 4.99,
        cost: 2.4,
        quantity: 19,
        reorderLevel: 20,
        supplierId: 'sup_03',
        supplierName: 'PureBotanics Naturals',
        batchNumber: 'BCH-2026-HSH12',
        expiryDate: dateStr(200),
        rating: 4.8,
        image: '',
        description: 'Hospital grade 99.9% antibacterial and antiviral surface cleaner with tea tree oil scent.',
      },
      {
        id: 'prod_12',
        name: 'Artisan Sourdough Loaf (600g)',
        sku: 'SKU-GRC-007',
        category: 'Groceries',
        price: 5.5,
        cost: 2.8,
        quantity: 5,
        reorderLevel: 12,
        supplierId: 'sup_01',
        supplierName: 'GreenValley Organic Farms',
        batchNumber: 'BCH-2026-GRC01',
        expiryDate: dateStr(1), // Expiring in 1 day!
        rating: 4.9,
        image: '',
        description: 'Wild yeast naturally fermented 36-hour sourdough loaf with blistered crust and open crumb.',
      },
    ];

    // Seed 30 days of realistic sales data for ML training
    const historicalSales: HistoricalSale[] = [];
    const sales: SaleRecord[] = [];
    const orders: Order[] = [];
    const inventoryLogs: InventoryLog[] = [];

    const customers = [
      { name: 'Michael Chang', phone: '+1 555-401-8899', addr: '742 Evergreen Terrace, Springfield' },
      { name: 'Emily Watson', phone: '+1 555-321-7788', addr: '124 Conch St, Pacific Heights' },
      { name: 'Robert Vance', phone: '+1 555-667-2233', addr: '55 Industrial Parkway, Suite 4' },
      { name: 'Sophia Rossi', phone: '+1 555-889-1122', addr: '88 Oakridge Way, Maple Valley' },
      { name: 'Liam O’Connor', phone: '+1 555-909-3344', addr: '312 Pinecone Ridge, Fairview' },
      { name: 'Jessica Alba', phone: '+1 555-443-8822', addr: '900 Sunset Strip, Los Angeles' },
    ];

    const paymentMethods: ('Cash' | 'Credit Card' | 'UPI / Bank Transfer' | 'Store Credit')[] = [
      'Credit Card',
      'UPI / Bank Transfer',
      'Cash',
      'Credit Card',
    ];

    let orderCounter = 1000;
    for (let dayOffset = -30; dayOffset <= 0; dayOffset++) {
      const curDate = dateStr(dayOffset);
      const isWeekend = new Date(curDate).getDay() === 0 || new Date(curDate).getDay() === 6;

      for (const prod of products) {
        // Base velocity per category
        const baseQty = prod.category === 'Dairy' ? 14 : prod.category === 'Snacks' ? 11 : prod.category === 'Groceries' ? 9 : 6;
        const weekendBoost = isWeekend ? 1.4 : 1.0;
        const noise = 0.8 + Math.random() * 0.4;
        const dailyQty = Math.round(baseQty * weekendBoost * noise);

        historicalSales.push({
          productId: prod.id,
          date: curDate,
          quantity: dailyQty,
          revenue: Math.round(dailyQty * prod.price * 100) / 100,
        });
      }

      // Generate 2-4 realistic customer orders for the past 7 days
      if (dayOffset >= -7) {
        const ordersToday = Math.floor(Math.random() * 3) + 2;
        for (let o = 0; o < ordersToday; o++) {
          orderCounter++;
          const cust = customers[(orderCounter + o) % customers.length];
          const payMethod = paymentMethods[(orderCounter + o) % paymentMethods.length];

          // Pick 2-4 items
          const itemsCount = Math.floor(Math.random() * 3) + 2;
          const orderItems: OrderItem[] = [];
          const saleItemsList: SaleRecord['items'] = [];
          let subtotal = 0;
          let profit = 0;

          for (let it = 0; it < itemsCount; it++) {
            const p = products[(orderCounter + it + o * 2) % products.length];
            const q = Math.floor(Math.random() * 3) + 1;
            const lineSubtotal = Math.round(q * p.price * 100) / 100;
            const lineProfit = Math.round(q * (p.price - p.cost) * 100) / 100;

            orderItems.push({
              productId: p.id,
              productName: p.name,
              sku: p.sku,
              quantity: q,
              price: p.price,
              subtotal: lineSubtotal,
            });

            saleItemsList.push({
              productId: p.id,
              productName: p.name,
              quantity: q,
              unitPrice: p.price,
              unitCost: p.cost,
              subtotal: lineSubtotal,
            });

            subtotal += lineSubtotal;
            profit += lineProfit;
          }

          const tax = Math.round(subtotal * 0.05 * 100) / 100;
          const totalAmount = Math.round((subtotal + tax) * 100) / 100;
          const orderId = `ORD-2026-${orderCounter}`;
          const saleId = `SAL-2026-${orderCounter}`;

          orders.push({
            id: orderId,
            orderNumber: orderId,
            customerName: cust.name,
            customerPhone: cust.phone,
            customerAddress: cust.addr,
            paymentMethod: payMethod,
            paymentStatus: 'Paid',
            orderStatus: dayOffset === 0 ? 'Confirmed' : 'Completed',
            subtotal,
            tax,
            totalAmount,
            date: curDate,
            items: orderItems,
          });

          sales.push({
            id: saleId,
            saleNumber: saleId,
            orderId,
            customerName: cust.name,
            totalAmount,
            profit,
            paymentMethod: payMethod,
            date: curDate,
            itemCount: orderItems.reduce((acc, i) => acc + i.quantity, 0),
            items: saleItemsList,
          });
        }
      }
    }

    // Seed Initial Inventory Logs
    for (const prod of products) {
      inventoryLogs.push({
        id: `inv_log_${prod.id}`,
        productId: prod.id,
        productName: prod.name,
        type: 'IN',
        quantity: prod.quantity + 40,
        balanceAfter: prod.quantity,
        unitPrice: prod.cost,
        reason: 'Initial stock intake from supplier',
        batchNumber: prod.batchNumber,
        date: dateStr(-14),
      });
    }

    // Seed Live Notifications
    const notifications: NotificationItem[] = [
      {
        id: 'notif_01',
        title: 'Critical Out of Stock',
        message: 'Pure Refined Cane Sugar (1kg) is completely OUT OF STOCK. Reorder 40 units immediately.',
        type: 'critical',
        category: 'stock',
        productId: 'prod_06',
        isRead: false,
        createdAt: dateStr(0),
      },
      {
        id: 'notif_02',
        title: 'Expiry Alert (1 Day Remaining)',
        message: 'Artisan Sourdough Loaf (600g) expires tomorrow! Apply clearance discount or move to front.',
        type: 'warning',
        category: 'expiry',
        productId: 'prod_12',
        isRead: false,
        createdAt: dateStr(0),
      },
      {
        id: 'notif_03',
        title: 'AI High Demand Surge',
        message: 'Artisanal Butter Shortbread Biscuits sales velocity spiked +38% this week. Projected demand: 82 units.',
        type: 'insight',
        category: 'demand',
        productId: 'prod_03',
        isRead: false,
        createdAt: dateStr(0),
      },
      {
        id: 'notif_04',
        title: 'Low Stock Threshold Reached',
        message: 'Cold Pressed Pure Citrus Juice (1L) currently at 8 units (Reorder level: 20). Supplier lead time: 2 days.',
        type: 'warning',
        category: 'stock',
        productId: 'prod_04',
        isRead: false,
        createdAt: dateStr(-1),
      },
      {
        id: 'notif_05',
        title: 'Expiry Notice (2 Days Remaining)',
        message: 'Greek Style Plain Yogurt (400g) batch BCH-2026-DRY22 expires in 48 hours.',
        type: 'warning',
        category: 'expiry',
        productId: 'prod_08',
        isRead: true,
        createdAt: dateStr(-1),
      },
    ];

    // Seed AI Business Insights
    const aiInsights: AIInsight[] = [
      {
        id: 'ins_01',
        title: 'Restock Required: Milk & Citrus Juice',
        reason: 'Projected demand for Dairy and Beverages exceeds current stock by 65% for the coming weekend.',
        severity: 'CRITICAL',
        recommendedAction: 'Draft and submit replenishment PO to GreenValley and Apex Beverage Distributors.',
        actionType: 'restock',
        relatedProductId: 'prod_01',
        relatedProductName: 'Organic Farm Whole Milk (500ml)',
        expectedImpact: 'Prevents estimated $480 in stockout lost sales and retains customer loyalty.',
        resolved: false,
        createdAt: dateStr(0),
      },
      {
        id: 'ins_02',
        title: 'Clearance Discount for Sourdough & Yogurt',
        reason: '2 batches are approaching expiry within 48-72 hours with combined retail value of $73.56.',
        severity: 'RECOMMENDED',
        recommendedAction: 'Apply immediate 20% - 30% promotional markdown to clear shelf units before expiration.',
        actionType: 'discount',
        relatedProductId: 'prod_12',
        relatedProductName: 'Artisan Sourdough Loaf (600g)',
        expectedImpact: 'Recovers 85% of purchase cost instead of writing off as dead spoilage.',
        resolved: false,
        createdAt: dateStr(0),
      },
      {
        id: 'ins_03',
        title: 'Snack Category Surge Opportunity',
        reason: 'Artisanal Butter Biscuits has 64 units on hand with accelerating velocity (+38%).',
        severity: 'OPPORTUNITY',
        recommendedAction: 'Create a paired "Tea & Biscuit" bundle with Chamomile tea for a 15% margin lift.',
        actionType: 'bundle',
        relatedProductId: 'prod_03',
        relatedProductName: 'Artisanal Butter Shortbread Biscuits (250g)',
        expectedImpact: 'Increases basket size and boosts gross profit by ~$180 this week.',
        resolved: false,
        createdAt: dateStr(-1),
      },
      {
        id: 'ins_04',
        title: 'Overstock Risk: Botanical Soap Bar',
        reason: 'Current stock of 82 units covers 48 days of burn rate, tying up $229.60 in working capital.',
        severity: 'OPTIMIZATION',
        recommendedAction: 'Hold future purchase orders for 3 weeks until inventory drops below 30 units.',
        actionType: 'transfer',
        relatedProductId: 'prod_05',
        relatedProductName: 'Botanical Olive Oil Soap Bar (200g)',
        expectedImpact: 'Reallocates cash flow toward high-velocity perishable categories.',
        resolved: false,
        createdAt: dateStr(-2),
      },
    ];

    return {
      users,
      products,
      suppliers,
      inventoryLogs,
      orders,
      sales,
      notifications,
      historicalSales,
      aiInsights,
      wishlist: ['prod_03', 'prod_07'],
    };
  }

  // --- Users & Auth ---
  public getUsers(): User[] {
    return this.data.users;
  }

  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public createUser(userData: { name: string; email: string; phone: string; password: string; role?: 'admin' | 'staff' }): User {
    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      passwordHash: hashPassword(userData.password),
      role: userData.role || 'staff',
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
    };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  public updateUserRole(userId: string, role: 'admin' | 'staff', status?: 'active' | 'inactive'): User | null {
    const u = this.data.users.find((user) => user.id === userId);
    if (!u) return null;
    u.role = role;
    if (status) u.status = status;
    this.save();
    return u;
  }

  // --- Products & Inventory ---
  public getProducts(): Product[] {
    const wishlistSet = new Set(this.data.wishlist);
    return this.data.products.map((p) => ({
      ...p,
      isWishlisted: wishlistSet.has(p.id),
    }));
  }

  public getProductById(id: string): Product | undefined {
    return this.data.products.find((p) => p.id === id);
  }

  public createProduct(data: Omit<Product, 'id' | 'isWishlisted'>): Product {
    const newProduct: Product = {
      ...data,
      id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
    };
    this.data.products.push(newProduct);

    // Log stock intake
    this.data.inventoryLogs.push({
      id: `inv_${Date.now()}`,
      productId: newProduct.id,
      productName: newProduct.name,
      type: 'IN',
      quantity: newProduct.quantity,
      balanceAfter: newProduct.quantity,
      unitPrice: newProduct.cost,
      reason: 'Product created with initial quantity',
      batchNumber: newProduct.batchNumber || 'BCH-INITIAL',
      date: new Date().toISOString().split('T')[0],
    });

    this.checkStockAlerts(newProduct);
    this.save();
    return newProduct;
  }

  public updateProduct(id: string, updates: Partial<Product>): Product | null {
    const index = this.data.products.findIndex((p) => p.id === id);
    if (index === -1) return null;
    this.data.products[index] = { ...this.data.products[index], ...updates };
    this.checkStockAlerts(this.data.products[index]);
    this.save();
    return this.data.products[index];
  }

  public deleteProduct(id: string): boolean {
    const initialLen = this.data.products.length;
    this.data.products = this.data.products.filter((p) => p.id !== id);
    if (this.data.products.length !== initialLen) {
      this.data.wishlist = this.data.wishlist.filter((pid) => pid !== id);
      this.save();
      return true;
    }
    return false;
  }

  public stockIn(productId: string, quantity: number, unitCost: number, supplierName: string, reason: string): Product | null {
    const prod = this.data.products.find((p) => p.id === productId);
    if (!prod) return null;

    prod.quantity += quantity;
    if (unitCost > 0) prod.cost = unitCost;

    this.data.inventoryLogs.unshift({
      id: `inv_${Date.now()}`,
      productId: prod.id,
      productName: prod.name,
      type: 'IN',
      quantity,
      balanceAfter: prod.quantity,
      unitPrice: unitCost || prod.cost,
      reason: reason || `Stock in from ${supplierName || prod.supplierName}`,
      batchNumber: prod.batchNumber,
      date: new Date().toISOString().split('T')[0],
    });

    this.checkStockAlerts(prod);
    this.save();
    return prod;
  }

  public stockOut(productId: string, quantity: number, reason: string): Product | null {
    const prod = this.data.products.find((p) => p.id === productId);
    if (!prod) return null;

    prod.quantity = Math.max(0, prod.quantity - quantity);

    this.data.inventoryLogs.unshift({
      id: `inv_${Date.now()}`,
      productId: prod.id,
      productName: prod.name,
      type: 'OUT',
      quantity,
      balanceAfter: prod.quantity,
      unitPrice: prod.price,
      reason: reason || 'Manual stock write-off / adjustment',
      batchNumber: prod.batchNumber,
      date: new Date().toISOString().split('T')[0],
    });

    this.checkStockAlerts(prod);
    this.save();
    return prod;
  }

  // --- Orders & Sales Automation ---
  public createOrder(orderInput: {
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    paymentMethod: 'Cash' | 'Credit Card' | 'UPI / Bank Transfer' | 'Store Credit';
    items: { productId: string; quantity: number }[];
  }): { order: Order; sale: SaleRecord } {
    const today = new Date().toISOString().split('T')[0];
    const orderNum = `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const saleNum = `SAL-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    let subtotal = 0;
    let profit = 0;
    const orderItems: OrderItem[] = [];
    const saleItemsList: SaleRecord['items'] = [];

    // Deduct stock and assemble items
    for (const item of orderInput.items) {
      const prod = this.data.products.find((p) => p.id === item.productId);
      if (!prod) continue;

      const qty = Math.max(1, item.quantity);
      // Reduce inventory
      prod.quantity = Math.max(0, prod.quantity - qty);

      const lineSubtotal = Math.round(qty * prod.price * 100) / 100;
      const lineProfit = Math.round(qty * (prod.price - prod.cost) * 100) / 100;

      subtotal += lineSubtotal;
      profit += lineProfit;

      orderItems.push({
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        quantity: qty,
        price: prod.price,
        subtotal: lineSubtotal,
      });

      saleItemsList.push({
        productId: prod.id,
        productName: prod.name,
        quantity: qty,
        unitPrice: prod.price,
        unitCost: prod.cost,
        subtotal: lineSubtotal,
      });

      // Record in inventory logs
      this.data.inventoryLogs.unshift({
        id: `inv_${Date.now()}_${prod.id}`,
        productId: prod.id,
        productName: prod.name,
        type: 'SALE',
        quantity: qty,
        balanceAfter: prod.quantity,
        unitPrice: prod.price,
        reason: `Sold via Order ${orderNum}`,
        batchNumber: prod.batchNumber,
        date: today,
      });

      // Add to historical sales for continuous learning
      this.data.historicalSales.push({
        productId: prod.id,
        date: today,
        quantity: qty,
        revenue: lineSubtotal,
      });

      this.checkStockAlerts(prod);
    }

    const tax = Math.round(subtotal * 0.05 * 100) / 100;
    const totalAmount = Math.round((subtotal + tax) * 100) / 100;

    const newOrder: Order = {
      id: orderNum,
      orderNumber: orderNum,
      customerName: orderInput.customerName || 'Walk-in Customer',
      customerPhone: orderInput.customerPhone || 'N/A',
      customerAddress: orderInput.customerAddress || 'Store POS Checkout',
      paymentMethod: orderInput.paymentMethod || 'Credit Card',
      paymentStatus: 'Paid',
      orderStatus: 'Confirmed',
      subtotal,
      tax,
      totalAmount,
      date: today,
      items: orderItems,
    };

    const newSale: SaleRecord = {
      id: saleNum,
      saleNumber: saleNum,
      orderId: orderNum,
      customerName: newOrder.customerName,
      totalAmount,
      profit,
      paymentMethod: newOrder.paymentMethod,
      date: today,
      itemCount: orderItems.reduce((acc, i) => acc + i.quantity, 0),
      items: saleItemsList,
    };

    this.data.orders.unshift(newOrder);
    this.data.sales.unshift(newSale);
    this.save();

    return { order: newOrder, sale: newSale };
  }

  public updateOrderStatus(orderId: string, status: Order['orderStatus']): Order | null {
    const o = this.data.orders.find((ord) => ord.id === orderId);
    if (!o) return null;
    o.orderStatus = status;
    this.save();
    return o;
  }

  public getOrders(): Order[] {
    return this.data.orders;
  }

  public getSales(): SaleRecord[] {
    return this.data.sales;
  }

  public getInventoryLogs(): InventoryLog[] {
    return this.data.inventoryLogs;
  }

  public getSuppliers(): Supplier[] {
    return this.data.suppliers;
  }

  public createSupplier(supplier: Omit<Supplier, 'id'>): Supplier {
    const newSup: Supplier = {
      ...supplier,
      id: `sup_${Date.now()}`,
    };
    this.data.suppliers.push(newSup);
    this.save();
    return newSup;
  }

  public updateSupplier(id: string, updates: Partial<Supplier>): Supplier | null {
    const idx = this.data.suppliers.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    this.data.suppliers[idx] = { ...this.data.suppliers[idx], ...updates };
    this.save();
    return this.data.suppliers[idx];
  }

  public deleteSupplier(id: string): boolean {
    const init = this.data.suppliers.length;
    this.data.suppliers = this.data.suppliers.filter((s) => s.id !== id);
    if (this.data.suppliers.length !== init) {
      this.save();
      return true;
    }
    return false;
  }

  // --- Wishlist ---
  public getWishlist(): string[] {
    return this.data.wishlist;
  }

  public toggleWishlist(productId: string): boolean {
    const idx = this.data.wishlist.indexOf(productId);
    if (idx > -1) {
      this.data.wishlist.splice(idx, 1);
      this.save();
      return false; // now removed
    } else {
      this.data.wishlist.push(productId);
      this.save();
      return true; // now added
    }
  }

  // --- Expiry Management ---
  public getExpiryStatus() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    return this.data.products.map((p) => {
      const expDate = new Date(p.expiryDate);
      const diffMs = expDate.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffMs / 86400000);

      let status: 'Expired' | 'Expiring Today' | 'Expiring in 3 Days' | 'Expiring in 7 Days' | 'Safe' = 'Safe';
      if (daysRemaining < 0) {
        status = 'Expired';
      } else if (daysRemaining === 0) {
        status = 'Expiring Today';
      } else if (daysRemaining <= 3) {
        status = 'Expiring in 3 Days';
      } else if (daysRemaining <= 7) {
        status = 'Expiring in 7 Days';
      }

      let recommendation = 'Inventory is within safe lifecycle.';
      if (status === 'Expired') {
        recommendation = 'Remove expired stock from shelves and write off inventory.';
      } else if (status === 'Expiring Today' || status === 'Expiring in 3 Days') {
        recommendation = 'Apply 30% urgent clearance discount and position at store checkout.';
      } else if (status === 'Expiring in 7 Days') {
        recommendation = 'Prioritize front-of-shelf rotation and run buy-1-get-1 bundle.';
      }

      return {
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        category: p.category,
        batchNumber: p.batchNumber,
        quantity: p.quantity,
        price: p.price,
        cost: p.cost,
        expiryDate: p.expiryDate,
        daysRemaining,
        status,
        recommendation,
        atRiskValue: Math.round(p.quantity * p.price * 100) / 100,
      };
    });
  }

  public applyClearanceDiscount(productId: string, discountPercent: number): Product | null {
    const prod = this.data.products.find((p) => p.id === productId);
    if (!prod) return null;
    const factor = (100 - discountPercent) / 100;
    prod.price = Math.max(prod.cost, Math.round(prod.price * factor * 100) / 100);
    this.save();
    return prod;
  }

  // --- AI Predictions ---
  public getDemandPredictions(): PredictionOutput[] {
    const predictions: PredictionOutput[] = [];
    for (const prod of this.data.products) {
      const history = this.data.historicalSales.filter((h) => h.productId === prod.id);
      const prediction = calculateDemandPrediction(
        {
          id: prod.id,
          name: prod.name,
          sku: prod.sku,
          category: prod.category,
          quantity: prod.quantity,
          reorderLevel: prod.reorderLevel,
          price: prod.price,
          cost: prod.cost,
        },
        history
      );
      predictions.push(prediction);
    }
    return predictions;
  }

  // --- Notifications ---
  public getNotifications(): NotificationItem[] {
    return this.data.notifications;
  }

  public markNotificationAsRead(id: string): boolean {
    const notif = this.data.notifications.find((n) => n.id === id);
    if (notif) {
      notif.isRead = true;
      this.save();
      return true;
    }
    return false;
  }

  public markAllNotificationsAsRead(): void {
    this.data.notifications.forEach((n) => (n.isRead = true));
    this.save();
  }

  public dismissNotification(id: string): boolean {
    const init = this.data.notifications.length;
    this.data.notifications = this.data.notifications.filter((n) => n.id !== id);
    if (this.data.notifications.length !== init) {
      this.save();
      return true;
    }
    return false;
  }

  // --- AI Insights ---
  public getAiInsights(): AIInsight[] {
    return this.data.aiInsights;
  }

  public resolveAiInsight(id: string): boolean {
    const insight = this.data.aiInsights.find((i) => i.id === id);
    if (insight) {
      insight.resolved = true;
      this.save();
      return true;
    }
    return false;
  }

  // --- Automated Alerts Check ---
  private checkStockAlerts(product: Product) {
    const now = new Date().toISOString().split('T')[0];

    if (product.quantity === 0) {
      const exists = this.data.notifications.some(
        (n) => n.productId === product.id && n.type === 'critical' && !n.isRead
      );
      if (!exists) {
        this.data.notifications.unshift({
          id: `notif_${Date.now()}`,
          title: 'Critical Out of Stock',
          message: `${product.name} is completely OUT OF STOCK! Reorder immediately.`,
          type: 'critical',
          category: 'stock',
          productId: product.id,
          isRead: false,
          createdAt: now,
        });
      }
    } else if (product.quantity <= product.reorderLevel) {
      const exists = this.data.notifications.some(
        (n) => n.productId === product.id && n.title.includes('Low Stock') && !n.isRead
      );
      if (!exists) {
        this.data.notifications.unshift({
          id: `notif_${Date.now()}`,
          title: 'Low Stock Alert',
          message: `${product.name} is at ${product.quantity} units (Reorder point: ${product.reorderLevel}).`,
          type: 'warning',
          category: 'stock',
          productId: product.id,
          isRead: false,
          createdAt: now,
        });
      }
    }
  }

  // --- Comprehensive Analytics Aggregation ---
  public getAnalytics(timeframe: 'today' | '7d' | '30d' | '3m' | '1y') {
    const days = timeframe === 'today' ? 1 : timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : timeframe === '3m' ? 90 : 365;
    const cutoff = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];

    const filteredSales = this.data.sales.filter((s) => s.date >= cutoff);
    const totalRevenue = filteredSales.reduce((acc, s) => acc + s.totalAmount, 0);
    const totalProfit = filteredSales.reduce((acc, s) => acc + s.profit, 0);
    const totalTransactions = filteredSales.length;
    const aov = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    // Daily revenue points
    const dailyRevenueMap: Record<string, { revenue: number; profit: number; orders: number }> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
      dailyRevenueMap[d] = { revenue: 0, profit: 0, orders: 0 };
    }
    for (const s of filteredSales) {
      if (dailyRevenueMap[s.date]) {
        dailyRevenueMap[s.date].revenue += s.totalAmount;
        dailyRevenueMap[s.date].profit += s.profit;
        dailyRevenueMap[s.date].orders += 1;
      }
    }
    const salesTimeline = Object.entries(dailyRevenueMap).map(([date, data]) => ({
      date,
      revenue: Math.round(data.revenue * 100) / 100,
      profit: Math.round(data.profit * 100) / 100,
      orders: data.orders,
    }));

    // Inventory valuation
    let totalInventoryValue = 0;
    let totalInventoryCost = 0;
    let totalUnitsInStock = 0;
    let outOfStockCount = 0;
    let lowStockCount = 0;
    const categoryBreakdown: Record<string, { count: number; value: number; stock: number }> = {};

    for (const p of this.data.products) {
      const val = p.quantity * p.price;
      const cst = p.quantity * p.cost;
      totalInventoryValue += val;
      totalInventoryCost += cst;
      totalUnitsInStock += p.quantity;

      if (p.quantity === 0) outOfStockCount++;
      else if (p.quantity <= p.reorderLevel) lowStockCount++;

      if (!categoryBreakdown[p.category]) {
        categoryBreakdown[p.category] = { count: 0, value: 0, stock: 0 };
      }
      categoryBreakdown[p.category].count += 1;
      categoryBreakdown[p.category].value += val;
      categoryBreakdown[p.category].stock += p.quantity;
    }

    const categoriesList = Object.entries(categoryBreakdown).map(([cat, val]) => ({
      category: cat,
      productCount: val.count,
      inventoryValue: Math.round(val.value * 100) / 100,
      totalUnits: val.stock,
    }));

    // Top selling and slow moving items
    const productSalesCount: Record<string, { name: string; qty: number; revenue: number }> = {};
    for (const s of filteredSales) {
      for (const item of s.items) {
        if (!productSalesCount[item.productId]) {
          productSalesCount[item.productId] = { name: item.productName, qty: 0, revenue: 0 };
        }
        productSalesCount[item.productId].qty += item.quantity;
        productSalesCount[item.productId].revenue += item.subtotal;
      }
    }

    const sortedProducts = Object.entries(productSalesCount)
      .map(([id, info]) => ({ id, ...info }))
      .sort((a, b) => b.qty - a.qty);

    const topSelling = sortedProducts.slice(0, 5);
    const slowMoving = this.data.products
      .filter((p) => !productSalesCount[p.id] || productSalesCount[p.id].qty <= 2)
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        name: p.name,
        quantityInStock: p.quantity,
        valueTiedUp: Math.round(p.quantity * p.price * 100) / 100,
      }));

    return {
      timeframe,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalProfit: Math.round(totalProfit * 100) / 100,
      profitMargin: Math.round(profitMargin * 10) / 10,
      totalTransactions,
      aov: Math.round(aov * 100) / 100,
      totalInventoryValue: Math.round(totalInventoryValue * 100) / 100,
      totalInventoryCost: Math.round(totalInventoryCost * 100) / 100,
      totalUnitsInStock,
      totalProducts: this.data.products.length,
      outOfStockCount,
      lowStockCount,
      salesTimeline,
      categoriesList,
      topSelling,
      slowMoving,
    };
  }

  // Universal Search
  public universalSearch(query: string) {
    const q = query.toLowerCase().trim();
    if (!q) return { products: [], orders: [], suppliers: [], sales: [] };

    const products = this.data.products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      )
      .slice(0, 5);

    const orders = this.data.orders
      .filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerPhone.includes(q)
      )
      .slice(0, 5);

    const suppliers = this.data.suppliers
      .filter((s) => s.name.toLowerCase().includes(q) || s.contactPerson.toLowerCase().includes(q))
      .slice(0, 5);

    const sales = this.data.sales
      .filter((s) => s.saleNumber.toLowerCase().includes(q) || s.customerName.toLowerCase().includes(q))
      .slice(0, 5);

    return { products, orders, suppliers, sales };
  }
}

export const db = new Database();
