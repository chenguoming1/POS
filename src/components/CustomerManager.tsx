import React, { useState, useMemo } from 'react';
import { Customer } from '../types';
import { 
  Users, 
  Search, 
  UserPlus, 
  Award, 
  Phone, 
  Mail, 
  Plus, 
  Gift, 
  FileText, 
  Layers, 
  User, 
  ArrowUpDown,
  Sparkle,
  X
} from 'lucide-react';

interface CustomerManagerProps {
  customers: Customer[];
  onAddCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => void;
  onUpdateCustomer: (customer: Customer) => void;
}

export default function CustomerManager({ customers, onAddCustomer, onUpdateCustomer }: CustomerManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPoints, setFormPoints] = useState(0);
  const [formNotes, setFormNotes] = useState('');

  // Quick state overrides
  const [pointAdjustmentAmount, setPointAdjustmentAmount] = useState(50);

  // Filter lists
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const term = searchTerm.toLowerCase();
      return (
        c.name.toLowerCase().includes(term) ||
        c.phone.includes(term) ||
        c.email.toLowerCase().includes(term)
      );
    });
  }, [customers, searchTerm]);

  // KPIs
  const crmStats = useMemo(() => {
    const total = customers.length;
    const totalPoints = customers.reduce((sum, c) => sum + c.loyaltyPoints, 0);
    const avgPoints = total > 0 ? totalPoints / total : 0;
    const vipCustomers = customers.filter(c => c.loyaltyPoints >= 300).length;

    return {
      total,
      avgPoints,
      vipCustomers
    };
  }, [customers]);

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormPoints(0);
    setFormNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setFormName(c.name);
    setFormPhone(c.phone);
    setFormEmail(c.email);
    setFormPoints(c.loyaltyPoints);
    setFormNotes(c.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingCustomer) {
      onUpdateCustomer({
        ...editingCustomer,
        name: formName.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim().toLowerCase(),
        loyaltyPoints: Number(formPoints),
        notes: formNotes.trim()
      });
    } else {
      onAddCustomer({
        name: formName.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim().toLowerCase(),
        loyaltyPoints: Number(formPoints),
        notes: formNotes.trim()
      });
    }
    setIsModalOpen(false);
  };

  const adjustPoints = (c: Customer, change: number) => {
    const nextPoints = Math.max(0, c.loyaltyPoints + change);
    onUpdateCustomer({
      ...c,
      loyaltyPoints: nextPoints
    });
  };

  return (
    <div className="space-y-6" id="customers-viewport">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 tracking-tight font-sans">CRM Customer Loyalty &amp; Directory</h1>
          <p className="text-slate-500 text-sm mt-1">Nurture client relationships, check accrued rewards points, and track consumer loyalty profiles.</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer transition-colors"
          id="btn-customer-add"
        >
          <UserPlus className="w-4 h-4" />
          Enroll Customer
        </button>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="crm-stats-grid">
        {/* Total Customers */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total Members Enrolled</p>
            <h4 className="text-xl font-extrabold text-slate-800">{crmStats.total} members</h4>
          </div>
        </div>

        {/* Avg Points */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Award className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Average Rewards Balance</p>
            <h4 className="text-xl font-extrabold text-slate-800">{crmStats.avgPoints.toFixed(0)} points</h4>
          </div>
        </div>

        {/* Gold Tier Members */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-500 rounded-xl">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">VIP Tier Members</p>
            <h4 className="text-xl font-extrabold text-slate-800">{crmStats.vipCustomers} members (⭐️ 300+ pts)</h4>
          </div>
        </div>
      </div>

      {/* Main filter search panel */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-3xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input 
            type="text" 
            placeholder="Search accounts by member name, phone or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-sky-500 focus:bg-white focus:ring-1 focus:ring-sky-500"
            id="search-customer-input"
          />
        </div>
        <div className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
          <span>Displaying {filteredCustomers.length} profiles</span>
        </div>
      </div>

      {/* Profiles directory grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="customers-grid">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-xl border border-slate-100">
            <div className="flex flex-col items-center justify-center gap-2">
              <Users className="w-8 h-8 text-slate-300 stroke-1" />
              <p className="text-xs">No customer profiles match current keyword criteria.</p>
            </div>
          </div>
        ) : (
          filteredCustomers.map((member) => (
            <div 
              key={member.id} 
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs hover:shadow-xs hover:border-slate-200 transition-all flex flex-col justify-between space-y-4"
              id={`member-card-${member.id}`}
            >
              {/* Profile Top */}
              <div className="flex justify-between items-start">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm">
                    {member.name.split(' ').map(n=>n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 flex items-center gap-1.5 text-sm">
                      {member.name}
                      {member.loyaltyPoints >= 300 && (
                        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-sm bg-gradient-to-r from-amber-500 to-amber-600 text-white animate-pulse">
                          VIP GOLD
                        </span>
                      )}
                    </h3>
                    <div className="space-y-0.5 mt-1.5">
                      <p className="text-slate-500 text-xs flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" /> {member.phone || 'No phone recorded'}
                      </p>
                      <p className="text-slate-500 text-xs flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" /> {member.email || 'No email recorded'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-100 text-center flex-shrink-0">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-emerald-600 block">Rewards</span>
                  <span className="font-mono font-black text-sm">{member.loyaltyPoints}</span>
                  <span className="text-[8px] text-slate-400 block mt-0.5">PTS</span>
                </div>
              </div>

              {/* CRM Loyalty modifiers */}
              {member.notes && (
                <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[11px] text-slate-600 mt-1">
                  <span className="font-bold uppercase tracking-wider text-[9px] text-slate-400 block mb-0.5">Cashier Notes:</span>
                  {member.notes}
                </div>
              )}

              {/* Adjust Points panel inline */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                <span className="text-[10px] text-slate-400 font-mono">Enrolled: {new Date(member.createdAt).toLocaleDateString()}</span>
                
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => adjustPoints(member, -50)}
                    className="px-2 py-1 border border-slate-200 rounded-md hover:bg-rose-50 text-slate-500 hover:text-rose-600 text-[10px] cursor-pointer"
                    title="deduct loyalty points"
                  >
                    -50 Pts
                  </button>
                  <button 
                    onClick={() => adjustPoints(member, 50)}
                    className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md text-[10px] cursor-pointer font-semibold"
                    title="grant quick points"
                  >
                    +50 Pts
                  </button>
                  <button 
                    onClick={() => handleOpenEdit(member)}
                    className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-md text-[10px] cursor-pointer font-bold"
                  >
                    Update Info
                  </button>
                </div>
              </div>

            </div>
          ))
        )}
      </div>

      {/* CRM ENROLL MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="customer-modal">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-sm overflow-hidden animate-scale-up">
            <div className="flex justify-between items-center bg-slate-50 border-b border-slate-100 px-4 py-3.5">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <Sparkle className="w-4 h-4 text-sky-500 fill-sky-200" />
                {editingCustomer ? 'Update CRM Account' : 'Enroll Loyalty Customer'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
              
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Customer Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g., Jonathan Harker"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-sky-500"
                />
              </div>

              {/* Phone Line */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Phone Number</label>
                <input 
                  type="tel" 
                  placeholder="e.g., 555-0392"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-sky-500"
                />
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Email Address</label>
                <input 
                  type="email" 
                  placeholder="e.g., harker@transylvania.org"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-sky-500"
                />
              </div>

              {/* Initial Point Ledger */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Loyalty Points Balance</label>
                <input 
                  type="number" 
                  min="0"
                  placeholder="0"
                  value={formPoints}
                  onChange={(e) => setFormPoints(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-sky-500 font-mono font-bold"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Preferences &amp; Private Notes</label>
                <textarea 
                  placeholder="e.g., Prefers black coffee, allergy warning on nuts..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-sky-500 h-16 resize-none"
                />
              </div>

              {/* Controls */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 text-xs font-semibold shadow-xs cursor-pointer"
                >
                  {editingCustomer ? 'Update CRM' : 'Enroll Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
