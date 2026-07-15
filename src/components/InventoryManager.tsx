import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import { 
  Search, 
  Plus, 
  Filter, 
  Edit2, 
  Trash2, 
  TrendingUp, 
  AlertTriangle, 
  RefreshCcw, 
  Barcode, 
  ArrowUpDown, 
  Package, 
  X,
  Sparkles,
  Layers,
  Sparkle
} from 'lucide-react';

interface InventoryManagerProps {
  products: Product[];
  onAddProduct: (prod: Omit<Product, 'id'>) => void;
  onUpdateProduct: (prod: Product) => void;
  onDeleteProduct: (id: string) => void;
  onResetToMock: () => void;
  currencySymbol: string;
}

export default function InventoryManager({ 
  products, 
  onAddProduct, 
  onUpdateProduct, 
  onDeleteProduct, 
  onResetToMock,
  currencySymbol 
}: InventoryManagerProps) {
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockStatus, setStockStatus] = useState<'all' | 'low' | 'out'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'price' | 'sku'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formBarcode, setFormBarcode] = useState('');
  const [formPrice, setFormPrice] = useState(0);
  const [formCost, setFormCost] = useState(0);
  const [formCategory, setFormCategory] = useState('beverage');
  const [formStock, setFormStock] = useState(0);
  const [formThreshold, setFormThreshold] = useState(5);
  const [formColor, setFormColor] = useState('emerald');

  const categoriesList = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return Array.from(cats);
  }, [products]);

  // Handle open modal
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormName('');
    setFormDescription('');
    // Auto-generate SKU & Barcode for quick testing
    const nextNum = products.length + 101;
    setFormSku(`SKU-${nextNum}`);
    setFormBarcode(`880112${nextNum}`);
    setFormPrice(4.99);
    setFormCost(1.50);
    setFormCategory('beverage');
    setFormStock(20);
    setFormThreshold(5);
    setFormColor('emerald');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormDescription(p.description || '');
    setFormSku(p.sku);
    setFormBarcode(p.barcode);
    setFormPrice(p.price);
    setFormCost(p.cost);
    setFormCategory(p.category);
    setFormStock(p.stock);
    setFormThreshold(p.lowStockThreshold);
    setFormColor(p.color || 'emerald');
    setIsFormOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formSku.trim() || !formBarcode.trim()) return;

    const payload = {
      name: formName.trim(),
      description: formDescription.trim() || undefined,
      sku: formSku.trim(),
      barcode: formBarcode.trim(),
      price: Number(formPrice),
      cost: Number(formCost),
      category: formCategory,
      stock: Number(formStock),
      lowStockThreshold: Number(formThreshold),
      color: formColor
    };

    if (editingProduct) {
      onUpdateProduct({
        ...payload,
        id: editingProduct.id
      });
    } else {
      onAddProduct(payload);
    }
    setIsFormOpen(false);
  };

  // Quick adjust stock + / -
  const handleModifyStock = (p: Product, change: number) => {
    const nextStock = Math.max(0, p.stock + change);
    onUpdateProduct({
      ...p,
      stock: nextStock
    });
  };

  // Filter and sort computation
  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        const matchesSearch = 
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.barcode.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
        
        let matchesStock = true;
        if (stockStatus === 'low') {
          matchesStock = p.stock <= p.lowStockThreshold;
        } else if (stockStatus === 'out') {
          matchesStock = p.stock === 0;
        }

        return matchesSearch && matchesCategory && matchesStock;
      })
      .sort((a, b) => {
        let valueA: any = a[sortBy];
        let valueB: any = b[sortBy];

        if (typeof valueA === 'string') {
          valueA = valueA.toLowerCase();
          valueB = valueB.toLowerCase();
        }

        if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
        if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
  }, [products, searchTerm, selectedCategory, stockStatus, sortBy, sortDirection]);

  const toggleSort = (field: 'name' | 'stock' | 'price' | 'sku') => {
    if (sortBy === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  const formatCurrency = (val: number) => {
    return `${currencySymbol}${val.toFixed(2)}`;
  };

  const getCategoryColorClass = (clr?: string) => {
    switch (clr) {
      case 'emerald': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'amber': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'rose': return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'violet': return 'bg-violet-100 text-violet-800 border-violet-200';
      case 'indigo': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'cyan': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6" id="inventory-viewport">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 tracking-tight font-sans">Inventory &amp; Product Directory</h1>
          <p className="text-slate-500 text-sm mt-1">Manage catalog details, pricing strategies, barcodes, and current store quantities.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Reset to fresh mock data */}
          <button 
            onClick={onResetToMock}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-600 bg-white rounded-lg hover:bg-slate-50 active:bg-slate-100 text-xs font-semibold cursor-pointer transition-colors"
            title="Reload base product template"
            id="btn-inventory-restore"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            Reload Catalog Preset
          </button>
          
          <button 
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer transition-colors"
            id="btn-inventory-add"
          >
            <Plus className="w-4 h-4" />
            Create Product
          </button>
        </div>
      </div>

      {/* Control Filters Drawer */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-3xs space-y-3" id="filters-panel">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search by name, SKU, UPC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-sky-500 focus:bg-white focus:ring-1 focus:ring-sky-500"
              id="search-inventory-input"
            />
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full text-xs py-1.5 px-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 pointer-events-auto cursor-pointer focus:outline-hidden focus:bg-white"
              id="filter-category"
            >
              <option value="all">All Categories</option>
              {categoriesList.map(cat => (
                <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* Stock Level Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">Stock:</span>
            <select
              value={stockStatus}
              onChange={(e) => setStockStatus(e.target.value as any)}
              className="w-full text-xs py-1.5 px-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 cursor-pointer focus:outline-hidden focus:bg-white"
              id="filter-stock"
            >
              <option value="all">Any Quantity</option>
              <option value="low">Low Stock Alerts</option>
              <option value="out">Out of Stock Only</option>
            </select>
          </div>

          {/* Stats quick count summary */}
          <div className="flex justify-end items-center gap-3 bg-slate-50 border border-slate-100 rounded-lg px-3 text-[11px] font-mono text-slate-500">
            <div>Matches: <strong className="text-slate-800">{filteredProducts.length}</strong></div>
            <div>| Total: <strong className="text-slate-800">{products.length}</strong></div>
          </div>

        </div>
      </div>

      {/* Main Inventory Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs" id="ledger-table shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3 px-4 font-bold">
                  <button onClick={() => toggleSort('name')} className="flex items-center gap-1.5 hover:text-slate-800 cursor-pointer">
                    Product Info
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-4">
                  <button onClick={() => toggleSort('sku')} className="flex items-center gap-1.5 hover:text-slate-800 cursor-pointer">
                    Code (SKU)
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">
                  <button onClick={() => toggleSort('price')} className="flex items-center gap-1.5 justify-end w-full hover:text-slate-800 cursor-pointer">
                    Retail Price
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-4 text-right">Cost Price</th>
                <th className="py-3 px-4 text-center">Profit Margin</th>
                <th className="py-3 px-4 text-center">
                  <button onClick={() => toggleSort('stock')} className="flex items-center gap-1.5 justify-center w-full hover:text-slate-800 cursor-pointer">
                    In Stock
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-4 text-center">Quick Adjust</th>
                <th className="py-3 px-4 text-right pr-6">Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700" id="inventory-list-rows">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Package className="w-8 h-8 text-slate-300 stroke-1" />
                      <p>No inventory listings match current filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = p.stock <= p.lowStockThreshold;
                  const isOut = p.stock === 0;
                  const marginAmt = p.price - p.cost;
                  const marginPct = p.price > 0 ? (marginAmt / p.price) * 100 : 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Name & Barcode/UPC */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className={`w-2.5 h-10 rounded-xs flex-shrink-0 bg-${p.color || 'slate'}-500`} style={{ minWidth: '4px' }}></span>
                          <div>
                            <span className="font-semibold text-slate-800 block">{p.name}</span>
                            {p.description && (
                              <p className="text-[10px] text-slate-500 max-w-xs italic line-clamp-1">{p.description}</p>
                            )}
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                              <Barcode className="w-3 h-3 text-slate-300 pointer-events-none" />
                              <span>UPC: {p.barcode}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="py-3 px-4 font-mono text-slate-600 font-medium">
                        {p.sku}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 border-slate-100">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getCategoryColorClass(p.color)} uppercase font-bold tracking-wider`}>
                          {p.category}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4 font-semibold text-slate-800 text-right">
                        {formatCurrency(p.price)}
                      </td>

                      {/* Cost */}
                      <td className="py-3 px-4 text-slate-500 font-mono text-right">
                        {formatCurrency(p.cost)}
                      </td>

                      {/* Margin % */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-50 border border-slate-100 rounded-md">
                          <TrendingUp className="w-3 h-3 text-emerald-500" />
                          <span className="font-mono text-[11px] font-bold text-slate-700">{marginPct.toFixed(0)}%</span>
                        </div>
                      </td>

                      {/* Stock Level Badge */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className={`px-2 py-0.5 rounded-md font-mono font-bold text-[11px] ${
                            isOut 
                              ? 'bg-rose-100 text-rose-800' 
                              : isLow 
                                ? 'bg-amber-100 text-amber-800' 
                                : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {p.stock}
                          </span>
                          {isOut && <span className="text-[9px] text-rose-500 mt-0.5 font-bold uppercase">OUT OF STOCK</span>}
                          {!isOut && isLow && (
                            <span className="text-[9px] text-amber-600 mt-0.5 font-bold uppercase flex items-center gap-0.5">
                              <AlertTriangle className="w-2 h-2" /> LOW
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Quick Adjust Buttons */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-100">
                          <button
                            onClick={() => handleModifyStock(p, -1)}
                            className="w-6 h-6 rounded-md hover:bg-white text-slate-600 active:text-slate-900 flex items-center justify-center font-bold font-mono text-xs cursor-pointer focus:outline-hidden transition-colors"
                            title="Decrement stock by 1"
                          >
                            -
                          </button>
                          <button
                            onClick={() => handleModifyStock(p, 5)}
                            className="px-1.5 h-6 rounded-md hover:bg-white text-slate-600 active:text-slate-900 flex items-center justify-center font-semibold text-[10px] cursor-pointer focus:outline-hidden transition-colors"
                            title="Bulk stock increment +5"
                          >
                            +5
                          </button>
                          <button
                            onClick={() => handleModifyStock(p, 1)}
                            className="w-6 h-6 rounded-md hover:bg-white text-emerald-600 active:text-emerald-900 flex items-center justify-center font-bold font-mono text-xs cursor-pointer focus:outline-hidden transition-colors"
                            title="Increment stock by 1"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Controls (Edit / Trash) */}
                      <td className="py-3 px-4 text-right pr-6">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 active:bg-sky-100 rounded-lg cursor-pointer transition-colors"
                            title="Edit catalog properties"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Remove "${p.name}" from active catalog? Past transaction invoices will preserve references.`)) {
                                onDeleteProduct(p.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:bg-rose-100 rounded-lg cursor-pointer transition-colors"
                            title="Delete item listing"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* CREATE & EDIT OVERLAY MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in" id="inventory-modal">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md overflow-hidden animate-scale-up">
            <div className="flex justify-between items-center bg-slate-50 border-b border-slate-100 px-5 py-4">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <Sparkle className="w-4 h-4 text-sky-500 fill-sky-200" />
                {editingProduct ? 'Edit Catalog Product' : 'Add New Retail Product'}
              </h2>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
              {/* Product Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Product Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g., Cold Brew Concentrate"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-sky-500"
                />
              </div>

              {/* Product Description */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Product Description</label>
                <textarea 
                  placeholder="e.g. Rich espresso with steamed oat milk and vanilla syrup."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-hidden min-h-12 resize-none"
                />
              </div>

              {/* SKU & Barcode Split */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">SKU Code *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g., BEV-039"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-sky-500 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Barcode / UPC *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g., 88011244"
                    value={formBarcode}
                    onChange={(e) => setFormBarcode(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              {/* Financials Cost & Retail Prices */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Retail Price ({currencySymbol}) *</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                    value={formPrice || ''}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-sky-500 font-semibold text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Cost of Goods ({currencySymbol}) *</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                    value={formCost || ''}
                    onChange={(e) => setFormCost(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-sky-500 font-mono text-slate-600"
                  />
                </div>
              </div>

              {/* Category selector & Color representation */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Category</label>
                  <input 
                    type="text" 
                    required
                    placeholder="egg, beverage, bakery..."
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value.toLowerCase())}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-sky-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">UI Tag Accent</label>
                  <select 
                    value={formColor} 
                    onChange={(e) => setFormColor(e.target.value)}
                    className="w-full text-xs px-2 py-2 border border-slate-200 rounded-lg bg-white text-slate-700 cursor-pointer"
                  >
                    <option value="emerald">Emerald Green</option>
                    <option value="amber">Amber Orange</option>
                    <option value="rose">Rose Red</option>
                    <option value="violet">Violet Purple</option>
                    <option value="indigo">Indigo Blue</option>
                    <option value="cyan">Cyan Teal</option>
                  </select>
                </div>
              </div>

              {/* Initial Stock & Low Threshold Alert */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Initial Stock Amount *</label>
                  <input 
                    type="number" 
                    min="0"
                    required
                    placeholder="0"
                    value={formStock}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-sky-500 font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Low Stock Limit *</label>
                  <input 
                    type="number" 
                    min="0"
                    required
                    placeholder="5"
                    value={formThreshold}
                    onChange={(e) => setFormThreshold(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              {/* Save Controls */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 text-xs font-semibold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
