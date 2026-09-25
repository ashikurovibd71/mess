import React, { useState } from 'react';
import { useMess } from '../../context/MessContext';
import {
  CalendarDays,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  ArrowRight,
  Receipt
} from 'lucide-react';
import { UniversalSlipInvoiceModal, SlipInvoiceData } from '../modals/UniversalSlipInvoiceModal';

export const MonthlyAccountView: React.FC = () => {
  const {
    state,
    currentRole,
    selectedMonth,
    financialOverview,
    isMonthClosed,
    closeMonth,
    reopenMonth
  } = useMess();

  const [closingNotes, setClosingNotes] = useState('');
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState<SlipInvoiceData | null>(null);

  const handleCloseMonth = () => {
    closeMonth(closingNotes.trim() || undefined);
    setShowCloseConfirm(false);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Monthly Accounts
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Financial balance sheet for {financialOverview.monthName}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() =>
              setSelectedSlip({
                type: 'MONTHLY_SUMMARY',
                id: selectedMonth,
                title: `Mess Statement - ${financialOverview.monthName}`,
                titleBn: 'মেস মাসিক সার্বিক হিসাব বিবরণী ও ইনভয়েস',
                date: new Date().toISOString().split('T')[0],
                amount: financialOverview.totalExpenses,
                note: `Opening: ৳${financialOverview.openingBalance}, Deposits: ৳${financialOverview.totalDeposits}, Expenses: ৳${financialOverview.totalExpenses}, Cash in Drawer: ৳${financialOverview.cashBalance}`,
                items: [
                  { itemName: 'Opening Fund Balance', quantity: 1, unit: 'fund', unitPrice: financialOverview.openingBalance, totalPrice: financialOverview.openingBalance },
                  { itemName: 'Total Mess Member Deposits Collected', quantity: 1, unit: 'sum', unitPrice: financialOverview.totalDeposits, totalPrice: financialOverview.totalDeposits },
                  { itemName: 'Total Mess Operational & Bazar Expenses', quantity: 1, unit: 'expense', unitPrice: financialOverview.totalExpenses, totalPrice: financialOverview.totalExpenses },
                  { itemName: 'Remaining Cash Fund Position', quantity: 1, unit: 'balance', unitPrice: financialOverview.cashBalance, totalPrice: financialOverview.cashBalance }
                ]
              })
            }
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
          >
            <Receipt className="w-3.5 h-3.5 text-emerald-600" />
            <span>Monthly Invoice</span>
          </button>

          {isMonthClosed ? (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1.5 rounded-lg">
                <Lock className="w-3.5 h-3.5" />
                <span>CLOSED</span>
              </span>
              {currentRole === 'ADMIN' && (
                <button
                  onClick={reopenMonth}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Reopen</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-lg">
                <Unlock className="w-3.5 h-3.5" />
                <span>OPEN</span>
              </span>
              {currentRole === 'ADMIN' && (
                <button
                  onClick={() => setShowCloseConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Close Month</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Close Month Confirmation Box */}
      {showCloseConfirm && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-5 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-sm font-bold text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span>Freeze Monthly Accounts ({financialOverview.monthName})</span>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            Closing will lock this month's records. The closing balance (<strong>৳{financialOverview.cashBalance.toLocaleString('en-IN')}</strong>) will carry over to next month.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Audit Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. All utility bills cleared."
              value={closingNotes}
              onChange={(e) => setClosingNotes(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowCloseConfirm(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              onClick={handleCloseMonth}
              className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
            >
              Confirm & Lock Month
            </button>
          </div>
        </div>
      )}

      {/* Month Account Balance Sheet */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-5">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
          Monthly Account Statement · {financialOverview.monthName}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Opening Balance
            </span>
            <div className="text-2xl font-bold text-slate-900 tabular-nums mt-1">
              ৳{financialOverview.openingBalance.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Brought forward from August</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Total Deposits (মোট জমা)
            </span>
            <div className="text-2xl font-bold text-emerald-800 tabular-nums mt-1">
              +৳{financialOverview.totalDeposits.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">5 active members</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Total Expenses (মোট খরচ)
            </span>
            <div className="text-2xl font-bold text-rose-800 tabular-nums mt-1">
              -৳{financialOverview.totalExpenses.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Bazar + Utilities</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 text-white">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
              Closing Cash Balance (সমাপনী স্থিতি)
            </span>
            <div className="text-2xl font-bold text-white tabular-nums mt-1">
              ৳{financialOverview.cashBalance.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-emerald-400 mt-0.5">Available in Mess Cash Box</div>
          </div>
        </div>

        {/* Audit status */}
        <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="text-slate-700">
              Audit Status:{' '}
              <strong className="text-slate-900">
                {isMonthClosed ? 'Finalized and Frozen' : 'Live and Calculating'}
              </strong>
            </span>
          </div>

          <span className="text-slate-500">
            Active Members: <strong>{financialOverview.activeMemberCount}</strong> · Per Share:{' '}
            <strong>৳{financialOverview.perMemberShare.toLocaleString('en-IN')}</strong>
          </span>
        </div>
      </div>

      <UniversalSlipInvoiceModal
        isOpen={!!selectedSlip}
        onClose={() => setSelectedSlip(null)}
        data={selectedSlip}
      />
    </div>
  );
};
