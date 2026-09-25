import React, { useState } from 'react';
import { useMess } from '../../context/MessContext';
import { formatTaka } from '../../services/accountingEngine';
import {
  Wallet,
  PiggyBank,
  Receipt,
  ShoppingCart,
  CalendarCheck,
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  LogOut,
  User as UserIcon,
  Home
} from 'lucide-react';
import { RecordSettlementModal } from '../modals/RecordSettlementModal';
import { RequestDutySwapModal } from '../modals/RequestDutySwapModal';
import { UniversalSlipInvoiceModal, SlipInvoiceData } from '../modals/UniversalSlipInvoiceModal';
import { DutySchedule, SettlementSuggestion } from '../../types';

export const MyPersonalRecordsCard: React.FC = () => {
  const {
    currentUser,
    currentRole,
    financialOverview,
    state,
    toggleDutyStatus,
    respondDutySwap,
    logout,
    setIsAuthModalOpen
  } = useMess();

  const [activeTab, setActiveTab] = useState<'overview' | 'deposits' | 'bazar' | 'duties'>('overview');
  const [isSettlementOpen, setIsSettlementOpen] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<SettlementSuggestion | null>(null);

  const [swapDuty, setSwapDuty] = useState<DutySchedule | null>(null);
  const [selectedSlip, setSelectedSlip] = useState<SlipInvoiceData | null>(null);

  // 1. Current user financial summary
  const mySummary = financialOverview.memberSummaries.find(
    (m) => m.memberId === currentUser.id
  ) || {
    totalDeposited: 0,
    share: 0,
    settlementsPaid: 0,
    settlementsReceived: 0,
    netBalance: 0,
    statusLabel: 'SETTLED' as const
  };

  // 2. Personal deposits
  const myContributions = state.contributions.filter(
    (c) => c.memberId === currentUser.id
  );

  // 3. Personal bazar records
  const myBazarRecords = state.bazarRecords.filter(
    (b) => b.purchasedBy === currentUser.id
  );
  const myTotalBazarSpent = myBazarRecords.reduce((sum, b) => sum + Number(b.totalAmount), 0);

  // 4. Personal duties
  const myDuties = state.dutySchedules
    .filter((d) => d.memberId === currentUser.id)
    .sort((a, b) => a.date.localeCompare(b.date));

  // 5. Personal settlements involving this user
  const mySettlementsToPay = financialOverview.settlementSuggestions.filter(
    (s) => s.fromMemberId === currentUser.id
  );
  const mySettlementsToReceive = financialOverview.settlementSuggestions.filter(
    (s) => s.toMemberId === currentUser.id
  );

  // 6. Duty swaps involving this user
  const myPendingSwaps = state.dutySwaps.filter(
    (s) =>
      s.status === 'PENDING' &&
      (s.requesterMemberId === currentUser.id || s.targetMemberId === currentUser.id)
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
      {/* Top Banner: Member Profile & Fast Status */}
      <div className="bg-slate-900 text-white p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-600 flex items-center justify-center font-bold text-lg text-white shadow-inner shrink-0">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                  {currentUser.name} {currentUser.nameBn ? `(${currentUser.nameBn})` : ''}
                </h2>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    currentUser.role === 'ADMIN'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
                      : currentUser.role === 'CASHIER'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                  }`}
                >
                  {currentUser.role}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Home className="w-3.5 h-3.5" />
                  {currentUser.roomNumber || 'Room 301'}
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                <span>{currentUser.email}</span>
                <span>·</span>
                <span>{currentUser.phone || '+880 1700-000000'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center flex-wrap">
            <button
              onClick={() => {
                setSelectedSlip({
                  type: 'MEMBER_STATEMENT',
                  id: currentUser.id,
                  title: `Monthly Statement - ${currentUser.name}`,
                  titleBn: 'মেম্বার মাসিক হিসাব স্টেটমেন্ট ও ইনভয়েস',
                  date: new Date().toISOString().split('T')[0],
                  amount: Math.abs(mySummary.netBalance),
                  payerName: currentUser.name,
                  payerRole: currentUser.role,
                  note: `Total Deposited: ৳${mySummary.totalDeposited}, Share: ৳${mySummary.share}, Net Balance: ${mySummary.netBalance >= 0 ? '+' : ''}৳${mySummary.netBalance}`,
                  items: [
                    { itemName: 'Total Mess Fund Advance Deposited', quantity: 1, unit: 'sum', unitPrice: mySummary.totalDeposited, totalPrice: mySummary.totalDeposited },
                    { itemName: 'My Equal Share of Collective Mess Expenses', quantity: 1, unit: 'share', unitPrice: mySummary.share, totalPrice: mySummary.share }
                  ]
                });
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Invoice / Slip</span>
            </button>

            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors flex items-center gap-1.5 border border-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Switch</span>
            </button>
            <button
              onClick={logout}
              className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-xs font-semibold transition-colors flex items-center gap-1.5 border border-rose-800/40"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* 4 Financial Key Metrics for Current Logged-In User */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
          {/* Net Balance Status */}
          <div className="bg-slate-800/70 backdrop-blur-xs p-4 rounded-xl border border-slate-700">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Net Balance
            </div>
            <div
              className={`text-2xl font-black tabular-nums mt-1 ${
                mySummary.netBalance > 0.01
                  ? 'text-emerald-400'
                  : mySummary.netBalance < -0.01
                  ? 'text-rose-400'
                  : 'text-slate-300'
              }`}
            >
              {formatTaka(mySummary.netBalance, true)}
            </div>
            <div className="mt-1 text-[11px] font-semibold">
              {mySummary.netBalance > 0.01 ? (
                <span className="text-emerald-300">Receivable</span>
              ) : mySummary.netBalance < -0.01 ? (
                <span className="text-rose-300">Payable</span>
              ) : (
                <span className="text-slate-400">Settled</span>
              )}
            </div>
          </div>

          {/* Total Deposited */}
          <div className="bg-slate-800/70 backdrop-blur-xs p-4 rounded-xl border border-slate-700">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Deposited
            </div>
            <div className="text-2xl font-black text-white tabular-nums mt-1">
              ৳{mySummary.totalDeposited.toLocaleString('en-IN')}
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              {myContributions.length} records
            </div>
          </div>

          {/* Expense Share */}
          <div className="bg-slate-800/70 backdrop-blur-xs p-4 rounded-xl border border-slate-700">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              My Share
            </div>
            <div className="text-2xl font-black text-white tabular-nums mt-1">
              ৳{mySummary.share.toLocaleString('en-IN')}
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              Equal cost split
            </div>
          </div>

          {/* Total Bazar Purchased by Me */}
          <div className="bg-slate-800/70 backdrop-blur-xs p-4 rounded-xl border border-slate-700">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Bazar Spent
            </div>
            <div className="text-2xl font-black text-emerald-400 tabular-nums mt-1">
              ৳{myTotalBazarSpent.toLocaleString('en-IN')}
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              {myBazarRecords.length} trips
            </div>
          </div>
        </div>

        {/* Settlement Suggestions specifically for this User */}
        {(mySettlementsToPay.length > 0 || mySettlementsToReceive.length > 0) && (
          <div className="mt-4 p-3 bg-indigo-950/60 border border-indigo-800/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <ArrowRightLeft className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <span className="text-indigo-200 font-medium">Settlement: </span>
                {mySettlementsToPay.length > 0 ? (
                  <span className="text-white font-bold">
                    You owe {mySettlementsToPay[0].toMemberName} ৳{mySettlementsToPay[0].amount.toLocaleString('en-IN')}
                  </span>
                ) : (
                  <span className="text-white font-bold">
                    {mySettlementsToReceive[0].fromMemberName} owes you ৳{mySettlementsToReceive[0].amount.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
            </div>
            {mySettlementsToPay.length > 0 && (
              <button
                onClick={() => {
                  setSelectedSuggestion(mySettlementsToPay[0]);
                  setIsSettlementOpen(true);
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold transition-colors whitespace-nowrap self-start sm:self-auto shadow-xs"
              >
                Settle Payment
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tab bar for Personal Details */}
      <div className="flex border-b border-slate-200 text-xs font-semibold bg-slate-50 px-4 sm:px-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'border-slate-900 text-slate-900 bg-white font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('deposits')}
          className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'deposits'
              ? 'border-slate-900 text-slate-900 bg-white font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <PiggyBank className="w-3.5 h-3.5" />
          <span>Deposits ({myContributions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('bazar')}
          className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'bazar'
              ? 'border-slate-900 text-slate-900 bg-white font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Bazar ({myBazarRecords.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('duties')}
          className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'duties'
              ? 'border-slate-900 text-slate-900 bg-white font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CalendarCheck className="w-3.5 h-3.5" />
          <span>Duties ({myDuties.length})</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="p-5 sm:p-6">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Today's & Upcoming Duties for Me */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <CalendarCheck className="w-4 h-4 text-slate-700" />
                <span>My Duties</span>
              </h3>

              {myDuties.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center">
                  No scheduled duties.
                </div>
              ) : (
                <div className="space-y-2">
                  {myDuties.slice(0, 4).map((duty) => (
                    <div
                      key={duty.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span>{duty.dutyType}</span>
                          {duty.mealType && (
                            <span className="text-[10px] text-slate-500 font-normal">
                              ({duty.mealType})
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              duty.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : duty.status === 'MISSED'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {duty.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Date: <strong>{duty.date}</strong>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {duty.status !== 'COMPLETED' && (
                          <button
                            onClick={() => toggleDutyStatus(duty.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition-colors"
                          >
                            Done
                          </button>
                        )}
                        <button
                          onClick={() => setSwapDuty(duty)}
                          className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition-colors"
                        >
                          Swap
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pending Swaps or Recent Deposits */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <PiggyBank className="w-4 h-4 text-slate-700" />
                <span>Recent Deposits</span>
              </h3>

              {myContributions.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center">
                  No deposits recorded yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {myContributions.slice(0, 3).map((c) => (
                    <div
                      key={c.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">
                          ৳{c.amount.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {c.paymentMethod} · {c.transactionDate} {c.note ? `· ${c.note}` : ''}
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          setSelectedSlip({
                            type: 'DEPOSIT',
                            id: c.id,
                            title: `Deposit - ৳${c.amount}`,
                            titleBn: 'মেস তহবিল জমা রসিদ',
                            date: c.transactionDate,
                            amount: c.amount,
                            paymentMethod: c.paymentMethod,
                            payerName: currentUser.name,
                            payerRole: currentUser.role,
                            note: c.note,
                            receiptUrl: c.receiptUrl
                          })
                        }
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-[11px] transition-colors inline-flex items-center gap-1"
                        title="View Receipt Slip"
                      >
                        <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Slip</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: MY DEPOSITS */}
        {activeTab === 'deposits' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                Deposits ({myContributions.length})
              </span>
              <span className="text-xs font-bold text-slate-900">
                Total: ৳{mySummary.totalDeposited.toLocaleString('en-IN')}
              </span>
            </div>

            {myContributions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                No deposit records found.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Method</th>
                      <th className="py-2.5 px-3">Note</th>
                      <th className="py-2.5 px-3 text-right">Slip / Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {myContributions.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 text-slate-600">{c.transactionDate}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          ৳{c.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-700">
                            {c.paymentMethod}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">{c.note || '-'}</td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() =>
                              setSelectedSlip({
                                type: 'DEPOSIT',
                                id: c.id,
                                title: `Deposit - ৳${c.amount}`,
                                titleBn: 'মেস তহবিল জমা রসিদ',
                                date: c.transactionDate,
                                amount: c.amount,
                                paymentMethod: c.paymentMethod,
                                payerName: currentUser.name,
                                payerRole: currentUser.role,
                                note: c.note,
                                receiptUrl: c.receiptUrl
                              })
                            }
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-[11px] transition-colors inline-flex items-center gap-1"
                          >
                            <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Slip</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MY BAZAR TRIPS */}
        {activeTab === 'bazar' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                Bazar Trips ({myBazarRecords.length})
              </span>
              <span className="text-xs font-bold text-emerald-700">
                Total: ৳{myTotalBazarSpent.toLocaleString('en-IN')}
              </span>
            </div>

            {myBazarRecords.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                No bazar records logged yet.
              </div>
            ) : (
              <div className="space-y-3">
                {myBazarRecords.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900 text-sm">
                          {b.marketName}
                        </div>
                        <div className="text-xs text-slate-500">
                          {b.date} {b.note ? `· ${b.note}` : ''}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-black text-slate-900">
                          ৳{Number(b.totalAmount).toLocaleString('en-IN')}
                        </div>
                        <button
                          onClick={() =>
                            setSelectedSlip({
                              type: 'BAZAR',
                              id: b.id,
                              title: `Bazar - ${b.marketName}`,
                              titleBn: 'বাজার মেমো ও ইনভয়েস',
                              date: b.date,
                              amount: Number(b.totalAmount),
                              payerName: currentUser.name,
                              payerRole: currentUser.role,
                              note: b.note,
                              receiptUrl: b.receiptUrl,
                              items: b.items?.map((it) => ({
                                itemName: it.itemName,
                                quantity: it.quantity,
                                unit: it.unit,
                                unitPrice: it.unitPrice,
                                totalPrice: it.totalPrice
                              }))
                            })
                          }
                          className="text-xs text-indigo-600 hover:underline font-semibold inline-flex items-center gap-1 mt-0.5"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>Memo / Slip</span>
                        </button>
                      </div>
                    </div>

                    {/* Item breakdown */}
                    {b.items && b.items.length > 0 && (
                      <div className="border-t border-slate-200 pt-2 text-xs">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {b.items.map((it, idx) => (
                            <div
                              key={idx}
                              className="p-2 bg-white rounded-lg border border-slate-200 flex justify-between"
                            >
                              <span className="text-slate-800 font-medium">{it.itemName}</span>
                              <span className="text-slate-500">
                                {it.quantity} {it.unit} (৳{it.totalPrice})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: MY DUTIES */}
        {activeTab === 'duties' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                Scheduled Duties
              </span>
              <span className="text-xs text-slate-500">
                Completed: {myDuties.filter((d) => d.status === 'COMPLETED').length} / {myDuties.length}
              </span>
            </div>

            {myDuties.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                No duties assigned currently.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {myDuties.map((duty) => (
                  <div
                    key={duty.id}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                        <span>{duty.dutyType}</span>
                        {duty.mealType && (
                          <span className="text-slate-500 font-normal">
                            ({duty.mealType})
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            duty.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {duty.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Date: <strong>{duty.date}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {duty.status !== 'COMPLETED' && (
                        <button
                          onClick={() => toggleDutyStatus(duty.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition-colors"
                        >
                          Done
                        </button>
                      )}
                      <button
                        onClick={() => setSwapDuty(duty)}
                        className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                      >
                        Swap
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals for Settlement, Swap, Receipt */}
      {selectedSuggestion && (
        <RecordSettlementModal
          isOpen={isSettlementOpen}
          onClose={() => {
            setIsSettlementOpen(false);
            setSelectedSuggestion(null);
          }}
          presetSuggestion={selectedSuggestion}
        />
      )}

      {swapDuty && (
        <RequestDutySwapModal
          isOpen={!!swapDuty}
          onClose={() => setSwapDuty(null)}
          duty={swapDuty}
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
