import React, { useState } from 'react';
import { useMess } from '../../context/MessContext';
import { ShoppingCart, Plus, ChevronDown, ChevronUp, Receipt, ExternalLink, Calendar, MapPin, User as UserIcon } from 'lucide-react';
import { AddBazarModal } from '../modals/AddBazarModal';
import { ReceiptPreviewModal } from '../modals/ReceiptPreviewModal';
import { BazarRecord } from '../../types';

export const BazarListView: React.FC = () => {
  const { state, membersMap } = useMess();

  const [isAddBazarOpen, setIsAddBazarOpen] = useState(false);
  const [expandedBazarId, setExpandedBazarId] = useState<string | null>(state.bazarRecords[0]?.id || null);
  const [receiptPreview, setReceiptPreview] = useState<{ title: string; url?: string; amount?: number; date?: string } | null>(null);

  const totalBazarSpent = state.bazarRecords.reduce((sum, b) => sum + b.totalAmount, 0);

  const toggleExpand = (id: string) => {
    setExpandedBazarId(expandedBazarId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Bazar Records & Itemized Expenses
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Section 8 · Detailed market purchases, auto-calculated line items (quantity × unit price = total)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Total Bazar Spent</div>
            <div className="text-base font-bold text-slate-900 tabular-nums">
              ৳{totalBazarSpent.toLocaleString('en-IN')}
            </div>
          </div>
          <button
            onClick={() => setIsAddBazarOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record New Bazar</span>
          </button>
        </div>
      </div>

      {/* Bazar Records List */}
      <div className="space-y-4">
        {state.bazarRecords.map((record) => {
          const purchaser = membersMap.get(record.purchasedBy);
          const isExpanded = expandedBazarId === record.id;

          return (
            <div
              key={record.id}
              className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden transition-all"
            >
              {/* Record Summary Bar */}
              <div
                onClick={() => toggleExpand(record.id)}
                className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/60 transition-colors"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0">
                    <ShoppingCart className="w-5 h-5" />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        {record.marketName}
                      </span>
                      <span className="text-xs text-slate-500">
                        ({record.items.length} items)
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {record.date}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                        Purchased by: <strong className="text-slate-700">{purchaser?.name || 'Member'}</strong>
                      </span>
                      {record.note && (
                        <>
                          <span>·</span>
                          <span className="text-slate-600 italic">"{record.note}"</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-base sm:text-lg font-bold text-slate-900 tabular-nums">
                      ৳{record.totalAmount.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[11px] text-emerald-700 font-medium">Bazar Fund Debited</div>
                  </div>

                  <button className="text-slate-400 p-1">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Itemized Table Breakdown (Section 8) */}
              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50/40 p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                      Itemized Breakdown (বাজারের বিস্তারিত হিসাব)
                    </span>

                    {record.receiptUrl && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setReceiptPreview({
                            title: `Bazar Receipt - ${record.marketName}`,
                            url: record.receiptUrl,
                            amount: record.totalAmount,
                            date: record.date
                          });
                        }}
                        className="flex items-center gap-1 text-xs text-indigo-700 font-semibold hover:underline"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>View Attached Receipt</span>
                      </button>
                    )}
                  </div>

                  <div className="overflow-x-auto bg-white rounded-lg border border-slate-200">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-4">#</th>
                          <th className="py-2.5 px-4">Item Name (পণ্যের নাম)</th>
                          <th className="py-2.5 px-4 text-center">Quantity</th>
                          <th className="py-2.5 px-4 text-center">Unit</th>
                          <th className="py-2.5 px-4 text-right">Unit Price (৳)</th>
                          <th className="py-2.5 px-4 text-right">Total (৳)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {record.items.map((item, idx) => (
                          <tr key={item.id} className="hover:bg-slate-50/50">
                            <td className="py-2 px-4 text-slate-400">{idx + 1}</td>
                            <td className="py-2 px-4 text-slate-900 font-semibold">{item.itemName}</td>
                            <td className="py-2 px-4 text-center tabular-nums">{item.quantity}</td>
                            <td className="py-2 px-4 text-center text-slate-600">{item.unit}</td>
                            <td className="py-2 px-4 text-right tabular-nums text-slate-600">
                              ৳{item.unitPrice.toLocaleString('en-IN')}
                            </td>
                            <td className="py-2 px-4 text-right tabular-nums text-slate-900 font-bold">
                              ৳{item.totalPrice.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-slate-900">
                        <tr>
                          <td colSpan={5} className="py-2.5 px-4 text-right">
                            Total Bazar Cost (মোট খরচ):
                          </td>
                          <td className="py-2.5 px-4 text-right tabular-nums text-sm text-emerald-800">
                            ৳{record.totalAmount.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <AddBazarModal isOpen={isAddBazarOpen} onClose={() => setIsAddBazarOpen(false)} />
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
