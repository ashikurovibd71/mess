import React, { useState, useMemo } from 'react';
import { useMess } from '../../context/MessContext';
import { buildLedger } from '../../services/accountingEngine';
import { LedgerTransactionType } from '../../types';
import {
  BookOpen,
  Search,
  Filter,
  Download,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  Calendar,
  Wallet
} from 'lucide-react';

export const LedgerView: React.FC = () => {
  const { state, membersMap, categoriesMap, cashBalance } = useMess();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterMember, setFilterMember] = useState<string>('ALL');

  // Build unified ledger entries
  const currentMonthAccount = state.monthlyAccounts.find(
    (m) => m.monthYear === state.selectedMonth
  ) || { openingBalance: 2000 };

  const allLedgerEntries = useMemo(() => {
    return buildLedger(
      state.activeMessId,
      currentMonthAccount.openingBalance,
      state.contributions,
      state.expenses,
      state.settlements,
      membersMap,
      categoriesMap
    );
  }, [
    state.activeMessId,
    currentMonthAccount.openingBalance,
    state.contributions,
    state.expenses,
    state.settlements,
    membersMap,
    categoriesMap
  ]);

  const filteredEntries = allLedgerEntries.filter((item) => {
    if (filterType !== 'ALL' && item.type !== filterType) return false;
    if (filterMember !== 'ALL' && item.memberId !== filterMember) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchName = item.memberName?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchName) return false;
    }
    return true;
  });

  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Title', 'Description', 'Amount (BDT)', 'Impact on Cash', 'Running Balance'];
    const rows = filteredEntries.map((e) => [
      e.date,
      e.type,
      `"${e.title.replace(/"/g, '""')}"`,
      `"${e.description.replace(/"/g, '""')}"`,
      e.amount,
      e.impactOnCash,
      e.runningBalance ?? ''
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mess_ledger_${state.selectedMonth}.csv`);
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
            Unified Mess Financial Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Section 14 & 15 · Chronological audit ledger distinguishing mess fund flows from member settlements
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Closing Cash Position</div>
            <div className="text-base font-bold text-slate-900 tabular-nums">
              ৳{cashBalance.toLocaleString('en-IN')}
            </div>
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search transactions, notes, members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white shrink-0"
          >
            <option value="ALL">All Event Types</option>
            <option value="CONTRIBUTION">Deposits Only (+Cash)</option>
            <option value="EXPENSE">Expenses Only (-Cash)</option>
            <option value="SETTLEMENT">Settlements (0 Cash)</option>
          </select>

          <select
            value={filterMember}
            onChange={(e) => setFilterMember(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white shrink-0"
          >
            <option value="ALL">All Members</option>
            {state.members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Unified Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Amount (৳)</th>
                <th className="py-3 px-4 text-right">Impact on Cash</th>
                <th className="py-3 px-4 text-right">Running Cash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredEntries.map((item) => {
                const isDeposit = item.type === 'CONTRIBUTION';
                const isExpense = item.type === 'EXPENSE';
                const isSettlement = item.type === 'SETTLEMENT';

                return (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{item.date}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isDeposit
                            ? 'bg-emerald-100 text-emerald-800'
                            : isExpense
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{item.title}</div>
                      <div className="text-[11px] text-slate-500">{item.description}</div>
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-slate-900 font-bold text-sm whitespace-nowrap">
                      ৳{item.amount.toLocaleString('en-IN')}
                    </td>
                    <td
                      className={`py-3 px-4 text-right tabular-nums font-semibold whitespace-nowrap ${
                        item.impactOnCash > 0
                          ? 'text-emerald-700'
                          : item.impactOnCash < 0
                          ? 'text-rose-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {item.impactOnCash > 0
                        ? `+৳${item.impactOnCash.toLocaleString('en-IN')}`
                        : item.impactOnCash < 0
                        ? `-৳${Math.abs(item.impactOnCash).toLocaleString('en-IN')}`
                        : '৳0 (Personal)'}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-slate-700 font-medium whitespace-nowrap">
                      {item.runningBalance !== undefined ? `৳${item.runningBalance.toLocaleString('en-IN')}` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
