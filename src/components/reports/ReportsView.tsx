import React, { useState } from 'react';
import { useMess } from '../../context/MessContext';
import { formatTaka } from '../../services/accountingEngine';
import { FileSpreadsheet, Download, Printer, User as UserIcon, Calendar, CheckCircle2 } from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { state, financialOverview, membersMap } = useMess();

  const [activeReportTab, setActiveReportTab] = useState<'MONTHLY' | 'MEMBER' | 'BAZAR'>('MONTHLY');
  const [selectedMemberId, setSelectedMemberId] = useState(state.members[0]?.id || '');

  const selectedMember = membersMap.get(selectedMemberId);
  const memberSummary = financialOverview.memberSummaries.find((m) => m.memberId === selectedMemberId);

  const memberContributions = state.contributions.filter(
    (c) => !c.isDeleted && c.memberId === selectedMemberId
  );

  const handlePrint = () => {
    window.print();
  };

  const exportMonthlyCSV = () => {
    const headers = ['Category / Item', 'Amount (BDT)'];
    const rows = [
      ['Opening Balance', financialOverview.openingBalance],
      ['Total Deposits', financialOverview.totalDeposits],
      ['Total Expenses', financialOverview.totalExpenses],
      ['Closing Cash Balance', financialOverview.cashBalance],
      ['Per Member Share', financialOverview.perMemberShare],
      ['', ''],
      ['--- Category Breakdown ---', ''],
      ...financialOverview.categoryBreakdown.map((c) => [c.category, c.amount]),
      ['', ''],
      ['--- Member Balances ---', ''],
      ...financialOverview.memberSummaries.map((m) => [
        `${m.memberName} (Deposited: ${m.totalDeposited}, Share: ${m.share})`,
        m.netBalance
      ])
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `monthly_report_${state.selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Reports
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Financial summaries and statements
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
          <button
            onClick={exportMonthlyCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-medium">
        <button
          onClick={() => setActiveReportTab('MONTHLY')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            activeReportTab === 'MONTHLY'
              ? 'bg-slate-900 text-white font-bold'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Monthly Comprehensive Report
        </button>
        <button
          onClick={() => setActiveReportTab('MEMBER')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            activeReportTab === 'MEMBER'
              ? 'bg-slate-900 text-white font-bold'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Individual Member Statement
        </button>
        <button
          onClick={() => setActiveReportTab('BAZAR')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            activeReportTab === 'BAZAR'
              ? 'bg-slate-900 text-white font-bold'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Bazar Market Audit
        </button>
      </div>

      {/* Tab 1: Monthly Comprehensive Report */}
      {activeReportTab === 'MONTHLY' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-base font-bold text-slate-900">
              Dhaka Bachelor Mess · September 2026 Financial Report
            </h2>
            <p className="text-xs text-slate-500">
              Generated automatically by Bachelor Mess Accounting System · 5 Active Members
            </p>
          </div>

          {/* Core financial numbers */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-500 uppercase font-semibold text-[10px]">Opening Balance</span>
              <div className="text-lg font-bold text-slate-900 tabular-nums mt-1">
                ৳{financialOverview.openingBalance.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-500 uppercase font-semibold text-[10px]">Total Collections</span>
              <div className="text-lg font-bold text-emerald-800 tabular-nums mt-1">
                ৳{financialOverview.totalDeposits.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-500 uppercase font-semibold text-[10px]">Total Expenses</span>
              <div className="text-lg font-bold text-rose-800 tabular-nums mt-1">
                ৳{financialOverview.totalExpenses.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="p-3 bg-slate-900 text-white rounded-lg">
              <span className="text-slate-400 uppercase font-semibold text-[10px]">Closing Cash Fund</span>
              <div className="text-lg font-bold text-white tabular-nums mt-1">
                ৳{financialOverview.cashBalance.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Member Ledger Breakdown */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Member-wise Account Balances
            </h3>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Member</th>
                    <th className="py-2.5 px-3 text-right">Deposited</th>
                    <th className="py-2.5 px-3 text-right">Expense Share</th>
                    <th className="py-2.5 px-3 text-right">Settlements</th>
                    <th className="py-2.5 px-3 text-right">Net Balance</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {financialOverview.memberSummaries.map((m) => (
                    <tr key={m.memberId}>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{m.memberName}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums">
                        ৳{m.totalDeposited.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums">
                        ৳{m.share.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-slate-600">
                        Paid: ৳{m.settlementsPaid} / Recv: ৳{m.settlementsReceived}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right tabular-nums font-bold ${
                          m.netBalance > 0
                            ? 'text-emerald-700'
                            : m.netBalance < 0
                            ? 'text-rose-700'
                            : 'text-slate-600'
                        }`}
                      >
                        {formatTaka(m.netBalance, true)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            m.netBalance > 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : m.netBalance < 0
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {m.statusLabel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Individual Member Statement */}
      {activeReportTab === 'MEMBER' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Individual Member Statement · {selectedMember?.name}
              </h2>
              <p className="text-xs text-slate-500">
                Personal deposits, share calculations, settlements, and net dues
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Select Member:</span>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
              >
                {state.members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {memberSummary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl">
                <span className="text-slate-500 font-semibold uppercase text-[10px]">Total Deposited</span>
                <div className="text-xl font-bold text-slate-900 tabular-nums mt-1">
                  ৳{memberSummary.totalDeposited.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl">
                <span className="text-slate-500 font-semibold uppercase text-[10px]">Assigned Share</span>
                <div className="text-xl font-bold text-slate-900 tabular-nums mt-1">
                  ৳{memberSummary.share.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl">
                <span className="text-slate-500 font-semibold uppercase text-[10px]">Settlements Handled</span>
                <div className="text-xl font-bold text-slate-900 tabular-nums mt-1">
                  ৳{memberSummary.settlementsPaid + memberSummary.settlementsReceived}
                </div>
              </div>

              <div
                className={`p-4 rounded-xl text-white ${
                  memberSummary.netBalance >= 0 ? 'bg-emerald-900' : 'bg-rose-900'
                }`}
              >
                <span className="text-slate-300 font-semibold uppercase text-[10px]">Net Balance Position</span>
                <div className="text-xl font-bold tabular-nums mt-1">
                  {formatTaka(memberSummary.netBalance, true)}
                </div>
              </div>
            </div>
          )}

          {/* Member's deposit transaction history */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Deposit History for {selectedMember?.name}
            </h3>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Method</th>
                    <th className="py-2 px-3">Notes</th>
                    <th className="py-2 px-3 text-right">Amount (৳)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {memberContributions.map((c) => (
                    <tr key={c.id}>
                      <td className="py-2 px-3 text-slate-500">{c.transactionDate}</td>
                      <td className="py-2 px-3">{c.paymentMethod}</td>
                      <td className="py-2 px-3 text-slate-600">{c.note || '—'}</td>
                      <td className="py-2 px-3 text-right tabular-nums font-bold text-slate-900">
                        ৳{c.amount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Bazar Market Audit */}
      {activeReportTab === 'BAZAR' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-base font-bold text-slate-900">Bazar Market Purchase Log</h2>
            <p className="text-xs text-slate-500">
              Audit trail of markets, buyers, and expenses for groceries
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Market Name</th>
                  <th className="py-2.5 px-3">Purchased By</th>
                  <th className="py-2.5 px-3 text-center">Items Count</th>
                  <th className="py-2.5 px-3 text-right">Total Amount (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.bazarRecords.map((b) => {
                  const purchaser = membersMap.get(b.purchasedBy);
                  return (
                    <tr key={b.id}>
                      <td className="py-2.5 px-3 text-slate-500">{b.date}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{b.marketName}</td>
                      <td className="py-2.5 px-3 text-slate-700">{purchaser?.name}</td>
                      <td className="py-2.5 px-3 text-center tabular-nums">{b.items.length}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums font-bold text-slate-900">
                        ৳{b.totalAmount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
