import React, { useState } from 'react';
import { useMess } from '../../context/MessContext';
import { formatTaka } from '../../services/accountingEngine';
import { SettlementSuggestion } from '../../types';
import {
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Plus
} from 'lucide-react';
import { RecordSettlementModal } from '../modals/RecordSettlementModal';

export const SettlementView: React.FC = () => {
  const { financialOverview, state, membersMap, currentUser } = useMess();

  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<SettlementSuggestion | null>(null);

  const handleSettleSuggestion = (s: SettlementSuggestion) => {
    setSelectedSuggestion(s);
    setIsRecordModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Automatic Settlement Engine
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Section 11, 12 & 13 · Minimal transaction path algorithm (Who owes money to whom)
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedSuggestion(null);
            setIsRecordModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Record Custom Settlement</span>
        </button>
      </div>

      {/* Suggested Settlements - The Core Feature (Section 12) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Optimal Settlement Suggestions (স্বয়ংক্রিয় দেনা-পাওনা সমাধান)
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Minimizes unnecessary circular transactions
          </span>
        </div>

        {financialOverview.settlementSuggestions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {financialOverview.settlementSuggestions.map((sug, idx) => {
              const isPayer = currentUser.id === sug.fromMemberId;
              const isReceiver = currentUser.id === sug.toMemberId;

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border transition-all ${
                    isPayer || isReceiver
                      ? 'bg-indigo-50/50 border-indigo-200 shadow-xs ring-1 ring-indigo-500/20'
                      : 'bg-slate-50/70 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Step #{idx + 1}
                    </span>
                    <span className="text-base font-extrabold text-slate-900 tabular-nums">
                      ৳{sug.amount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between my-3">
                    <div className="text-left">
                      <div className="text-xs font-semibold text-slate-500">Debtor (পরিশোধ করবে)</div>
                      <div className="text-sm font-bold text-slate-900">{sug.fromMemberName}</div>
                    </div>

                    <div className="flex flex-col items-center px-3">
                      <ArrowRight className="w-5 h-5 text-indigo-600" />
                      <span className="text-[10px] text-indigo-700 font-medium mt-0.5">Direct Transfer</span>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-semibold text-slate-500">Creditor (টাকা পাবে)</div>
                      <div className="text-sm font-bold text-slate-900">{sug.toMemberName}</div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">
                      {isPayer ? 'You owe this amount' : isReceiver ? 'You should receive this' : 'Pending transfer'}
                    </span>
                    <button
                      onClick={() => handleSettleSuggestion(sug)}
                      className="px-3 py-1 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      Execute Settlement
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 rounded-lg border border-slate-200">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-900">All Accounts Perfectly Settled!</h3>
            <p className="text-xs text-slate-500 mt-1">
              Every active member's balance is ৳0. No pending payments or dues for this period.
            </p>
          </div>
        )}
      </div>

      {/* Member Balances Table (Section 11) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Member Financial Balances (সদস্যদের হিসাব বিবরণী)
            </h2>
            <p className="text-xs text-slate-500">
              Formula: Balance = Total Deposit - Equal Share - Settlements Paid + Settlements Received
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4 text-right">Deposited (৳)</th>
                <th className="py-3 px-4 text-right">Monthly Share (৳)</th>
                <th className="py-3 px-4 text-right">Settled Paid (৳)</th>
                <th className="py-3 px-4 text-right">Settled Recv (৳)</th>
                <th className="py-3 px-4 text-right">Net Balance (৳)</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {financialOverview.memberSummaries.map((m) => {
                const isPositive = m.netBalance > 0.01;
                const isNegative = m.netBalance < -0.01;

                return (
                  <tr key={m.memberId} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{m.memberName}</div>
                      <div className="text-[10px] text-slate-500">{m.role} · {m.status}</div>
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-slate-700">
                      ৳{m.totalDeposited.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-slate-700">
                      ৳{m.share.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-slate-700">
                      ৳{m.settlementsPaid.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-slate-700">
                      ৳{m.settlementsReceived.toLocaleString('en-IN')}
                    </td>
                    <td
                      className={`py-3 px-4 text-right tabular-nums font-bold text-sm ${
                        isPositive ? 'text-emerald-700' : isNegative ? 'text-rose-700' : 'text-slate-600'
                      }`}
                    >
                      {formatTaka(m.netBalance, true)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isPositive
                            ? 'bg-emerald-100 text-emerald-800'
                            : isNegative
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {isPositive ? 'RECEIVES' : isNegative ? 'OWES' : 'SETTLED'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Completed Settlement History (Section 13) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">
            Completed Settlements History ({state.settlements.length})
          </h2>
        </div>

        {state.settlements.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">From (Payer)</th>
                  <th className="py-2.5 px-4">To (Receiver)</th>
                  <th className="py-2.5 px-4">Method</th>
                  <th className="py-2.5 px-4">Notes</th>
                  <th className="py-2.5 px-4 text-right">Amount (৳)</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.settlements.map((s) => {
                  const from = membersMap.get(s.fromMemberId);
                  const to = membersMap.get(s.toMemberId);

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-4 text-slate-500">{s.settlementDate}</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900">{from?.name}</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900">{to?.name}</td>
                      <td className="py-2.5 px-4 text-slate-600">{s.paymentMethod}</td>
                      <td className="py-2.5 px-4 text-slate-500">{s.note || '—'}</td>
                      <td className="py-2.5 px-4 text-right tabular-nums font-bold text-slate-900">
                        ৳{s.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          COMPLETED
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-slate-500">
            No settlements completed yet for this month.
          </div>
        )}
      </div>

      <RecordSettlementModal
        isOpen={isRecordModalOpen}
        onClose={() => {
          setIsRecordModalOpen(false);
          setSelectedSuggestion(null);
        }}
        presetSuggestion={selectedSuggestion}
      />
    </div>
  );
};
