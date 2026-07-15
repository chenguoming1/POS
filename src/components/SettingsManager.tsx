import React, { useState } from 'react';
import { StoreSettings } from '../types';
import { 
  Settings, 
  Save, 
  Trash2, 
  Info, 
  ShieldAlert, 
  DollarSign, 
  Award, 
  Building, 
  Printer, 
  FileText,
  Percent,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

interface SettingsManagerProps {
  settings: StoreSettings;
  onUpdateSettings: (settings: StoreSettings) => void;
  onClearAllData: () => void;
  onResetToMock: () => void;
}

export default function SettingsManager({ 
  settings, 
  onUpdateSettings, 
  onClearAllData, 
  onResetToMock 
}: SettingsManagerProps) {
  
  const [storeName, setStoreName] = useState(settings.storeName);
  const [address, setAddress] = useState(settings.address);
  const [phone, setPhone] = useState(settings.phone);
  const [taxRate, setTaxRate] = useState(settings.taxRate);
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol);
  const [receiptHeader, setReceiptHeader] = useState(settings.receiptHeader);
  const [receiptFooter, setReceiptFooter] = useState(settings.receiptFooter);
  const [loyaltyPercent, setLoyaltyPercent] = useState(settings.loyaltyPointsPercent);

  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      storeName: storeName.trim(),
      address: address.trim(),
      phone: phone.trim(),
      taxRate: Number(taxRate),
      currencySymbol,
      receiptHeader: receiptHeader.trim(),
      receiptFooter: receiptFooter.trim(),
      loyaltyPointsPercent: Number(loyaltyPercent)
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6" id="settings-viewport">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 tracking-tight font-sans">Register &amp; General Settings</h1>
          <p className="text-slate-500 text-sm mt-1">Configure business metadata, currency preferences, tax levels, and printed invoice headers.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="settings-panes">
        {/* Core Settings Form */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 lg:col-span-2 shadow-xs" id="core-business-settings">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Store Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                <Building className="w-4 h-4 text-sky-500" /> Store Profile Information
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Store Brand Name *</label>
                  <input 
                    type="text" 
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-sky-500"
                    placeholder="Store Name"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Store Telephone Line *</label>
                  <input 
                    type="text" 
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-sky-500 font-mono"
                    placeholder="(555) 000-0000"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Physical Address *</label>
                  <input 
                    type="text" 
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-sky-500"
                    placeholder="123 Innovation Boulevard"
                  />
                </div>
              </div>
            </div>

            {/* Financial Parameters */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                <Percent className="w-4 h-4 text-indigo-500" /> Taxes, Currency &amp; Loyalty Rewards
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Tax Rate (%) *</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      step="0.01"
                      min="0"
                      required
                      value={taxRate}
                      onChange={(e) => setTaxRate(Number(e.target.value))}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-sky-500 font-mono pr-8 font-bold"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">%</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Currency Symbol</label>
                  <select 
                    value={currencySymbol}
                    onChange={(e) => setCurrencySymbol(e.target.value)}
                    className="w-full text-xs px-2 py-2 border border-slate-200 rounded-lg bg-white text-slate-700 cursor-pointer"
                  >
                    <option value="$">USD / CAD ($)</option>
                    <option value="£">GBP (£)</option>
                    <option value="€">EUR (€)</option>
                    <option value="¥">JPY / CNY (¥)</option>
                    <option value="₹">INR (₹)</option>
                    <option value="₱">PHP (₱)</option>
                    <option value="S$">SGD (S$)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Loyalty Points Ratio (%)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      step="0.1"
                      min="0"
                      required
                      value={loyaltyPercent}
                      onChange={(e) => setLoyaltyPercent(Number(e.target.value))}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg pr-8 focus:outline-hidden focus:border-sky-500 font-mono"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">%</span>
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1 block leading-tight">Cashback earned in reward points per dollar spent.</span>
                </div>
              </div>
            </div>

            {/* Thermal Receipt Text Formats */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                <Printer className="w-4 h-4 text-emerald-500" /> Receipt Header &amp; Footer Layout
              </h3>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Thermal Header Banner Text</label>
                  <input 
                    type="text" 
                    value={receiptHeader}
                    onChange={(e) => setReceiptHeader(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-sky-500"
                    placeholder="THANK YOU FOR SHOPPING IN OUR STORE"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Thermal Footer Disclaimer Text</label>
                  <textarea 
                    value={receiptFooter}
                    onChange={(e) => setReceiptFooter(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-sky-500 h-16 resize-none"
                    placeholder="All sales are final on food. Exchange bakery items same-day."
                  />
                </div>
              </div>
            </div>

            {/* Action Save button */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              {saveSuccess ? (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold" id="settings-save-success">
                  <CheckCircle className="w-4 h-4" /> Changed registered configuration successfully.
                </div>
              ) : (
                <div className="text-xs text-slate-400 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" /> Commits immediately directly into localStorage.
                </div>
              )}
              <button
                type="submit"
                className="px-5 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 text-xs font-semibold shadow-xs cursor-pointer flex items-center gap-1.5"
                id="btn-settings-save"
              >
                <Save className="w-4 h-4" />
                Save Brand Configuration
              </button>
            </div>

          </form>
        </div>

        {/* Maintenance / Danger Panel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 h-fit space-y-6 shadow-xs" id="danger-maintenance-card">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-rose-800 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" /> Database Administration
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">Emergency data overrides and maintenance commands.</p>
          </div>

          <div className="space-y-4">
            
            {/* Reset mock datasets button */}
            <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2">
              <span className="font-bold text-[10px] text-indigo-800 block uppercase tracking-wider">Reload Demo Dataset</span>
              <p className="text-[10px] text-zinc-600 leading-normal">
                Repopulate the cash register catalog with organic drinks, bakery snacks, test loyalty customers, and simulated sales logs.
              </p>
              <button 
                onClick={() => {
                  if (confirm("Restore demo dataset? Current sales ledger reports and products will merge/reset.")) {
                    onResetToMock();
                    alert("Preset dataset populated. Refreshing catalog...");
                  }
                }}
                className="w-full py-1.5 px-3 bg-white text-indigo-700 hover:bg-indigo-100 active:bg-indigo-200 border border-indigo-200 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                id="btn-factory-data-reload"
              >
                Restore Demo Database
              </button>
            </div>

            {/* Total wipes button */}
            <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl space-y-2">
              <span className="font-bold text-[10px] text-rose-800 block uppercase tracking-wider font-sans">Full Database Wipe</span>
              <p className="text-[10px] text-zinc-600 leading-normal">
                Completely purges products, member listings, invoice reports, hold carts, and settings from localStorage. Securely empty register.
              </p>
              <button 
                onClick={() => {
                  if (confirm("CRITICAL WARNING: This completely wipes all local store products, customers, transactions and settings. This cannot be undone! Proceed?")) {
                    onClearAllData();
                    alert("Complete local point of sale state erased.");
                  }
                }}
                className="w-full py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                id="btn-settings-purge"
              >
                Erase Register Databases
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
