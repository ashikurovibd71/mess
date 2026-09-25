import React, { useState } from 'react';
import { useMess } from '../../context/MessContext';
import { Plus, Receipt, Search, Filter, Calendar, ExternalLink, Zap, Flame, Wifi, Home, Sparkles, Droplets } from 'lucide-react';
import { AddExpenseModal } from '../modals/AddExpenseModal';
import { ReceiptPreviewModal } from '../modals/ReceiptPreviewModal';
import { ExpenseCategoryCode } from '../../types';

export const ExpenseListView: React.FC = () => {
  const { state, membersMap, categoriesMap } = useMess();

  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [receiptPreview, setReceiptPreview] = useState<{ title: string; url?: string; amount?: number; date?: string } | null>(null);

  const filteredExpenses = state.expenses.filter((exp) => {
    if (exp.isDeleted) return false;
    if (selectedCategory !== 'ALL' && exp.categoryCode !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDesc = exp.description.toLowerCase().includes(q);
      const matchNote = exp.note?.toLowerCase().includes(q);
      if (!matchDesc && !matchNote) return false;
    }
    return true;
  });

  const totalFiltered = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const getCategoryIcon = (code: ExpenseCategoryCode) => {
    switch (code) {
      case 'ELECTRICITY': return <Zap className="w-4 h-4 text-amber-600" />;
      case 'GAS': return <Flame className="w-4 h-4 text-orange-600" />;
      case 'INTERNET': return <Wifi className="w-4 h-4 text-blue-600" />;
      case 'HOUSE_RENT': return <Home className="w-4 h-4 text-indigo-600" />;
      case 'WATER': return <Droplets className="w-4 h-4 text-cyan-600" />;
      default: return <Receipt className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Expenses & Utility Bills Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Section 7 & 9 · Track monthly electricity, gas, internet, maid, and apartment overheads
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Filtered Total</div>
            <div className="text-base font-bold text-slate-900 tabular-nums">
              ৳{totalFiltered.toLocaleString('en-IN')}
            </div>
          </div>
          <button
            onClick={() => setIsAddExpenseOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Expense / Bill</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search description, meter token, note..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <span className="text-xs text-slate-500 shrink-0">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white shrink-0"
          >
            <option value="ALL">All Categories</option>
            <option value="BAZAR">Bazar</option>
            <option value="ELECTRICITY">Electricity Bill</option>
            <option value="GAS">Gas Bill</option>
            <option value="INTERNET">Internet / WiFi</option>
            <option value="CLEANING">Cleaning & Maid</option>
            <option value="OTHER">Other Expenses</option>
          </select>
        </div>
      </div>

      {/* Expense Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Paid By</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4 text-right">Amount (৳)</th>
                <th className="py-3 px-4 text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredExpenses.map((exp) => {
                const category = categoriesMap.get(exp.categoryId);
                const paidByMember = membersMap.get(exp.paidBy);

                return (
                  <tr key={exp.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{exp.expenseDate}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {getCategoryIcon(exp.categoryCode)}
                        <span className="font-semibold text-slate-900">
                          {category?.name || exp.categoryCode}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{exp.description}</div>
                      {exp.note && (
                        <div className="text-[11px] text-slate-500 mt-0.5">{exp.note}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                      {paidByMember?.name || 'Mess Fund'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[11px]">
                        {exp.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-slate-900 font-bold text-sm whitespace-nowrap">
                      ৳{exp.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {exp.receiptUrl ? (
                        <button
                          onClick={() =>
                            setReceiptPreview({
                              title: exp.description,
                              url: exp.receiptUrl,
                              amount: exp.amount,
                              date: exp.expenseDate
                            })
                          }
                          className="px-2 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded font-semibold text-[11px] transition-colors"
                        >
                          View Voucher
                        </button>
                      ) : (
                        <span className="text-slate-300 text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-slate-900">
              <tr>
                <td colSpan={5} className="py-3 px-4 text-right">
                  Total Monthly Expenses (মোট খরচ):
                </td>
                <td className="py-3 px-4 text-right tabular-nums text-sm text-rose-700 font-extrabold">
                  ৳{totalFiltered.toLocaleString('en-IN')}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <AddExpenseModal isOpen={isAddExpenseOpen} onClose={() => setIsAddExpenseOpen(false)} />
      <ReceiptPreviewModal
        isOpen={!!receiptPreview}
        onClose={() => setReceiptPreview(null)}
        title={receiptPreview?.title || ''}
        receiptUrl={receiptPreview?.url}
        amount={receiptPreview?.amount}
        date={receiptPreview?.date}
      />
    </div>
  );
};
