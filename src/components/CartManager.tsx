import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Product, CartItem, Customer, HoldCart, StoreSettings } from '../types';
import { INITIAL_CATEGORIES } from '../data/mockData';
import PaymentSimulator from './PaymentSimulator';
import { 
  Plus, 
  Minus, 
  Trash2, 
  Search, 
  Barcode, 
  UserPlus, 
  ChevronRight, 
  CreditCard, 
  DollarSign, 
  Smartphone, 
  Award, 
  Check, 
  Pause, 
  FolderSync, 
  Gift, 
  ArrowRight,
  Sparkles,
  RefreshCw,
  ShoppingBag,
  Percent,
  X,
  FileText,
  Scan,
  User,
  Tags
} from 'lucide-react';

interface CartManagerProps {
  products: Product[];
  customers: Customer[];
  settings: StoreSettings;
  heldCarts: HoldCart[];
  onHoldCart: (name: string, items: CartItem[], customerId?: string) => void;
  onRecallCart: (id: string) => void;
  onDeleteHeldCart: (id: string) => void;
  onCheckoutSuccess: (items: CartItem[], totalPayments: { method: 'cash' | 'card' | 'mobile' | 'gift_card'; amount: number; reference?: string }[], customer?: Customer, notes?: string) => void;
  currencySymbol: string;
}

export default function CartManager({
  products,
  customers,
  settings,
  heldCarts,
  onHoldCart,
  onRecallCart,
  onDeleteHeldCart,
  onCheckoutSuccess,
  currencySymbol
}: CartManagerProps) {
  
  // Shopping cart internal state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [productSearch, setProductSearch] = useState('');
  
  // Active Customer state linked to current cart
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [isCustomerSelectorOpen, setIsCustomerSelectorOpen] = useState(false);

  // Draft hold cart prompt states
  const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);
  const [holdCartName, setHoldCartName] = useState('');
  const [isRecallDrawerOpen, setIsRecallDrawerOpen] = useState(false);

  // Simulated Barcode laser keypress input
  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcodeMatchFlash, setBarcodeMatchFlash] = useState(false);

  // General checkout / payment modal states
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [cartNotes, setCartNotes] = useState('');
  const [simulatorConfig, setSimulatorConfig] = useState<{ method: 'card' | 'mobile'; amount: number } | null>(null);
  
  // Split payment allocations
  const [cashPayAmount, setCashPayAmount] = useState<number>(0);
  const [cardPayAmount, setCardPayAmount] = useState<number>(0);
  const [mobilePayAmount, setMobilePayAmount] = useState<number>(0);
  const [giftPayAmount, setGiftPayAmount] = useState<number>(0);

  const [cashReference, setCashReference] = useState('');
  const [cardReference, setCardReference] = useState('');
  const [mobileReference, setMobileReference] = useState('');
  const [giftReference, setGiftReference] = useState('');

  // General coupon percentage
  const [generalDiscountPercentage, setGeneralDiscountPercentage] = useState<number>(0);

  // Focus element
  const barcodeFocusRef = useRef<HTMLInputElement>(null);

  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  // Filter products matching search keyword or selected category tab
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = 
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.barcode.toLowerCase().includes(productSearch.toLowerCase());
      
      const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, productSearch, activeCategory]);

  // CRM searching
  const filteredCustomers = useMemo(() => {
    if (!customerSearchQuery.trim()) return customers;
    return customers.filter(c => 
      c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
      c.phone.includes(customerSearchQuery) ||
      c.email.toLowerCase().includes(customerSearchQuery.toLowerCase())
    );
  }, [customers, customerSearchQuery]);

  // Simulated Quick Barcode Scanning Function
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const barcode = barcodeInput.trim();
    if (!barcode) return;

    const matchedProduct = products.find(p => p.barcode === barcode || p.sku.toLowerCase() === barcode.toLowerCase());
    
    if (matchedProduct) {
      if (matchedProduct.stock === 0) {
        alert(`Warning: "${matchedProduct.name}" is currently out of stock. Standard retail policy blocks sale override.`);
        setBarcodeInput('');
        return;
      }
      
      // Flash feedback
      setBarcodeMatchFlash(true);
      setTimeout(() => setBarcodeMatchFlash(false), 300);

      handleAddToCart(matchedProduct);
      setBarcodeInput('');
    } else {
      alert(`Barcode SKU "${barcode}" not matching any catalog assets.`);
    }
  };

  // Add Item to Cart
  const handleAddToCart = (product: Product) => {
    if (product.stock === 0) {
      alert(`Warning: "${product.name}" is currently out of stock.`);
      return;
    }

    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      
      if (existing) {
        // Enforce maximum stock limit
        if (existing.quantity >= product.stock) {
          alert(`Quantity Limit Exceeded: Only ${product.stock} units of "${product.name}" remain physically in inventory.`);
          return prev;
        }
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, { product, quantity: 1, discountPercentage: 0 }];
      }
    });
  };

  // Adjust cart quantity
  const handleUpdateProductQty = (prodId: string, value: number) => {
    const originalProd = products.find(p => p.id === prodId)!;
    
    setCartItems(prev => {
      return prev.map(item => {
        if (item.product.id === prodId) {
          const nextQty = Math.max(1, item.quantity + value);
          if (nextQty > originalProd.stock) {
            alert(`Stock limit reached! Only ${originalProd.stock} units are currently in register inventory.`);
            return item;
          }
          return { ...item, quantity: nextQty };
        }
        return item;
      });
    });
  };

  // Adjust direct item discount
  const handleUpdateProductDiscount = (prodId: string, pct: number) => {
    const clampedDiscount = Math.min(100, Math.max(0, pct));
    setCartItems(prev => {
      return prev.map(item => 
        item.product.id === prodId 
          ? { ...item, discountPercentage: clampedDiscount }
          : item
      );
    });
  };

  // Remove individual line
  const handleRemoveCartItem = (prodId: string) => {
    setCartItems(prev => prev.filter(item => item.product.id !== prodId));
  };

  // Clear shopping cart
  const handleClearCart = () => {
    if (cartItems.length > 0 && confirm("Erase current bag contents?")) {
      setCartItems([]);
      setSelectedCustomerId('');
      setGeneralDiscountPercentage(0);
    }
  };

  // Financial Computations
  const subtotalSum = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const lineCost = item.product.price * item.quantity;
      const lineDiscount = lineCost * (item.discountPercentage / 100);
      return sum + (lineCost - lineDiscount);
    }, 0);
  }, [cartItems]);

  const generalDiscountAmount = useMemo(() => {
    return subtotalSum * (generalDiscountPercentage / 100);
  }, [subtotalSum, generalDiscountPercentage]);

  const finalSubtotalWithDiscounts = useMemo(() => {
    return Math.max(0, subtotalSum - generalDiscountAmount);
  }, [subtotalSum, generalDiscountAmount]);

  const taxAmountValue = useMemo(() => {
    return finalSubtotalWithDiscounts * (settings.taxRate / 100);
  }, [finalSubtotalWithDiscounts, settings.taxRate]);

  const netTotalSum = useMemo(() => {
    return finalSubtotalWithDiscounts + taxAmountValue;
  }, [finalSubtotalWithDiscounts, taxAmountValue]);

  // Points that would be gained by customer on this order
  const potentialLoyaltyGain = useMemo(() => {
    return Math.floor(netTotalSum * (settings.loyaltyPointsPercent / 100));
  }, [netTotalSum, settings.loyaltyPointsPercent]);

  // Draft/Hold carts utilities
  const handleHoldCartSubmit = () => {
    if (!holdCartName.trim()) {
      alert("Please provide a valid ticket or table name.");
      return;
    }
    onHoldCart(holdCartName.trim(), cartItems, selectedCustomerId || undefined);
    setCartItems([]);
    setSelectedCustomerId('');
    setGeneralDiscountPercentage(0);
    setHoldCartName('');
    setIsHoldModalOpen(false);
    alert("Basket suspended successfully. Retrieve anytime from Hold queue!");
  };

  const handleRecallCartItem = (id: string) => {
    const target = heldCarts.find(h => h.id === id);
    if (!target) return;

    // Load checkout items
    setCartItems(target.items);
    if (target.customerId) {
      setSelectedCustomerId(target.customerId);
    } else {
      setSelectedCustomerId('');
    }
    onDeleteHeldCart(id);
    setIsRecallDrawerOpen(false);
  };

  // Open checkout modal
  const handleOpenCheckoutModal = () => {
    if (cartItems.length === 0) return;
    
    // Auto populate cash/card to match total initially
    setCashPayAmount(parseFloat(netTotalSum.toFixed(2)));
    setCardPayAmount(0);
    setMobilePayAmount(0);
    setGiftPayAmount(0);

    setCashReference('');
    setCardReference('');
    setMobileReference('');
    setGiftReference('');

    setCartNotes('');
    setIsCheckoutOpen(true);
  };

  // Split checkout calculations
  const totalAllocatedPayments = useMemo(() => {
    return (cashPayAmount || 0) + (cardPayAmount || 0) + (mobilePayAmount || 0) + (giftPayAmount || 0);
  }, [cashPayAmount, cardPayAmount, mobilePayAmount, giftPayAmount]);

  const cashChangeReturn = useMemo(() => {
    const diff = totalAllocatedPayments - netTotalSum;
    return diff > 0 ? parseFloat(diff.toFixed(2)) : 0;
  }, [totalAllocatedPayments, netTotalSum]);

  const remainingBalanceAmount = useMemo(() => {
    const balance = netTotalSum - totalAllocatedPayments;
    return balance > 0 ? parseFloat(balance.toFixed(2)) : 0;
  }, [netTotalSum, totalAllocatedPayments]);

  const handleSimulationSuccess = (ref: string) => {
    if (!simulatorConfig) return;
    const currentMethod = simulatorConfig.method;
    setSimulatorConfig(null);

    if (currentMethod === 'card') {
      setCardReference(ref);
      // Auto-trigger completion or next step in next tick
      setTimeout(() => {
        alert("Simulated Card Payment Successful!");
      }, 50);
    } else {
      setMobileReference(ref);
      setTimeout(() => {
        alert("Simulated Contactless Mobile Payment Successful!");
      }, 50);
    }
  };

  const handleCompleteCheckout = () => {
    if (remainingBalanceAmount > 0) {
      alert(`Remaining bill balance of ${currencySymbol}${remainingBalanceAmount.toFixed(2)} must be fully settled before printing ticket.`);
      return;
    }

    // Trigger credit/debit card simulation
    if (cardPayAmount > 0 && !cardReference) {
      setSimulatorConfig({ method: 'card', amount: cardPayAmount });
      return;
    }

    // Trigger Apple Pay / Google Pay / mobile simulation
    if (mobilePayAmount > 0 && !mobileReference) {
      setSimulatorConfig({ method: 'mobile', amount: mobilePayAmount });
      return;
    }

    // Capture valid payment modes
    const payments = [];
    if (cashPayAmount > 0) {
      // If cash change is computed, only register the net payment
      const actualCash = cashPayAmount - cashChangeReturn;
      if (actualCash > 0) {
        payments.push({ method: 'cash' as const, amount: parseFloat(actualCash.toFixed(2)), reference: cashReference.trim() || undefined });
      }
    }
    if (cardPayAmount > 0) {
      payments.push({ method: 'card' as const, amount: cardPayAmount, reference: cardReference.trim() || 'SIM_CARD_OK' });
    }
    if (mobilePayAmount > 0) {
      payments.push({ method: 'mobile' as const, amount: mobilePayAmount, reference: mobileReference.trim() || 'SIM_MOBILE_OK' });
    }
    if (giftPayAmount > 0) {
      // Loyalty deduction check
      if (selectedCustomer && selectedCustomer.loyaltyPoints < giftPayAmount * 100) {
        const affordable = selectedCustomer.loyaltyPoints / 100;
        alert(`CRM Over-draft: Adrian Vance only holds ${selectedCustomer.loyaltyPoints} points, converting to max ${currencySymbol}${affordable.toFixed(2)}. Modify split values.`);
        return;
      }
      payments.push({ method: 'gift_card' as const, amount: giftPayAmount, reference: giftReference.trim() || undefined });
    }

    onCheckoutSuccess(
      cartItems,
      payments,
      selectedCustomer,
      cartNotes.trim() || undefined
    );

    // Clear active bag and payment fields
    setCartItems([]);
    setSelectedCustomerId('');
    setGeneralDiscountPercentage(0);
    setCashPayAmount(0);
    setCardPayAmount(0);
    setMobilePayAmount(0);
    setGiftPayAmount(0);
    setCardReference('');
    setMobileReference('');
    setCashReference('');
    setGiftReference('');
    setCartNotes('');
    setIsCheckoutOpen(false);
  };

  const formatCurrency = (val: number) => {
    return `${currencySymbol}${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getMatTheme = (clr?: string) => {
    switch (clr) {
      case 'emerald': return 'border-emerald-100 hover:border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50';
      case 'amber': return 'border-amber-100 hover:border-amber-300 bg-amber-50/50 hover:bg-amber-50';
      case 'rose': return 'border-rose-100 hover:border-rose-300 bg-rose-50/50 hover:bg-rose-50';
      case 'violet': return 'border-violet-100 hover:border-violet-300 bg-violet-50/50 hover:bg-violet-50';
      case 'indigo': return 'border-indigo-100 hover:border-indigo-300 bg-indigo-50/50 hover:bg-indigo-50';
      case 'cyan': return 'border-cyan-100 hover:border-cyan-300 bg-cyan-50/50 hover:bg-cyan-50';
      default: return 'border-slate-100 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-130px)] items-stretch" id="terminal-viewport">
      
      {/* LEFT COLUMN: Fast Product Grid & Suspended list triggers (col-span-7) */}
      <div className="lg:col-span-7 flex flex-col justify-between space-y-4 h-full overflow-hidden" id="left-item-explorer">
        
        {/* Search controls & suspend bar */}
        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-3xs flex flex-wrap gap-2 justify-between items-center" id="search-suspend-lane">
          <div className="relative flex-1 min-w-44">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input 
              type="text" 
              placeholder="Search products by sku, label, name..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1 text-xs border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-sky-500 font-sans cursor-text"
              id="search-catalog-product"
            />
          </div>

          <div className="flex gap-2">
            {/* Suspended Carts Recall trigger */}
            <button 
              onClick={() => setIsRecallDrawerOpen(true)}
              className="px-3 py-1.5 bg-slate-100 font-semibold text-slate-600 hover:bg-slate-200/80 hover:text-slate-800 border border-slate-200 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              id="suspend-recall-button"
            >
              <FolderSync className="w-3.5 h-3.5" />
              Recall Bill
              {heldCarts.length > 0 && (
                <span className="bg-indigo-600 text-white font-mono text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center animate-pulse">
                  {heldCarts.length}
                </span>
              )}
            </button>

            {/* Quick barcode test input */}
            <form onSubmit={handleBarcodeSubmit} className="flex border border-slate-200 rounded-lg overflow-hidden bg-slate-50" id="barcode-scan-lane">
              <span className="bg-slate-100 text-slate-600 px-2 py-1.5 text-xs flex items-center">
                <Barcode className="w-4 h-4 text-slate-400" />
              </span>
              <input 
                type="text" 
                placeholder="Scan / SKU code..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                className={`w-28 text-xs font-mono font-semibold text-slate-700 px-2 select-text bg-white border-0 focus:outline-hidden focus:ring-1 focus:ring-sky-500`}
                title="Enter mock barcodes e.g., 88011221, 88011223, 88011225"
                id="barcode-emulator-input"
              />
              <button 
                type="submit"
                className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-2.5 hover:text-white transition-colors cursor-pointer"
              >
                Scan
              </button>
            </form>
          </div>
        </div>

        {/* Category Horizontal Filter Swiper */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-[100vw] scrollbar-thin" id="category-swipes">
          {INITIAL_CATEGORIES.map(cat => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`py-1.5 px-3 rounded-lg border text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive 
                    ? 'border-sky-600 bg-sky-600 text-white shadow-xs' 
                    : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-800'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 md:grid-cols-3 gap-3 border border-slate-100 border-dashed rounded-xl p-2 bg-slate-50/20" id="products-catalog-grid">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Barcode className="w-10 h-10 stroke-1" />
              <p className="text-xs">No active assets found under search/filter criteria.</p>
            </div>
          ) : (
            filteredProducts.map((p) => {
              const isLow = p.stock <= p.lowStockThreshold;
              const isOut = p.stock === 0;

              return (
                <div 
                  key={p.id}
                  onClick={() => !isOut && handleAddToCart(p)}
                  className={`border p-3.5 rounded-2xl transition-all cursor-pointer select-none h-fit flex flex-col justify-between ${getMatTheme(p.color)} ${
                    isOut ? 'opacity-45 pointer-events-none' : ''
                  }`}
                  id={`grid-product-${p.id}`}
                >
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">{p.category}</span>
                    <h3 className="font-bold text-slate-800 leading-tight line-clamp-2 h-8 text-xs">{p.name}</h3>
                  </div>

                  <div className="flex justify-between items-end mt-4">
                    <span className="text-sm font-black text-slate-850 text-slate-800">
                      {formatCurrency(p.price)}
                    </span>
                    
                    <div className="text-right">
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-sm ${
                        isOut 
                          ? 'bg-rose-100 text-rose-800' 
                          : isLow 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-emerald-50 text-emerald-800'
                      }`}>
                        {isOut ? 'SOLD OUT' : `${p.stock} units`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Visual match badge */}
        {barcodeMatchFlash && (
          <div className="p-2.5 bg-emerald-600 text-white text-center text-xs font-bold rounded-lg animate-pulse" id="scan-sound-emulator">
            ⚡️ BARCODE ACQUIRED: ITEM MOUNTED IN CHECKOUT CART ⚡️
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Interactive Cart Lane (col-span-5) */}
      <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col justify-between h-full overflow-hidden" id="cart-lane-sidebar">
        {/* Customer selection header */}
        <div className="space-y-3 pb-3 border-b border-slate-100" id="cart-crm-section">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" /> Linked Customer Account
            </span>
            {selectedCustomerId && (
              <button 
                onClick={() => setSelectedCustomerId('')}
                className="text-[10px] hover:text-rose-600 text-slate-400 flex items-center font-bold cursor-pointer"
              >
                Sever loyalty
              </button>
            )}
          </div>

          <div className="relative">
            {selectedCustomer ? (
              <div 
                onClick={() => setIsCustomerSelectorOpen(true)}
                className="w-full flex items-center justify-between p-2.5 border border-emerald-100 bg-emerald-50/40 rounded-xl cursor-pointer hover:bg-emerald-50"
              >
                <div className="flex gap-2 items-center">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">
                    {selectedCustomer.name.split(' ').map(n=>n[0]).join('')}
                  </div>
                  <div className="min-w-0">
                    <span className="font-extrabold text-xs block text-emerald-900 truncate max-w-32">{selectedCustomer.name}</span>
                    <span className="text-[9px] text-emerald-600 block">{selectedCustomer.phone}</span>
                  </div>
                </div>
                <div className="text-right text-[10px] font-mono">
                  <span className="font-bold text-emerald-800">{selectedCustomer.loyaltyPoints} Pts</span>
                  <p className="text-[8px] text-slate-400">Balance</p>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setIsCustomerSelectorOpen(true)}
                className="w-full flex items-center justify-between p-2.5 border border-slate-200 border-dashed rounded-xl cursor-pointer hover:bg-slate-50 transition-colors text-slate-500 text-xs"
              >
                <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                  <UserPlus className="w-4 h-4 text-slate-400" /> Link Loyalty Member or Cash-back ID
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            )}

            {/* Custom CRM Dropdown Panel */}
            {isCustomerSelectorOpen && (
              <div className="absolute top-12 left-0 right-0 bg-white border border-slate-200 shadow-xl rounded-xl z-20 p-3 space-y-2 animate-scale-up">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">Search Member Account</span>
                  <button onClick={() => setIsCustomerSelectorOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <input 
                  type="text" 
                  placeholder="Type name, email, or telephone line..."
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden"
                />

                <div className="max-h-40 overflow-y-auto space-y-1">
                  {filteredCustomers.length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic text-center py-4">No registered loyalty match.</p>
                  ) : (
                    filteredCustomers.map(cust => (
                      <div
                        key={cust.id}
                        onClick={() => {
                          setSelectedCustomerId(cust.id);
                          setIsCustomerSelectorOpen(false);
                          setCustomerSearchQuery('');
                        }}
                        className="p-1.5 hover:bg-slate-50 rounded-lg flex justify-between items-center cursor-pointer"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-700">{cust.name}</p>
                          <p className="text-[9px] text-slate-400">{cust.phone} | {cust.email}</p>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-sm font-bold">
                          {cust.loyaltyPoints} Pts
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Cart itemizer roll */}
        <div className="flex-1 overflow-y-auto py-2 space-y-2" id="bag-itemizer-scroller">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center text-slate-400 gap-2 border border-dashed rounded-xl bg-slate-50/40">
              <ShoppingBag className="w-10 h-10 stroke-1 text-slate-300 pointer-events-none" />
              <div className="text-center">
                <span className="text-xs font-semibold block text-slate-500">Cart Empty</span>
                <p className="text-[10px] text-slate-400 mt-0.5">Click products on left grid or scan simulated UPC.</p>
              </div>
            </div>
          ) : (
            cartItems.map((item) => {
              const lineCostMultiplier = item.product.price * item.quantity;
              const lineDiscountValue = lineCostMultiplier * (item.discountPercentage / 100);
              const afterLineCost = lineCostMultiplier - lineDiscountValue;

              return (
                <div 
                  key={item.product.id} 
                  className="bg-slate-50 rounded-xl p-2.5 border border-slate-150 flex items-center justify-between gap-3 relative hover:border-slate-300 transition-colors"
                  id={`checkout-item-${item.product.id}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-start gap-1">
                      <span className="font-extrabold text-xs text-slate-800 truncate block">{item.product.name}</span>
                      <button 
                        onClick={() => handleRemoveCartItem(item.product.id)}
                        className="text-slate-450 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Deduct full line items"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {formatCurrency(item.product.price)} / unit
                    </p>

                    {/* Quantity Adjustment + Line Percent Discounts */}
                    <div className="flex items-center justify-between gap-2 mt-2">
                      <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-md p-0.5">
                        <button
                          onClick={() => handleUpdateProductQty(item.product.id, -1)}
                          className="w-5 h-5 rounded-sm hover:bg-slate-100 flex items-center justify-center font-bold font-mono text-xs cursor-pointer text-slate-600"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold font-mono text-slate-700 min-w-4 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateProductQty(item.product.id, 1)}
                          className="w-5 h-5 rounded-sm hover:bg-slate-100 flex items-center justify-center font-bold font-mono text-xs cursor-pointer text-slate-600"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Interactive percentage discounts input */}
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Disc:</span>
                        <div className="relative">
                          <input 
                            type="number" 
                            min="0"
                            max="100"
                            value={item.discountPercentage || ''}
                            placeholder="0"
                            onChange={(e) => handleUpdateProductDiscount(item.product.id, Number(e.target.value))}
                            className="w-12 text-[10px] text-center p-0.5 border border-slate-200 rounded-md bg-white pr-3 font-mono text-rose-700 font-black focus:outline-hidden"
                            title="Item Discount %"
                          />
                          <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 font-mono">%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Financial final ledger for line item */}
                  <div className="text-right flex-shrink-0">
                    {item.discountPercentage > 0 && (
                      <span className="text-[9px] text-rose-500 font-bold block line-through">
                        {formatCurrency(lineCostMultiplier)}
                      </span>
                    )}
                    <span className="font-extrabold text-xs text-slate-800 font-mono block">
                      {formatCurrency(afterLineCost)}
                    </span>
                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* SUSPENSION HOLD / CANCEL ROW */}
        {cartItems.length > 0 && (
          <div className="flex gap-2 py-2 max-h-12 border-t border-slate-100" id="suspend-clear-row">
            <button
              onClick={() => setIsHoldModalOpen(true)}
              className="flex-1 py-1.5 bg-yellow-50 text-yellow-700 hover:bg-yellow-105 active:bg-yellow-200 border border-yellow-200 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              title="Suspend cart sale for queue busting"
            >
              <Pause className="w-3.5 h-3.5" /> Suspend Bill
            </button>
            <button
              onClick={handleClearCart}
              className="py-1.5 px-3 border border-slate-201 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold cursor-pointer"
            >
              Clear Cart
            </button>
          </div>
        )}

        {/* BOTTOM METRICS IN CHECKOUT COLUMN */}
        <div className="bg-slate-50/50 p-4 border-t border-slate-150 rounded-2xl space-y-3" id="cart-reckon-pane">
          {/* General Cart discount controller */}
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 flex items-center gap-1 font-semibold text-[11px] uppercase tracking-wider">
              <Tags className="w-3.5 h-3.5 text-slate-400" /> Apply Coupon Discount
            </span>
            <div className="relative">
              <input 
                type="number" 
                min="0"
                max="100"
                value={generalDiscountPercentage || ''}
                placeholder="0"
                onChange={(e) => setGeneralDiscountPercentage(Math.min(100, Math.max(0, Number(e.target.value))))}
                className="w-14 text-center py-0.5 border border-slate-200 bg-white rounded-md text-slate-800 font-mono font-bold text-xs"
              />
              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-[9px] font-bold">%</span>
            </div>
          </div>

          <div className="divider border-t border-slate-100 my-1"></div>

          {/* Financial calculations values */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-500 font-medium">
              <span>Gross Subtotal:</span>
              <span className="font-mono">{formatCurrency(subtotalSum)}</span>
            </div>
            {generalDiscountPercentage > 0 && (
              <div className="flex justify-between text-rose-600 font-bold">
                <span>Coupon ({generalDiscountPercentage}%):</span>
                <span className="font-mono">-{formatCurrency(generalDiscountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-500 font-medium">
              <span>Tax Amount ({settings.taxRate}%):</span>
              <span className="font-mono">{formatCurrency(taxAmountValue)}</span>
            </div>
            <div className="flex justify-between text-slate-800 font-black text-sm pt-1 border-t border-slate-200">
              <span className="text-zinc-700 font-extrabold">Net Total:</span>
              <span className="font-mono text-sky-800 text-base">{formatCurrency(netTotalSum)}</span>
            </div>
          </div>

          {/* Loyalty earned indicator */}
          {selectedCustomerId && (
            <div className="flex items-center justify-between p-2 bg-emerald-50 rounded-xl text-[10px] text-emerald-800 border border-emerald-100">
              <span className="flex items-center gap-1 font-bold">
                <Gift className="w-3.5 h-3.5 text-emerald-600" /> Member Rewards gain:
              </span>
              <span className="font-mono font-black">+{potentialLoyaltyGain} loyalty points</span>
            </div>
          )}

          {/* Process pay button */}
          <button 
            onClick={handleOpenCheckoutModal}
            disabled={cartItems.length === 0}
            className={`w-full py-3 rounded-2xl font-black text-sm tracking-wide shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              cartItems.length > 0
                ? 'bg-sky-600 text-white hover:bg-sky-700 active:bg-sky-800 scale-[1.01]'
                : 'bg-slate-100 border border-slate-200 text-slate-400 pointer-events-none'
            }`}
            id="proceed-payment-button"
          >
            <span>Proceed to Payment</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* SUSPEND SUSPENSION BASKET PROMPT MODAL */}
      {isHoldModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-scale-up">
            <div className="flex justify-between items-center bg-slate-50 px-4 py-3 border-b border-slate-150">
              <span className="text-xs font-bold text-slate-650 uppercase tracking-wider flex items-center gap-1.5 text-slate-705">
                <Pause className="w-4 h-4 text-yellow-600" /> Hold Sale Ticket / Suspend Bill
              </span>
              <button onClick={() => setIsHoldModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Suspend ID Code / Label Name *</label>
                <input 
                  type="text" 
                  placeholder="e.g., Table 4 Lunch, Call Ticket Adrian"
                  value={holdCartName}
                  onChange={(e) => setHoldCartName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 text-xs pt-1">
                <button 
                  onClick={() => setIsHoldModalOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-200 text-slate-500 rounded-md hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleHoldCartSubmit}
                  className="px-4 py-1.5 bg-yellow-600 text-white font-bold rounded-md hover:bg-yellow-700 shadow-3xs"
                >
                  Suspend Bill
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RECALL SUSPENDED BILL DRAWER SIDEBAR */}
      {isRecallDrawerOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex justify-end" id="recall-bill-drawer">
          <div className="bg-white w-full max-w-sm h-full p-5 flex flex-col justify-between shadow-2xl animate-slide-in">
            <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <FolderSync className="w-4 h-4 text-sky-500" /> Suspended Sale Bills
                </h3>
                <button 
                  onClick={() => setIsRecallDrawerOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {heldCarts.length === 0 ? (
                  <p className="text-slate-400 text-xs italic text-center py-12">No current suspened sales queue.</p>
                ) : (
                  heldCarts.map(cart => {
                    const custName = customers.find(c => c.id === cart.customerId)?.name;
                    const itemsLabel = cart.items.map(i => `${i.product.name} (x${i.quantity})`).join(', ');

                    return (
                      <div 
                        key={cart.id}
                        className="bg-slate-50 hover:bg-slate-100 p-3 rounded-xl border border-slate-200 transition-colors flex flex-col justify-between"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-extrabold text-xs text-slate-800 block">{cart.name}</span>
                            <span className="text-[9px] text-slate-400 font-mono italic block mt-0.5">
                              On: {new Date(cart.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          
                          <div className="flex gap-1">
                            <button
                              onClick={() => onDeleteHeldCart(cart.id)}
                              className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-md cursor-pointer transition-colors"
                              title="Delete suspention record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleRecallCartItem(cart.id)}
                              className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-md text-[10px] font-bold cursor-pointer"
                            >
                              Recall Bill
                            </button>
                          </div>
                        </div>

                        {/* Summary lines of Suspended items */}
                        <p className="text-[10px] text-slate-500 truncate max-w-80 mt-1" title={itemsLabel}>
                          <strong className="text-slate-700">{cart.items.length} lines:</strong> {itemsLabel}
                        </p>
                        {custName && (
                          <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded-sm w-[fit-content] mt-2">
                            👤 {custName}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            
            <div className="pt-4 border-t border-slate-100">
              <button 
                onClick={() => setIsRecallDrawerOpen(false)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Close suspended list
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CORE SPLIT PAYMENT CHECKOUT FLOW MODAL */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto" id="checkout-drawer-modal">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-2xl overflow-hidden animate-scale-up my-8 max-h-[90vh] flex flex-col justify-between">
            
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex justify-between items-center flex-shrink-0">
              <div>
                <h2 className="font-bold text-slate-800 text-sm">Register Till Checkout</h2>
                <p className="text-[10px] text-slate-400">Specify payment split ratios, Cash change calculators and invoice notes.</p>
              </div>
              <button 
                onClick={() => setIsCheckoutOpen(false)}
                className="text-slate-400 hover:text-slate-600 bg-white border border-slate-200 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6" id="checkout-fields">
              
              {/* Left checkout column: Outstanding Bill & Payment Splits */}
              <div className="space-y-4">
                
                {/* Outstanding amount visualizer header */}
                <div className="p-4 bg-sky-900 text-white rounded-2xl flex flex-col justify-between space-y-2 shadow-xs">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-sky-200">Current Outstanding Bill</span>
                  <div className="flex justify-between items-end">
                    <h3 className="text-3xl font-black font-mono tracking-tight leading-none">
                      {formatCurrency(netTotalSum)}
                    </h3>
                    <div className="text-right text-[10px] text-sky-100 font-medium">
                      <span>Gross subtotal: {formatCurrency(finalSubtotalWithDiscounts)}</span>
                      <p>Taxes ({settings.taxRate}%): {formatCurrency(taxAmountValue)}</p>
                    </div>
                  </div>
                </div>

                {/* Splitting entries */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Configure Splits</span>
                    <button 
                      onClick={() => {
                        // Quick Reset
                        setCashPayAmount(0);
                        setCardPayAmount(0);
                        setMobilePayAmount(0);
                        setGiftPayAmount(0);
                      }}
                      className="text-[9px] text-indigo-600 font-bold hover:underline"
                    >
                      Clear Splits
                    </button>
                  </div>

                  {/* Cash Pay Option */}
                  <div className="space-y-1.5 p-2 bg-slate-50/50 rounded-xl border border-slate-150">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4 text-emerald-500" /> Cash Till
                      </span>
                      <button 
                        onClick={() => {
                          setCashPayAmount(remainingBalanceAmount > 0 ? remainingBalanceAmount : netTotalSum);
                        }}
                        className="text-[9px] text-sky-600 font-bold hover:underline"
                      >
                        Match Left
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="number" 
                        step="0.01"
                        min="0"
                        value={cashPayAmount || ''}
                        onChange={(e) => setCashPayAmount(Math.max(0, Number(e.target.value)))}
                        className="w-full text-xs font-bold font-mono px-2 py-1 bg-white border border-slate-200 rounded-md focus:outline-hidden text-emerald-700"
                        placeholder="0.00"
                      />
                      <input 
                        type="text" 
                        value={cashReference}
                        onChange={(e) => setCashReference(e.target.value)}
                        className="w-full text-[10px] px-2 py-1 bg-white border border-slate-200 rounded-md focus:outline-hidden"
                        placeholder="Register ref ID"
                      />
                    </div>
                    {/* Quick Cash helpers */}
                    <div className="flex gap-1.5 flex-wrap pt-0.5" id="quick-cash-helpers">
                      {[1, 5, 10, 20, 50, 100].map(cashVal => (
                        <button
                          key={cashVal}
                          type="button"
                          onClick={() => {
                            setCashPayAmount(prev => parseFloat((prev + cashVal).toFixed(2)));
                          }}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-[#E8D5B5]/20 border border-slate-200 hover:border-[#8FA38F] rounded text-[9px] font-bold text-slate-650 transition-colors cursor-pointer"
                        >
                          +${cashVal}
                        </button>
                      ))}
                      <button 
                        type="button"
                        onClick={() => setCashPayAmount(0)}
                        className="px-1.5 py-0.5 bg-slate-50 hover:bg-rose-50 border border-slate-200 rounded text-[9px] font-black text-rose-600 hover:text-rose-700 cursor-pointer text-center"
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  {/* Merchant Terminal Credit Card option */}
                  <div className="space-y-1.5 p-2 bg-slate-50/50 rounded-xl border border-slate-150">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-indigo-500" /> Card Terminal
                      </span>
                      <button 
                        onClick={() => {
                          setCardPayAmount(remainingBalanceAmount > 0 ? remainingBalanceAmount : netTotalSum);
                        }}
                        className="text-[9px] text-sky-600 font-bold hover:underline"
                      >
                        Match Left
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="number" 
                        step="0.01"
                        min="0"
                        value={cardPayAmount || ''}
                        onChange={(e) => setCardPayAmount(Math.max(0, Number(e.target.value)))}
                        className="w-full text-xs font-bold font-mono px-2 py-1 bg-white border border-slate-200 rounded-md focus:outline-hidden"
                        placeholder="0.00"
                      />
                      <input 
                        type="text" 
                        value={cardReference}
                        onChange={(e) => setCardReference(e.target.value)}
                        className="w-full text-[10px] px-2 py-1 bg-white border border-slate-200 rounded-md focus:outline-hidden"
                        placeholder="Receipt Trace ID"
                      />
                    </div>
                  </div>

                  {/* QR code Mobile wallet payments e.g., NFC, Apple, Alipay, dynamic mobile wallets */}
                  <div className="space-y-1.5 p-2 bg-slate-50/50 rounded-xl border border-slate-150">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4 text-cyan-500" /> Mobile Pay (NFC/QR)
                      </span>
                      <button 
                        onClick={() => {
                          setMobilePayAmount(remainingBalanceAmount > 0 ? remainingBalanceAmount : netTotalSum);
                        }}
                        className="text-[9px] text-sky-600 font-bold hover:underline"
                      >
                        Match Left
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="number" 
                        step="0.01"
                        min="0"
                        value={mobilePayAmount || ''}
                        onChange={(e) => setMobilePayAmount(Math.max(0, Number(e.target.value)))}
                        className="w-full text-xs font-bold font-mono px-2 py-1 bg-white border border-slate-200 rounded-md focus:outline-hidden"
                        placeholder="0.00"
                      />
                      <input 
                        type="text" 
                        value={mobileReference}
                        onChange={(e) => setMobileReference(e.target.value)}
                        className="w-full text-[10px] px-2 py-1 bg-white border border-slate-200 rounded-md focus:outline-hidden"
                        placeholder="QR Trans reference"
                      />
                    </div>
                  </div>

                  {/* Loyalty Dollars/Points Option */}
                  {selectedCustomer ? (
                    <div className="space-y-1.5 p-2 bg-slate-50/50 rounded-xl border border-slate-150">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-amber-500" /> Loyalty Points Debit
                        </span>
                        <button 
                          onClick={() => {
                            const affordablePointsAmt = selectedCustomer.loyaltyPoints / 100;
                            const targetVal = Math.min(affordablePointsAmt, remainingBalanceAmount > 0 ? remainingBalanceAmount : netTotalSum);
                            setGiftPayAmount(parseFloat(targetVal.toFixed(2)));
                          }}
                          className="text-[9px] text-sky-600 font-bold hover:underline"
                        >
                          Match Max ({formatCurrency(selectedCustomer.loyaltyPoints/100)})
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input 
                          type="number" 
                          step="0.01"
                          min="0"
                          max={selectedCustomer.loyaltyPoints / 100}
                          value={giftPayAmount || ''}
                          onChange={(e) => setGiftPayAmount(Math.max(0, Number(e.target.value)))}
                          className="w-full text-xs font-bold font-mono px-2 py-1 bg-white border border-slate-200 rounded-md focus:outline-hidden text-amber-700"
                          placeholder="0.00"
                        />
                        <div className="text-[9px] bg-amber-50 text-amber-800 border border-amber-100 flex items-center justify-center p-1 rounded-md font-bold">
                          Debit: {(giftPayAmount * 100).toFixed(0)} Pts
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 italic">⭐️ Connect a CRM Customer to enable Loyalty Points debit checkouts.</p>
                  )}

                </div>

              </div>

              {/* Right checkout column: Receipt memo summary, Change back indicators */}
              <div className="flex flex-col justify-between space-y-4">
                
                {/* Checkout Summary Itemizer list preview */}
                <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-2 flex-grow max-h-56 overflow-y-auto">
                  <span className="font-extrabold text-[10px] text-slate-500 uppercase tracking-wider block">Bag Review</span>
                  <div className="space-y-1.5">
                    {cartItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-[11px] text-slate-700 font-medium">
                        <span className="truncate max-w-44">{item.product.name} (x{item.quantity})</span>
                        <span className="font-mono">{formatCurrency((item.product.price * item.quantity)*(1-item.discountPercentage/100))}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ledger Notes */}
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Cashier Transaction Notes</span>
                  <textarea 
                    placeholder="e.g., Table 4 Split billing, client customized request details..."
                    value={cartNotes}
                    onChange={(e) => setCartNotes(e.target.value)}
                    className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-hidden h-14 resize-none"
                  />
                </div>

                {/* Final Till Metrics display */}
                <div className="p-4 bg-slate-100 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-500">Allocated Payments Sum:</span>
                    <span className="font-mono font-bold text-slate-800">{formatCurrency(totalAllocatedPayments)}</span>
                  </div>

                  <div className="divider border-t border-slate-200"></div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    
                    {/* Remaining unpaid balance */}
                    <div className="text-left">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Balance Due</span>
                      <strong className={`font-mono text-base ${remainingBalanceAmount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                        {formatCurrency(remainingBalanceAmount)}
                      </strong>
                    </div>

                    {/* Change back to client */}
                    <div className="text-right">
                      <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest block font-sans">Cashier Change</span>
                      <strong className="font-mono text-base text-emerald-600 font-black">
                        {formatCurrency(cashChangeReturn)}
                      </strong>
                    </div>

                  </div>
                </div>

              </div>

            </div>

            {/* Complete checkout and cancel action segment */}
            <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex justify-between items-center flex-shrink-0">
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <Scan className="w-3.5 h-3.5 text-slate-400 animate-pulse" />
                <span>Instant inventory updates logged as completed.</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setIsCheckoutOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 text-xs font-bold cursor-pointer"
                >
                  Edit Cart
                </button>
                <button
                  onClick={handleCompleteCheckout}
                  disabled={remainingBalanceAmount > 0}
                  className={`px-6 py-2 rounded-lg font-extrabold text-xs tracking-wide shadow-xs cursor-pointer flex items-center gap-1.5 transition-colors ${
                    remainingBalanceAmount === 0
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800'
                      : 'bg-slate-200 text-slate-400 border border-slate-300 pointer-events-none'
                  }`}
                  id="finalize-checkout-btn"
                >
                  <Check className="w-4 h-4" /> Log &amp; Print Ticket
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {simulatorConfig && (
        <PaymentSimulator 
          method={simulatorConfig.method}
          amount={simulatorConfig.amount}
          onSuccess={handleSimulationSuccess}
          onCancel={() => setSimulatorConfig(null)}
        />
      )}

    </div>
  );
}
