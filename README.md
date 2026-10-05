# SmartStock AI – Intelligent Inventory & Demand Prediction System
> **“Predict Demand. Optimize Inventory. Grow Smarter.”**

A modern, responsive, production-ready SaaS full-stack web application designed for small and medium-sized retail and general store owners. Manage product catalogs, warehouse stock, point-of-sale customer orders, perishable expiry tracking, central operational alerts, and **AI-powered machine learning demand forecasting** from a unified dashboard.

---

## ⚡ Key Highlights & Core Modules

1. **Authentication & RBAC**:
   - Secure token-based session handling with salt-hashed credentials.
   - Distinct roles: **Store Admin** (full system governance, SKU deletions, user roles) and **Inventory Staff** (catalog, POS, stock intake/adjustment).
   - Built-in one-click demo login buttons for instant review.

2. **Main KPI Dashboard**:
   - 8 top operational KPI metric cards with tabular alignment.
   - Interactive timeline trajectory chart (Sales Revenue vs Gross Profit).
   - Category inventory valuation donut chart.
   - Actual sales velocity vs AI 7-day predicted demand bar comparison.
   - High-urgency AI recommendation alert banner.
   - Recent orders & POS sales audit ledger.

3. **Product & Merchandise Catalog**:
   - High-fidelity retail studio photography with resilient SVG fallbacks.
   - Category filtering (Groceries, Beverages, Snacks, Dairy, Personal Care, Household).
   - Stock status filters (In Stock, Low Stock, Critical, Out of Stock).
   - Sorting by Price, Demand, and Name.
   - Quick quantity stepper dispatch to POS Cart & Wishlist.

4. **Master Inventory Management**:
   - Complete inventory master table ($Total\ Value = Quantity \times Unit\ Price$).
   - Stock In (replenishment with vendor & batch tracking).
   - Stock Out (damaged / expired write-off logging).
   - Bulk CSV sample import and real-time CSV export.

5. **POS & Shopping Cart Module**:
   - Add/edit line items, live quantity adjustments, and subtotal calculation.
   - 5% sales tax computation.
   - Complete customer checkout (Cash, Credit Card, UPI / Bank Transfer, Store Credit).
   - **Automated stock deduction**: Instantly reduces warehouse inventory upon sale, updates sales revenue, generates unique Order IDs, and auto-triggers low stock alerts.

6. **Orders & Printable Tax Invoice Receipt**:
   - Order history with live status transitions (Pending, Confirmed, Processing, Completed, Cancelled).
   - Tax Invoice Generator: printable, audit-ready invoices with customer billing info, line items, and print/CSV export.

7. **AI Demand Prediction (Machine Learning Engine)**:
   - Regression forecasting model considering historical 7d/30d burn rates, day-of-week retail seasonality multipliers (e.g. weekend bumps), category velocity, and price elasticity.
   - Generates 7-day and 30-day forecast demand, stock cover runway days, and recommended restock PO batch sizes ($+25\%$ safety buffer).
   - Single-click **"Re-train ML Model"** button with live accuracy weights.

8. **Expiry & Shelf-Life Management**:
   - Batch expiration tracking categorized by: `Expired`, `Expiring Today`, `Expiring in 3 Days`, `Expiring in 7 Days`, and `Safe`.
   - Rapid action buttons: **Clearance Markdown** (15%–50% discount tiers) and **Write-Off Removal**.

9. **Central Alerts & Notifications Center**:
   - Real-time exception notifications for Out of Stock, Low Stock (< reorder point), Expiring/Expired Batches, and Demand Spikes.
   - Interactive notification bell with unread badge in top navigation.

10. **Advanced Business Analytics**:
    - Revenue, profit margins, average order value (AOV), and transaction volumes.
    - Top 5 best-selling SKUs vs slow-moving / dead stock identification.
    - Timeframe filters: Today, 7 Days, 30 Days, 3 Months, 1 Year.

11. **Executive AI Advisory Feed**:
    - Root-cause diagnostics cards with quantified dollar impact and one-click execution triggers.

12. **Supplier Directory & Universal Search**:
    - Vendor registry with lead-time tracking and direct PO drafting.
    - Global command palette search (`⌘K` / `Ctrl+K`) across products, orders, suppliers, and sales.

13. **Export Reports**:
    - Generate structured CSVs and printable audits for Sales, Master Inventory, Expiry Risk, and AI Forecasts.

---

## 🔑 Demo Credentials

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@smartstock.io` | `admin123` | Full access (Users, Catalog, Inventory, Settings, Sales) |
| **Staff** | `staff@smartstock.io` | `staff123` | Operational access (Catalog, Inventory, POS Cart, Orders) |

*(Quick 1-click login buttons are also provided on the sign-in screen for instant access without typing!)*

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Motion.
- **Backend**: Node.js & Express RESTful API mounted with Vite middleware.
- **AI/ML Engine**: Multivariate regression, day-of-week seasonality weighting, and trend momentum forecasting.
- **Storage**: Relational database schema with atomic persistence (`data/smartstock_db.json`).
