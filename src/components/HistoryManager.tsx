import { useState, useMemo } from 'react';
import { Sale, StoreSettings } from '../types';
import { 
  Search, 
  RefreshCcw, 
  Printer, 
  Clock, 
  User, 
  HelpCircle, 
  CheckCircle, 
  XCircle, 
  Eye, 
  FileText, 
  DollarSign, 
  ChevronRight, 
  Building,
  Info,
  Lock
} from 'lucide-react';

interface HistoryManagerProps {
  sales: Sale[];
  settings: StoreSettings;
  onRefundSale: (id: string, reason: string) => void;
  currencySymbol: string;
  isAdmin?: boolean;
}

export default function HistoryManager({ sales, settings, onRefundSale, currencySymbol, isAdmin = false }: HistoryManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  
  // Selected receipt viewing state
  const [activeReceipt, setActiveReceipt] = useState<Sale | null>(null);
  
  // Refund prompt state
  const [refundPromptId, setRefundPromptId] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState('Customer returned merchandise');

  // Filter calculations
  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        s.invoiceNo.toLowerCase().includes(term) ||
        (s.customer?.name || '').toLowerCase().includes(term) ||
        s.cashierName.toLowerCase().includes(term) ||
        s.items.some(item => item.product.name.toLowerCase().includes(term));
      
      const paymentMethods = s.payments.map(p => p.method);
      const matchesMethod = selectedMethod === 'all' || paymentMethods.includes(selectedMethod as any);
      
      let matchesStatus = true;
      if (selectedStatus === 'refunded') {
        matchesStatus = s.refunded;
      } else if (selectedStatus === 'completed') {
        matchesStatus = !s.refunded;
      }

      return matchesSearch && matchesMethod && matchesStatus;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [sales, searchTerm, selectedMethod, selectedStatus]);

  // Aggregate stats on filtered rows
  const ledgerKPIs = useMemo(() => {
    let revenue = 0;
    let transactions = 0;
    let refundedCount = 0;

    filteredSales.forEach(s => {
      if (!s.refunded) {
        revenue += s.total;
        transactions++;
      } else {
        refundedCount++;
      }
    });

    return {
      revenue,
      transactions,
      refundedCount
    };
  }, [filteredSales]);

  const handleApplyRefund = (id: string) => {
    onRefundSale(id, refundReason);
    setRefundPromptId(null);
    // If current viewed receipt is refunded, update the viewer focus to show state change
    if (activeReceipt && activeReceipt.id === id) {
      const updated = sales.find(s => s.id === id);
      if (updated) {
        setActiveReceipt({ ...updated, refunded: true, refundReason });
      }
    }
  };

  const formatCurrency = (val: number) => {
    return `${currencySymbol}${val.toFixed(2)}`;
  };

  const getMethodBadge = (m: string) => {
    switch(m) {
      case 'cash': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'card': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'mobile': return 'bg-cyan-50 text-cyan-700 border-cyan-100';
      case 'gift_card': return 'bg-amber-50 text-amber-700 border-amber-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  return (
    <div className="space-y-6" id="history-viewport">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 tracking-tight font-sans">Transaction History &amp; Orders</h1>
          <p className="text-slate-500 text-sm mt-1">Audit complete store transaction records, issue refunds and reprint physical thermal receipts.</p>
        </div>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="ledger-stats">
        <div className="bg-white p-4 rounded-xl border border-slate-100">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Settled Sales Revenue</p>
          <h4 className="text-xl font-extrabold text-slate-800 mt-0.5">{formatCurrency(ledgerKPIs.revenue)}</h4>
          <span className="text-[10px] text-slate-400 font-mono italic">Excludes refunded receipts</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Invoiced Bills</p>
          <h4 className="text-xl font-extrabold text-slate-800 mt-0.5">{ledgerKPIs.transactions} receipts</h4>
          <span className="text-[10px] text-slate-400 font-mono">Completed settled flows</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Refunded Orders</p>
          <h4 className="text-xl font-extrabold text-rose-800 mt-0.5">{ledgerKPIs.refundedCount} transactions</h4>
          <span className="text-[10px] text-rose-400 font-mono">Inventory restored inline</span>
        </div>
      </div>

      {/* Search and Filters row */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-3xs flex flex-col md:flex-row gap-3" id="history-filters">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input 
            type="text" 
            placeholder="Search by Invoice #, customer name, items or cashiers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-sky-500 focus:bg-white focus:ring-1 focus:ring-sky-500"
            id="search-invoice-input"
          />
        </div>

        {/* Payment filter dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Payment:</span>
          <select 
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
            className="text-xs p-1.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 cursor-pointer focus:outline-hidden focus:bg-white"
            id="history-filter-method"
          >
            <option value="all">All Methods</option>
            <option value="cash">Cash Only</option>
            <option value="card">Card Terminal</option>
            <option value="mobile">Mobile NFC/QR</option>
            <option value="gift_card">Loyalty Credit/Gift</option>
          </select>
        </div>

        {/* Status code dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status:</span>
          <select 
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs p-1.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 cursor-pointer focus:outline-hidden focus:bg-white"
            id="history-filter-status"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Settled</option>
            <option value="refunded">Refunded / Voided</option>
          </select>
        </div>
      </div>

      {/* Multi-column row: Table list on left (flex-1), Detailed receipt viewer on right (w-80 or 96) */}
      <div className="flex flex-col lg:flex-row gap-6" id="history-dashboard-container">
        {/* Sales Ledger Table */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs" id="history-table-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date &amp; Time</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Sold Items</th>
                  <th className="py-3 px-4 text-right">Total sum</th>
                  <th className="py-3 px-4">Payments</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right pr-5">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-600" id="transactions-body">
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FileText className="w-8 h-8 text-slate-300 stroke-1" />
                        <p className="text-xs">No transactions in ledger match search query.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((sale) => {
                    const paymentMethods = sale.payments.map(p => p.method);
                    const itemsDescriptor = sale.items.map(i => `${i.product.name} (x${i.quantity})`).join(', ');

                    return (
                      <tr 
                        key={sale.id} 
                        className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${
                          activeReceipt?.id === sale.id ? 'bg-slate-50 border-l-2 border-l-sky-500' : ''
                        }`}
                        onClick={() => setActiveReceipt(sale)}
                        id={`invoice-row-${sale.id}`}
                      >
                        {/* Invoice Number */}
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          {sale.invoiceNo}
                        </td>

                        {/* Date */}
                        <td className="py-3 px-4 text-slate-500">
                          <div>{new Date(sale.timestamp).toLocaleDateString()}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{new Date(sale.timestamp).toLocaleTimeString()}</div>
                        </td>

                        {/* Customer */}
                        <td className="py-3 px-4">
                          {sale.customer ? (
                            <div>
                              <span className="font-semibold text-slate-700">{sale.customer.name}</span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">{sale.customer.phone}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Walk-In Customer</span>
                          )}
                        </td>

                        {/* Items */}
                        <td className="py-3 px-4 max-w-44 truncate" title={itemsDescriptor}>
                          <span className="font-medium text-slate-800">{sale.items.length} items:</span> {itemsDescriptor}
                        </td>

                        {/* Total */}
                        <td className="py-3 px-4 text-right font-bold text-slate-800">
                          {formatCurrency(sale.total)}
                        </td>

                        {/* Payments */}
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {paymentMethods.map((m, idx) => (
                              <span key={idx} className={`text-[9px] uppercase px-1.5 py-0.5 rounded-sm border font-bold ${getMethodBadge(m)}`}>
                                {m.replace('_', ' ')}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 text-center">
                          {sale.refunded ? (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-100">
                              <XCircle className="w-3 h-3 text-rose-500" /> Void/Refund
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-100">
                              <CheckCircle className="w-3 h-3 text-emerald-500" /> Settled
                            </span>
                          )}
                        </td>

                        {/* Quick View Button */}
                        <td className="py-3 px-4 text-right pr-5" onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-1.5 justify-end">
                            <button
                              onClick={() => setActiveReceipt(sale)}
                              className="p-1 text-slate-400 hover:text-sky-600 hover:bg-sky-50 active:bg-sky-100 rounded-md cursor-pointer transition-colors"
                              title="Inspect full receipt ledger"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {!sale.refunded && (
                              <button
                                onClick={() => {
                                  if (!isAdmin) {
                                    alert("Access Restricted: Voiding transactions or issuing cash refunds requires Elena Rodriguez (Admin role / PIN 4321) authorization.");
                                    return;
                                  }
                                  setRefundReason('Customer request return');
                                  setRefundPromptId(sale.id);
                                }}
                                className={`p-1 rounded-md cursor-pointer transition-colors ${
                                  isAdmin 
                                    ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50' 
                                    : 'text-slate-300 hover:bg-slate-100 hover:text-amber-600'
                                }`}
                                title={isAdmin ? "Issue restitution refund" : "Lock: Admin only"}
                              >
                                {isAdmin ? <RefreshCcw className="w-4 h-4" /> : <Lock className="w-3 h-3 text-slate-400" />}
                              </button>
                            )}
                          </div>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Receipt Visualizer Terminal */}
        <div className="w-full lg:w-96 flex-shrink-0" id="receipt-visualizer-section">
          {activeReceipt ? (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4" id="thermal-receipt-display">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider">
                  <Printer className="w-3.5 h-3.5 text-slate-400" /> Digital Receipt
                </span>
                <button 
                  onClick={() => alert(`Receipt ${activeReceipt.invoiceNo} sent to physical printer queue.`)}
                  className="px-2 py-1 bg-white border border-slate-200 hover:bg-slate-100 hover:text-sky-600 active:bg-slate-200 transition-colors text-[10px] font-bold text-slate-600 rounded-md shadow-3xs cursor-pointer flex items-center gap-1"
                >
                  <Printer className="w-3 h-3" /> Print Invoice
                </button>
              </div>

              {/* Thermal Look Container */}
              <div className="bg-white px-5 py-6 rounded-xl shadow-xs border border-slate-200 font-mono text-[11px] text-zinc-800 space-y-4" id="thermal-paper">
                <div className="text-center space-y-1">
                  <h3 className="font-black text-xs uppercase tracking-wide">{settings.storeName}</h3>
                  <p className="text-[10px] text-zinc-500">{settings.address}</p>
                  <p className="text-[10px] text-zinc-500">Phone: {settings.phone}</p>
                </div>

                <div className="border-t border-dashed border-zinc-300 pt-2 space-y-0.5">
                  <div className="flex justify-between">
                    <span>INVOICE:</span>
                    <span className="font-bold">{activeReceipt.invoiceNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>DATE:</span>
                    <span>{new Date(activeReceipt.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CASHIER:</span>
                    <span>{activeReceipt.cashierName.toUpperCase()}</span>
                  </div>
                  {activeReceipt.customer && (
                    <div className="flex justify-between border-t border-dotted border-zinc-200 mt-1 pt-1 text-[10px]">
                      <span>MEMBER:</span>
                      <span className="truncate max-w-28">{activeReceipt.customer.name.toUpperCase()}</span>
                    </div>
                  )}
                </div>

                {/* Items matrix */}
                <div className="border-t border-dashed border-zinc-300 pt-2 space-y-1.5">
                  <div className="flex justify-between font-bold text-[10px]">
                    <span className="w-1/2">ITEM NAME</span>
                    <span className="w-1/6 text-center">QTY</span>
                    <span className="w-1/3 text-right">PRICE</span>
                  </div>
                  <div className="border-t border-zinc-200 my-1"></div>
                  {activeReceipt.items.map((itm, idx) => {
                    const discount = itm.discountPercentage > 0;
                    const linePrice = itm.product.price * itm.quantity * (1 - itm.discountPercentage / 100);

                    return (
                      <div key={idx} className="space-y-0.5">
                        <div className="flex justify-between">
                          <span className="w-1/2 truncate font-bold text-[10px]">{itm.product.name.toUpperCase()}</span>
                          <span className="w-1/6 text-center">x{itm.quantity}</span>
                          <span className="w-1/3 text-right font-bold">{formatCurrency(linePrice)}</span>
                        </div>
                        {discount && (
                          <div className="text-[9px] text-rose-500 text-right pl-6">
                            -{itm.discountPercentage}% Discount Applied
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Financial Breakdowns */}
                <div className="border-t border-dashed border-zinc-300 pt-2 space-y-1">
                  <div className="flex justify-between">
                    <span>SUBTOTAL:</span>
                    <span>{formatCurrency(activeReceipt.subtotal)}</span>
                  </div>
                  {activeReceipt.discountAmount > 0 && (
                    <div className="flex justify-between text-rose-600 font-bold">
                      <span>DISCOUNT AMT:</span>
                      <span>-{formatCurrency(activeReceipt.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>TAX AMOUNT ({settings.taxRate}%):</span>
                    <span>{formatCurrency(activeReceipt.taxAmount)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-black pt-1 border-t border-zinc-100">
                    <span>NET TOTAL:</span>
                    <span>{formatCurrency(activeReceipt.total)}</span>
                  </div>
                </div>

                {/* Payments details recap */}
                <div className="border-t border-dashed border-zinc-300 pt-2 space-y-0.5">
                  <span className="font-bold text-[10px] block">PAYMENT INFORMATION:</span>
                  {activeReceipt.payments.map((pay, i) => (
                    <div key={i} className="flex justify-between font-bold">
                      <span className="uppercase">{pay.method.replace('_', ' ')}:</span>
                      <span>{formatCurrency(pay.amount)}</span>
                    </div>
                  ))}
                </div>

                {/* Return values or warning notes */}
                {activeReceipt.refunded ? (
                  <div className="border-t border-rose-500 border-2 border-dashed p-2 text-center text-rose-600 bg-rose-50/50 space-y-1">
                    <span className="font-black text-xs uppercase tracking-widest block">VOIDED / REFUNDED</span>
                    <p className="text-[10px] text-zinc-600">Reason: {activeReceipt.refundReason || 'Returned Goods'}</p>
                    {activeReceipt.refundedTimestamp && (
                      <p className="text-[9px] text-zinc-400">At: {new Date(activeReceipt.refundedTimestamp).toLocaleString()}</p>
                    )}
                  </div>
                ) : (
                  <div className="border-t border-dotted border-zinc-300 pt-3 text-center text-[10px] text-zinc-500 space-y-1">
                    <p className="font-bold">{settings.receiptHeader}</p>
                    <p className="leading-tight">{settings.receiptFooter}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-96 border bg-slate-50 border-dashed rounded-2xl flex flex-col items-center justify-center text-slate-400 gap-2 p-6" id="empty-receipt-focus">
              <Eye className="w-10 h-10 stroke-1" />
              <div className="text-center">
                <span className="text-xs font-semibold block text-slate-600">Select Invoice Receipt</span>
                <p className="text-[11px] mt-1 text-slate-400">Roll over or tap on left ledger listings to focus the digital thermal checkout roll here.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* REFUND CONFIRMATION PROMPT MODAL */}
      {refundPromptId !== null && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="refund-modal">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-sm overflow-hidden animate-scale-up">
            <div className="flex items-center gap-3 p-4 bg-rose-50 border-b border-rose-100 text-rose-800">
              <div className="p-2 bg-rose-100 rounded-lg text-rose-700">
                <Clock className="w-5 h-5 pointer-events-none" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Verify Refund Restitution</h3>
                <p className="text-[10px] text-rose-600">This action restores stock quantities immediately.</p>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Reason for Refund *</label>
                <select
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white cursor-pointer"
                >
                  <option value="Customer returned merchandise">Merchandise Return</option>
                  <option value="Accidental double billing">Billing Error / Double charge</option>
                  <option value="Item damaged or unsatisfactory">Damaged / Unsatisfactory item</option>
                  <option value="Cashier clerical error">Cashier clerical mistake</option>
                  <option value="Customer changed mind before preparation">Customer changed mind</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 text-xs font-semibold pt-2 border-t border-slate-100">
                <button
                  onClick={() => setRefundPromptId(null)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleApplyRefund(refundPromptId)}
                  className="px-4 py-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 cursor-pointer flex items-center gap-1"
                >
                  Confirm Restock &amp; Refund
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
