import React, { useState } from 'react';
import { useMess } from '../../context/MessContext';
import { Plus, PiggyBank, Receipt, Calendar, CreditCard } from 'lucide-react';
import { AddDepositModal } from '../modals/AddDepositModal';
import { ReceiptPreviewModal } from '../modals/ReceiptPreviewModal';

export const ContributionListView: React.FC = () => {
  const { state, membersMap } = useMess();

  const [isAddDepositOpen, setIsAddDepositOpen] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState<{ title: string; url?: string; amount?: number; date?: string } | null>(null);

  const totalContributions = state.contributions
    .filter((c) => !c.isDeleted)
    .reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Member Money Deposits & Contributions
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Section 6 · Whenever a member deposits cash or bKash/Nagad into the mess fund
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Total Collected</div>
            <div className="text-base font-bold text-slate-900 tabular-nums">
              ৳{totalContributions.toLocaleString('en-IN')}
            </div>
          </div>
          <button
            onClick={() => setIsAddDepositOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record New Deposit</span>
          </button>
        </div>
      </div>

      {/* Per-Member Contribution Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {state.members.map((m) => {
          const memberTotal = state.contributions
            .filter((c) => !c.isDeleted && c.memberId === m.id)
            .reduce((sum, c) => sum + c.amount, 0);

          return (
            <div key={m.id} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-xs font-bold text-slate-900 truncate">{m.name}</div>
              <div className="text-[10px] text-slate-500">{m.role}</div>
              <div className="text-lg font-extrabold text-slate-900 tabular-nums mt-1.5">
                ৳{memberTotal.toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">Total Contributed</div>
            </div>
          );
        })}
      </div>

      {/* Contributions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Member Name</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Notes / TrxID</th>
                <th className="py-3 px-4 text-right">Amount (৳)</th>
                <th className="py-3 px-4 text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {state.contributions
                .filter((c) => !c.isDeleted)
                .map((contrib) => {
                  const member = membersMap.get(contrib.memberId);

                  return (
                    <tr key={contrib.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {contrib.transactionDate}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-900">
                        {member?.name} {member?.nameBn ? `(${member?.nameBn})` : ''}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-semibold text-[11px]">
                          {contrib.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {contrib.note || 'Regular monthly advance deposit'}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-slate-900 font-bold text-sm whitespace-nowrap">
                        +৳{contrib.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {contrib.receiptUrl ? (
                          <button
                            onClick={() =>
                              setReceiptPreview({
                                title: `Deposit Slip - ${member?.name}`,
                                url: contrib.receiptUrl,
                                amount: contrib.amount,
                                date: contrib.transactionDate
                              })
                            }
                            className="px-2 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded font-semibold text-[11px] transition-colors"
                          >
                            View Slip
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
                <td colSpan={4} className="py-3 px-4 text-right">
                  Total Monthly Collection (মোট জমা):
                </td>
                <td className="py-3 px-4 text-right tabular-nums text-sm text-emerald-800 font-extrabold">
                  +৳{totalContributions.toLocaleString('en-IN')}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <AddDepositModal isOpen={isAddDepositOpen} onClose={() => setIsAddDepositOpen(false)} />
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
