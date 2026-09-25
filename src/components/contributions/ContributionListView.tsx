import React, { useState } from 'react';
import { useMess } from '../../context/MessContext';
import { Plus, PiggyBank, Receipt, Calendar, CreditCard, Edit2, Trash2 } from 'lucide-react';
import { AddDepositModal } from '../modals/AddDepositModal';
import { UniversalSlipInvoiceModal, SlipInvoiceData } from '../modals/UniversalSlipInvoiceModal';

export const ContributionListView: React.FC = () => {
  const { state, membersMap, deleteContribution } = useMess();

  const [isAddDepositOpen, setIsAddDepositOpen] = useState(false);
  const [editingDeposit, setEditingDeposit] = useState<any | null>(null);
  const [selectedSlip, setSelectedSlip] = useState<SlipInvoiceData | null>(null);

  const totalContributions = state.contributions
    .filter((c) => !c.isDeleted)
    .reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Member Deposits
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Advance funds deposited by roommates
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
            <span>+ New Deposit</span>
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
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() =>
                              setSelectedSlip({
                                type: 'DEPOSIT',
                                id: contrib.id,
                                title: `Deposit - ${member?.name || 'Member'}`,
                                titleBn: 'মেস তহবিল জমা রসিদ',
                                date: contrib.transactionDate,
                                amount: contrib.amount,
                                paymentMethod: contrib.paymentMethod,
                                payerName: member?.name || 'Member',
                                payerRole: member?.role || 'MEMBER',
                                note: contrib.note,
                                receiptUrl: contrib.receiptUrl,
                                recordedBy: contrib.recordedBy || 'Admin'
                              })
                            }
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold text-[11px] transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                          >
                            <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Slip / Invoice</span>
                          </button>
                          
                          <button
                            onClick={() => setEditingDeposit(contrib)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Deposit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this deposit?')) {
                                deleteContribution(contrib.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Deposit"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
      {editingDeposit && (
        <AddDepositModal
          isOpen={true}
          onClose={() => setEditingDeposit(null)}
          initialData={editingDeposit}
        />
      )}
      <UniversalSlipInvoiceModal
        isOpen={!!selectedSlip}
        onClose={() => setSelectedSlip(null)}
        data={selectedSlip}
      />
    </div>
  );
};
