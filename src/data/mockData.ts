import { Product, Customer, Sale, StoreSettings } from '../types';

export const INITIAL_CATEGORIES = [
  { id: 'all', name: 'All Items', color: 'bg-slate-100 text-slate-800 border-slate-200' },
  { id: 'beverage', name: 'Drinks & Beverages', color: 'bg-emerald-50 text-emerald-800 border-emerald-100 hover:bg-emerald-100' },
  { id: 'bakery', name: 'Bakery & Sweets', color: 'bg-amber-50 text-amber-800 border-amber-100 hover:bg-amber-100' },
  { id: 'food', name: 'Prepared Food & Deli', color: 'bg-rose-50 text-rose-800 border-rose-100 hover:bg-rose-100' },
  { id: 'snacks', name: 'Salty Snacks', color: 'bg-violet-50 text-violet-800 border-violet-100 hover:bg-violet-100' },
  { id: 'tech', name: 'Tech & Gadgets', color: 'bg-indigo-50 text-indigo-800 border-indigo-100 hover:bg-indigo-100' },
  { id: 'office', name: 'Office & Paper', color: 'bg-cyan-50 text-cyan-800 border-cyan-100 hover:bg-cyan-100' }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Espresso Ristretto',
    sku: 'BEV-001',
    barcode: '88011221',
    price: 3.50,
    cost: 0.80,
    category: 'beverage',
    stock: 120,
    lowStockThreshold: 15,
    color: 'emerald'
  },
  {
    id: '2',
    name: 'Organic Matcha Latte',
    sku: 'BEV-002',
    barcode: '88011222',
    price: 4.80,
    cost: 1.20,
    category: 'beverage',
    stock: 8, // Low Stock Trigger
    lowStockThreshold: 10,
    color: 'emerald'
  },
  {
    id: '3',
    name: 'Butter Croissant XL',
    sku: 'BAK-001',
    barcode: '88011223',
    price: 2.90,
    cost: 0.60,
    category: 'bakery',
    stock: 45,
    lowStockThreshold: 12,
    color: 'amber'
  },
  {
    id: '4',
    name: 'Chocolate Ganache Tart',
    sku: 'BAK-002',
    barcode: '88011224',
    price: 5.20,
    cost: 1.80,
    category: 'bakery',
    stock: 15,
    lowStockThreshold: 5,
    color: 'amber'
  },
  {
    id: '5',
    name: 'Avocado Toast & Egg',
    sku: 'FOD-001',
    barcode: '88011225',
    price: 9.50,
    cost: 2.80,
    category: 'food',
    stock: 30,
    lowStockThreshold: 5,
    color: 'rose'
  },
  {
    id: '6',
    name: 'Truffle Fries (Basket)',
    sku: 'SNK-001',
    barcode: '88011226',
    price: 6.00,
    cost: 1.50,
    category: 'snacks',
    stock: 60,
    lowStockThreshold: 15,
    color: 'violet'
  },
  {
    id: '7',
    name: 'USB-C Fast Charger 30W',
    sku: 'TEC-001',
    barcode: '88011227',
    price: 19.99,
    cost: 6.50,
    category: 'tech',
    stock: 22,
    lowStockThreshold: 5,
    color: 'indigo'
  },
  {
    id: '8',
    name: 'Wireless Ergonomic Mouse',
    sku: 'TEC-002',
    barcode: '88011228',
    price: 29.50,
    cost: 10.00,
    category: 'tech',
    stock: 3, // Out / very low stock
    lowStockThreshold: 5,
    color: 'indigo'
  },
  {
    id: '9',
    name: 'Vegan Quinoa Salad',
    sku: 'FOD-002',
    barcode: '88011229',
    price: 11.20,
    cost: 3.50,
    category: 'food',
    stock: 18,
    lowStockThreshold: 5,
    color: 'rose'
  },
  {
    id: '10',
    name: 'Premium Leather Journal',
    sku: 'OFC-001',
    barcode: '88011230',
    price: 14.50,
    cost: 4.50,
    category: 'office',
    stock: 15,
    lowStockThreshold: 4,
    color: 'cyan'
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'c1',
    name: 'Adrian Vance',
    phone: '555-0192',
    email: 'adrian@vance.io',
    loyaltyPoints: 340,
    notes: 'Prefers soy milk/alternative options. Regular morning visitor.',
    createdAt: '2026-03-12T08:00:00Z'
  },
  {
    id: 'c2',
    name: 'Elena Rostova',
    phone: '555-0147',
    email: 'elena.rostova@gmail.com',
    loyaltyPoints: 85,
    notes: 'Purchases custom tech widgets and journals in bulk.',
    createdAt: '2026-04-01T10:30:00Z'
  },
  {
    id: 'c3',
    name: 'Tyler Durden',
    phone: '555-0100',
    email: 'durden@soap.corp',
    loyaltyPoints: 12,
    notes: 'Handles payments with cash only. Asks for receipt duplicates.',
    createdAt: '2026-04-20T14:15:00Z'
  },
  {
    id: 'c4',
    name: 'Sarah Jenkins',
    phone: '555-0173',
    email: 'sjenkins@academia.edu',
    loyaltyPoints: 1150,
    notes: 'VIP customer. Prefers prepared food items for lunch.',
    createdAt: '2026-01-15T09:00:00Z'
  }
];

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'AeroMarket & Cafe',
  address: '100 Innovation Blvd, Suite 300',
  phone: '(555) 987-6543',
  taxRate: 8.5, // 8.5%
  currencySymbol: '$',
  receiptHeader: 'THANK YOU FOR SHOPPING WITH AEROMARKET',
  receiptFooter: 'All sales are final on food. Exchange bakery items same-day.',
  loyaltyPointsPercent: 1.0 // 1% points earned on purchase totals
};

// Generates simulated historical sales from last 7 days for rich analytics
export function generateHistoricSales(products: Product[], customers: Customer[]): Sale[] {
  const sales: Sale[] = [];
  const currentDate = new Date('2026-05-25T06:43:37Z'); // Relative to environment datetime
  
  // Create sales for the past 7 days
  for (let i = 6; i >= 0; i--) {
    const saleDate = new Date(currentDate);
    saleDate.setDate(currentDate.getDate() - i);
    
    // Multiple sales per day
    const transactionsCount = i === 0 ? 3 : 5 + Math.floor(Math.random() * 6); // 5 to 10 sales
    
    for (let t = 0; t < transactionsCount; t++) {
      const isToday = i === 0;
      // Distribute sales across daylight hours
      const hour = 8 + Math.floor(Math.random() * 11); // 8:00 to 19:00
      const minute = Math.floor(Math.random() * 60);
      saleDate.setHours(hour, minute, 0, 0);

      // Random selection of 1-3 products
      const count = 1 + Math.floor(Math.random() * 3);
      const items = [];
      const selectedProductIds = new Set<string>();
      
      for (let p = 0; p < count; p++) {
        const prod = products[Math.floor(Math.random() * products.length)];
        if (selectedProductIds.has(prod.id)) continue;
        selectedProductIds.add(prod.id);
        
        const qty = 1 + Math.floor(Math.random() * 3);
        items.push({
          product: prod,
          quantity: qty,
          discountPercentage: Math.random() > 0.85 ? 10 : 0 // Occasional 10% off
        });
      }

      if (items.length === 0) continue;

      // Calculate financials
      let subtotal = 0;
      let discountAmount = 0;
      items.forEach(itm => {
        const cost = itm.product.price * itm.quantity;
        subtotal += cost;
        if (itm.discountPercentage > 0) {
          discountAmount += cost * (itm.discountPercentage / 100);
        }
      });

      const taxAmount = parseFloat(((subtotal - discountAmount) * (8.5 / 100)).toFixed(2));
      const total = parseFloat((subtotal - discountAmount + taxAmount).toFixed(2));

      // Choose customer optionally
      const hasCustomer = Math.random() > 0.4;
      const customer = hasCustomer ? customers[Math.floor(Math.random() * customers.length)] : undefined;

      // Split or single payment
      const methodIndex = Math.floor(Math.random() * 10);
      const payments = [];
      
      if (methodIndex < 6) {
        payments.push({ method: 'card' as const, amount: total, reference: `TX_CR_${Math.random().toString(36).substr(2, 9).toUpperCase()}` });
      } else if (methodIndex < 9) {
        payments.push({ method: 'cash' as const, amount: Math.ceil(total / 5) * 5 }); // Cash and change simulated
      } else {
        payments.push({ method: 'mobile' as const, amount: total, reference: `TX_MB_${Math.random().toString(36).substr(2, 9).toUpperCase()}` });
      }

      const invDay = String(saleDate.getDate()).padStart(2, '0');
      const invMonth = String(saleDate.getMonth() + 1).padStart(2, '0');
      const indexStr = String(sales.length + 101).padStart(4, '0');
      const invoiceNo = `INV-2026-${invMonth}${invDay}-${indexStr}`;

      sales.push({
        id: `sale-${i}-${t}`,
        invoiceNo,
        items,
        subtotal: parseFloat(subtotal.toFixed(2)),
        taxAmount,
        discountAmount: parseFloat(discountAmount.toFixed(2)),
        total,
        payments,
        customer,
        timestamp: saleDate.toISOString(),
        refunded: false,
        cashierName: 'Chen G.',
        notes: Math.random() > 0.9 ? 'VIP client request' : undefined
      });
    }
  }

  return sales;
}
