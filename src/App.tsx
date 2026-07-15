import { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, 
  Package, 
  FileText, 
  Users, 
  TrendingUp, 
  Settings, 
  Clock, 
  Store,
  FolderSync,
  AlertCircle
} from 'lucide-react';

import { Product, Customer, Sale, HoldCart, StoreSettings, CartItem } from './types';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_CATEGORIES, 
  INITIAL_CUSTOMERS, 
  DEFAULT_SETTINGS, 
  generateHistoricSales 
} from './data/mockData';

// Subcomponents
import CartManager from './components/CartManager';
import InventoryManager from './components/InventoryManager';
import HistoryManager from './components/HistoryManager';
import CustomerManager from './components/CustomerManager';
import Dashboard from './components/Dashboard';
import SettingsManager from './components/SettingsManager';
import LoginScreen, { MOCK_USERS } from './components/LoginScreen';
import RestrictedOverridePanel from './components/RestrictedOverridePanel';
import { User } from './types';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'checkout' | 'dashboard' | 'inventory' | 'history' | 'customers' | 'settings'>('checkout');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // App core persistent collections
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [heldCarts, setHeldCarts] = useState<HoldCart[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);

  // Live formatted clock state
  const [currentTime, setCurrentTime] = useState(new Date());

  // Bootstrap initial dataset on mount
  useEffect(() => {
    // Restore user session if preserved
    const savedUser = localStorage.getItem('pos_current_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        // Safe bypass
      }
    }

    const isInitialized = localStorage.getItem('pos_initialized');
    
    if (!isInitialized) {
      // First boot: populate mock states
      localStorage.setItem('pos_products', JSON.stringify(INITIAL_PRODUCTS));
      localStorage.setItem('pos_customers', JSON.stringify(INITIAL_CUSTOMERS));
      const mockSales = generateHistoricSales(INITIAL_PRODUCTS, INITIAL_CUSTOMERS);
      localStorage.setItem('pos_sales', JSON.stringify(mockSales));
      localStorage.setItem('pos_held_carts', JSON.stringify([]));
      localStorage.setItem('pos_settings', JSON.stringify(DEFAULT_SETTINGS));
      localStorage.setItem('pos_initialized', 'true');

      setProducts(INITIAL_PRODUCTS);
      setCustomers(INITIAL_CUSTOMERS);
      setSales(mockSales);
      setHeldCarts([]);
      setSettings(DEFAULT_SETTINGS);
    } else {
      // Subsequent boots: load existing items
      const loadedProds = localStorage.getItem('pos_products');
      const loadedCusts = localStorage.getItem('pos_customers');
      const loadedSales = localStorage.getItem('pos_sales');
      const loadedHelds = localStorage.getItem('pos_held_carts');
      const loadedConf = localStorage.getItem('pos_settings');

      if (loadedProds) setProducts(JSON.parse(loadedProds));
      if (loadedCusts) setCustomers(JSON.parse(loadedCusts));
      if (loadedSales) setSales(JSON.parse(loadedSales));
      if (loadedHelds) setHeldCarts(JSON.parse(loadedHelds));
      if (loadedConf) setSettings(JSON.parse(loadedConf));
    }
  }, []);

  // Sync back state modifications to localStorage whenever they occur
  useEffect(() => {
    if (products.length > 0) localStorage.setItem('pos_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    if (customers.length > 0) localStorage.setItem('pos_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    if (sales.length > 0) localStorage.setItem('pos_sales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem('pos_held_carts', JSON.stringify(heldCarts));
  }, [heldCarts]);

  useEffect(() => {
    localStorage.setItem('pos_settings', JSON.stringify(settings));
  }, [settings]);

  // Tick active clocks
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Low stock counter for app navigation badges
  const lowStockCount = useMemo(() => {
    return products.filter(p => p.stock <= p.lowStockThreshold).length;
  }, [products]);

  // --- REGULAR HANDLERS FOR MODULES ---

  // Product Inventory modifiers
  const handleAddProduct = (newProd: Omit<Product, 'id'>) => {
    const fresh: Product = {
      ...newProd,
      id: `prod-${Date.now()}`
    };
    setProducts(prev => {
      const next = [fresh, ...prev];
      localStorage.setItem('pos_products', JSON.stringify(next));
      return next;
    });
  };

  const handleUpdateProduct = (updated: Product) => {
    setProducts(prev => {
      const next = prev.map(p => p.id === updated.id ? updated : p);
      localStorage.setItem('pos_products', JSON.stringify(next));
      return next;
    });
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(prev => {
      const next = prev.filter(p => p.id !== id);
      localStorage.setItem('pos_products', JSON.stringify(next));
      return next;
    });
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('pos_current_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('pos_current_user');
  };

  // CRM Customer additions
  const handleAddCustomer = (newCust: Omit<Customer, 'id' | 'createdAt'>) => {
    const fresh: Customer = {
      ...newCust,
      id: `cust-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setCustomers(prev => {
      const next = [fresh, ...prev];
      localStorage.setItem('pos_customers', JSON.stringify(next));
      return next;
    });
  };

  const handleUpdateCustomer = (updated: Customer) => {
    setCustomers(prev => {
      const next = prev.map(c => c.id === updated.id ? updated : c);
      localStorage.setItem('pos_customers', JSON.stringify(next));
      return next;
    });
  };

  // Checkout settlement handler
  const handleCheckoutSuccess = (
    cartItems: CartItem[],
    totalPayments: { method: 'cash' | 'card' | 'mobile' | 'gift_card'; amount: number; reference?: string }[],
    customer?: Customer,
    notes?: string
  ) => {
    
    // 1. Calculate totals
    let subtotal = 0;
    let lineDiscounts = 0;
    cartItems.forEach(item => {
      const gross = item.product.price * item.quantity;
      subtotal += gross;
      if (item.discountPercentage > 0) {
        lineDiscounts += gross * (item.discountPercentage / 100);
      }
    });

    const taxAmount = parseFloat(((subtotal - lineDiscounts) * (settings.taxRate / 100)).toFixed(2));
    const totalTaxable = subtotal - lineDiscounts + taxAmount;

    // 2. Decrement core stock levels
    setProducts(prev => {
      const next = prev.map(p => {
        const cartMatch = cartItems.find(itm => itm.product.id === p.id);
        if (cartMatch) {
          return {
            ...p,
            stock: Math.max(0, p.stock - cartMatch.quantity)
          };
        }
        return p;
      });
      localStorage.setItem('pos_products', JSON.stringify(next));
      return next;
    });

    // 3. Update customer loyalty points accrued OR debited
    if (customer) {
      setCustomers(prev => {
        const next = prev.map(c => {
          if (c.id === customer.id) {
            let nextPoints = c.loyaltyPoints;
            
            // Debit gift/loyalty payment amount (1 dollar = 100 points)
            const giftPay = totalPayments.find(p => p.method === 'gift_card');
            if (giftPay) {
              const debitedPoints = giftPay.amount * 100;
              nextPoints = Math.max(0, nextPoints - debitedPoints);
            }

            // Gain cashback reward points
            const gainedPoints = Math.floor(totalTaxable * (settings.loyaltyPointsPercent / 100));
            nextPoints += gainedPoints;

            return {
              ...c,
              loyaltyPoints: nextPoints
            };
          }
          return c;
        });
        localStorage.setItem('pos_customers', JSON.stringify(next));
        return next;
      });
    }

    // 4. Record new sale transaction
    const dateNow = new Date();
    const invDay = String(dateNow.getDate()).padStart(2, '0');
    const invMonth = String(dateNow.getMonth() + 1).padStart(2, '0');
    const invoiceNo = `INV-2026-${invMonth}${invDay}-${String(sales.length + 101).padStart(4, '0')}`;

    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      invoiceNo,
      items: cartItems,
      subtotal: parseFloat(subtotal.toFixed(2)),
      taxAmount,
      discountAmount: parseFloat(lineDiscounts.toFixed(2)),
      total: parseFloat(totalTaxable.toFixed(2)),
      payments: totalPayments,
      customer,
      timestamp: dateNow.toISOString(),
      refunded: false,
      cashierName: 'Chen G.',
      notes
    };

    setSales(prev => {
      const next = [newSale, ...prev];
      localStorage.setItem('pos_sales', JSON.stringify(next));
      return next;
    });

    alert(`Successfully settled transaction ${invoiceNo}. Ticket is queued in ledger logs.`);
  };

  // Refund restitution processing
  const handleRefundSale = (id: string, reason: string) => {
    let refundedSale: Sale | undefined;

    setSales(prev => {
      const next = prev.map(s => {
        if (s.id === id) {
          refundedSale = s;
          return {
            ...s,
            refunded: true,
            refundReason: reason,
            refundedTimestamp: new Date().toISOString()
          };
        }
        return s;
      });
      localStorage.setItem('pos_sales', JSON.stringify(next));
      return next;
    });

    // Restore products stock levels
    if (refundedSale) {
      const itemsToRestore = refundedSale.items;
      setProducts(prev => {
        const next = prev.map(p => {
          const match = itemsToRestore.find(itm => itm.product.id === p.id);
          if (match) {
            return {
              ...p,
              stock: p.stock + match.quantity
            };
          }
          return p;
        });
        localStorage.setItem('pos_products', JSON.stringify(next));
        return next;
      });

      // Refunded loyalty points deduction if customer linked
      if (refundedSale.customer) {
        const customerToPenalty = refundedSale.customer;
        const ptsCredited = Math.floor(refundedSale.total * (settings.loyaltyPointsPercent / 100));
        
        setCustomers(prev => {
          const next = prev.map(c => {
            if (c.id === customerToPenalty.id) {
              return {
                ...c,
                loyaltyPoints: Math.max(0, c.loyaltyPoints - ptsCredited)
              };
            }
            return c;
          });
          localStorage.setItem('pos_customers', JSON.stringify(next));
          return next;
        });
      }
    }
  };

  // Queue suspending bags
  const handleHoldCart = (name: string, items: CartItem[], customerId?: string) => {
    const fresh: HoldCart = {
      id: `hold-${Date.now()}`,
      name,
      items,
      customerId,
      timestamp: new Date().toISOString()
    };
    setHeldCarts(prev => [fresh, ...prev]);
  };

  const handleRecallCart = (id: string) => {
    // Simply delegated back inside CartManager component
  };

  const handleDeleteHeldCart = (id: string) => {
    setHeldCarts(prev => prev.filter(c => c.id !== id));
  };

  const handleUpdateSettings = (updated: StoreSettings) => {
    setSettings(updated);
  };

  // Administration resets
  const handleClearAllData = () => {
    localStorage.clear();
    setProducts([]);
    setCustomers([]);
    setSales([]);
    setHeldCarts([]);
    setSettings(DEFAULT_SETTINGS);
    // Reload components fresh
    window.location.reload();
  };

  const handleResetToMock = () => {
    localStorage.setItem('pos_products', JSON.stringify(INITIAL_PRODUCTS));
    localStorage.setItem('pos_customers', JSON.stringify(INITIAL_CUSTOMERS));
    const mockSales = generateHistoricSales(INITIAL_PRODUCTS, INITIAL_CUSTOMERS);
    localStorage.setItem('pos_sales', JSON.stringify(mockSales));
    localStorage.setItem('pos_held_carts', JSON.stringify([]));
    localStorage.setItem('pos_settings', JSON.stringify(DEFAULT_SETTINGS));
    localStorage.setItem('pos_initialized', 'true');

    setProducts(INITIAL_PRODUCTS);
    setCustomers(INITIAL_CUSTOMERS);
    setSales(mockSales);
    setHeldCarts([]);
    setSettings(DEFAULT_SETTINGS);
  };

  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLogin} />;
  }

  const isTabRestricted = (currentTab === 'dashboard' || currentTab === 'inventory' || currentTab === 'settings') && currentUser.role !== 'Admin';

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col font-sans text-slate-800" id="pos-application-container">
      
      {/* GLOBAL SYSTEM BAR: Store Brand, active terminal state, dynamic lock */}
      <header className="bg-[#5A5A40] text-white px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-md border-b border-[#4A5240] shrink-0" id="meta-system-header">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-[#8FA38F] rounded-xl flex items-center justify-center text-white animate-spin" id="logo-icon">
            <Store className="w-5 h-5 pointer-events-none" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#E8D5B5] block font-mono">Shift Register Session</span>
            <h1 className="text-base font-extrabold tracking-tight" id="terminal-brand">{settings.storeName}</h1>
          </div>
        </div>

        {/* Dynamic clocks & cashier information */}
        <div className="flex items-center gap-4 text-xs font-mono text-slate-300">
          <div className="space-y-0.5 text-right hidden sm:block">
            <span className="text-[9px] uppercase font-bold tracking-wider text-[#E8D5B5] block">Cashier Duty</span>
            <span className="font-semibold text-white">{currentUser.name} ({currentUser.role})</span>
          </div>
          <div className="h-8 w-px bg-[#4A5240] hidden sm:block"></div>
          <div className="flex items-center gap-1.5 text-[11px] bg-[#4A5240] px-3 py-1.5 rounded-lg border border-[#8FA38F]/20" id="live-dynamic-timer">
            <Clock className="w-3.5 h-3.5 text-[#E8D5B5]" />
            <span>{currentTime.toLocaleDateString()}</span>
            <span className="text-white font-bold">{currentTime.toLocaleTimeString()}</span>
          </div>
          <button 
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1 px-3 py-1.5 bg-[#4A5240] hover:bg-rose-950 border border-[#8FA38F]/20 hover:border-rose-900 text-white rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
            title="Lock shift register"
          >
            <Lock className="w-3.5 h-3.5 text-[#E8D5B5]" />
            <span>Lock Shift</span>
          </button>
        </div>
      </header>

      {/* TABS SELECTOR / INJECTION HUB */}
      <div className="bg-white border-b border-slate-200 px-6 py-1 flex items-center justify-between shrink-0 overflow-x-auto scrollbar-thin" id="applet-tabs-rail">
        <nav className="flex gap-1.5 py-1">
          {/* Checkout tab */}
          <button
            onClick={() => setCurrentTab('checkout')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              currentTab === 'checkout' 
                ? 'bg-[#E8D5B5]/35 text-[#5A5A40] border-b border-[#5A5A40]' 
                : 'text-slate-500 hover:text-[#5A5A40] hover:bg-[#F9F7F2]'
            }`}
            id="tab-opt-checkout"
          >
            <ShoppingBag className="w-4 h-4" />
            Checkout lane
          </button>

          {/* Business Analytics tab */}
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              currentTab === 'dashboard' 
                ? 'bg-[#E8D5B5]/35 text-[#5A5A40] border-b border-[#5A5A40]' 
                : 'text-slate-500 hover:text-[#5A5A40] hover:bg-[#F9F7F2]'
            }`}
            id="tab-opt-dashboard"
          >
            <TrendingUp className="w-4 h-4" />
            Analytics Dashboard
          </button>

          {/* Core Inventory Directory tab */}
          <button
            onClick={() => setCurrentTab('inventory')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              currentTab === 'inventory' 
                ? 'bg-[#E8D5B5]/35 text-[#5A5A40] border-b border-[#5A5A40]' 
                : 'text-slate-500 hover:text-[#5A5A40] hover:bg-[#F9F7F2]'
            }`}
            id="tab-opt-inventory"
          >
            <Package className="w-4 h-4" />
            Stock Directory
            {lowStockCount > 0 && (
              <span className="bg-[#5A5A40] text-white font-mono text-[9px] px-1.5 py-0.5 rounded-full font-bold ml-1">
                {lowStockCount}
              </span>
            )}
          </button>

          {/* Invoice logs tab */}
          <button
            onClick={() => setCurrentTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              currentTab === 'history' 
                ? 'bg-[#E8D5B5]/35 text-[#5A5A40] border-b border-[#5A5A40]' 
                : 'text-slate-500 hover:text-[#5A5A40] hover:bg-[#F9F7F2]'
            }`}
            id="tab-opt-history"
          >
            <FileText className="w-4 h-4" />
            Invoice Journal
          </button>

          {/* Customers CRM tab */}
          <button
            onClick={() => setCurrentTab('customers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              currentTab === 'customers' 
                ? 'bg-[#E8D5B5]/35 text-[#5A5A40] border-b border-[#5A5A40]' 
                : 'text-slate-500 hover:text-[#5A5A40] hover:bg-[#F9F7F2]'
            }`}
            id="tab-opt-customers"
          >
            <Users className="w-4 h-4" />
            Loyalty CRM
          </button>

          {/* Register Settings tab */}
          <button
            onClick={() => setCurrentTab('settings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              currentTab === 'settings' 
                ? 'bg-[#E8D5B5]/35 text-[#5A5A40] border-b border-[#5A5A40]' 
                : 'text-slate-500 hover:text-[#5A5A40] hover:bg-[#F9F7F2]'
            }`}
            id="tab-opt-settings"
          >
            <Settings className="w-4 h-4" />
            Config settings
          </button>
        </nav>
      </div>

      {/* ACTIVE SCREEN RENDERER WITH SMOOTH ANIMATIONS */}
      <main className="flex-1 overflow-y-auto px-6 py-6 bg-[#FDFCFB]" id="applet-viewport-mount">
        <div className="h-full">
          {isTabRestricted ? (
            <RestrictedOverridePanel 
              onCancel={() => setCurrentTab('checkout')}
              onOverrideSuccess={() => {
                const elena = MOCK_USERS.find(user => user.role === 'Admin');
                if (elena) {
                  handleLogin(elena);
                  alert("Authorization Approved: Switch active POS session to Elena Rodriguez (Admin).");
                }
              }}
            />
          ) : (
            <>
              {currentTab === 'checkout' && (
                <CartManager 
                  products={products}
                  customers={customers}
                  settings={settings}
                  heldCarts={heldCarts}
                  onHoldCart={handleHoldCart}
                  onRecallCart={handleRecallCart}
                  onDeleteHeldCart={handleDeleteHeldCart}
                  onCheckoutSuccess={handleCheckoutSuccess}
                  currencySymbol={settings.currencySymbol}
                />
              )}

              {currentTab === 'dashboard' && (
                <Dashboard 
                  sales={sales}
                  products={products}
                  currencySymbol={settings.currencySymbol}
                />
              )}

              {currentTab === 'inventory' && (
                <InventoryManager 
                  products={products}
                  onAddProduct={handleAddProduct}
                  onUpdateProduct={handleUpdateProduct}
                  onDeleteProduct={handleDeleteProduct}
                  onResetToMock={handleResetToMock}
                  currencySymbol={settings.currencySymbol}
                />
              )}

              {currentTab === 'history' && (
                <HistoryManager 
                  sales={sales}
                  settings={settings}
                  onRefundSale={handleRefundSale}
                  currencySymbol={settings.currencySymbol}
                  isAdmin={currentUser.role === 'Admin'}
                />
              )}

              {currentTab === 'customers' && (
                <CustomerManager 
                  customers={customers}
                  onAddCustomer={handleAddCustomer}
                  onUpdateCustomer={handleUpdateCustomer}
                />
              )}

              {currentTab === 'settings' && (
                <SettingsManager 
                  settings={settings}
                  onUpdateSettings={handleUpdateSettings}
                  onClearAllData={handleClearAllData}
                  onResetToMock={handleResetToMock}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
