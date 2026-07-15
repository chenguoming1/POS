export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  price: number;
  cost: number;
  category: string;
  stock: number;
  lowStockThreshold: number;
  description?: string;
  imageUrl?: string;
  color?: string; // UI category grouping representation
}

export interface CartItem {
  product: Product;
  quantity: number;
  discountPercentage: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  loyaltyPoints: number;
  notes?: string;
  createdAt: string;
}

export interface PaymentDetails {
  method: 'cash' | 'card' | 'mobile' | 'gift_card';
  amount: number;
  reference?: string;
}

export interface Sale {
  id: string;
  invoiceNo: string;
  items: CartItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  payments: PaymentDetails[];
  customer?: Customer;
  timestamp: string;
  refunded: boolean;
  refundedTimestamp?: string;
  refundReason?: string;
  cashierName: string;
  notes?: string;
}

export interface HoldCart {
  id: string;
  name: string;
  items: CartItem[];
  customerId?: string;
  timestamp: string;
}

export interface StoreSettings {
  storeName: string;
  address: string;
  phone: string;
  taxRate: number;
  currencySymbol: string;
  receiptHeader: string;
  receiptFooter: string;
  loyaltyPointsPercent: number; // default: 1% back in loyalty dollars
}

export interface User {
  id: string;
  name: string;
  role: 'Admin' | 'Cashier';
  pin: string;
  avatarInitials: string;
}
