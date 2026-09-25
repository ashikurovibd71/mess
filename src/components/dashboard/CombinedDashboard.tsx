import React, { useState } from 'react';
import { useMess } from '../../context/MessContext';
import { formatTaka } from '../../services/accountingEngine';
import {
  Wallet,
  Receipt,
  Users,
  PiggyBank,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  CalendarCheck,
  Utensils,
  Plus,
  RefreshCw,
  ShoppingBag
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { AddDepositModal } from '../modals/AddDepositModal';
import { AddBazarModal } from '../modals/AddBazarModal';
import { AddExpenseModal } from '../modals/AddExpenseModal';
import { RecordSettlementModal } from '../modals/RecordSettlementModal';
import { SettlementSuggestion } from '../../types';
import { MyPersonalRecordsCard } from './MyPersonalRecordsCard';

const CATEGORY_COLORS = [
  '#059669', // Bazar (Emerald)
  '#2563EB', // Electricity (Blue)
  '#D97706', // Gas (Amber)
  '#7C3AED', // Internet (Purple)
  '#DC2626', // House rent (Red)
  '#0891B2', // Cleaning (Cyan)
  '#4F46E5', // Maintenance (Indigo)
  '#64748B'  // Other (Slate)
];

export const CombinedDashboard: React.FC<{ onNavigate: (tab: any) => void }> = ({ onNavigate }) => {
  const {
    currentUser,
    currentRole,
    financialOverview,
    cashBalance,
    state,
    membersMap,
    toggleDutyStatus
  } = useMess();

  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isBazarOpen, setIsBazarOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [isSettlementOpen, setIsSettlementOpen] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<SettlementSuggestion | null>(null);

  // Today's date string "2026-09-25"
  const todayStr = '2026-09-25';
  const tomorrowStr = '2026-09-26';

  // Today's duties
  const todayDuties = state.dutySchedules.filter((d) => d.date === todayStr);

  // Tomorrow's duties
  const tomorrowDuties = state.dutySchedules.filter((d) => d.date === tomorrowStr);

  // Today's meal plan
  const todayMeal = state.mealPlans.find((m) => m.date === todayStr);

  // Current user's specific financial status
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

  // User-specific settlement action
  const mySuggestions = financialOverview.settlementSuggestions.filter(
    (s) => s.fromMemberId === currentUser.id || s.toMemberId === currentUser.id
  );

  // Bazar total from category breakdown
  const bazarCategory = financialOverview.categoryBreakdown.find((c) => c.code === 'BAZAR');
  const bazarTotal = bazarCategory?.amount || 0;

  // Member balance chart data
  const balanceChartData = financialOverview.memberSummaries.map((m) => ({
    name: m.memberName,
    balance: m.netBalance
  }));

  return (
    <div className="space-y-6">
      {/* 1. Logged-in User Personal Records Card */}
      <MyPersonalRecordsCard />

      {/* 2. Whole Mess Financial & Operations Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Mess Overview
            </h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {state.mess?.name || 'Dhaka Bachelor Mess'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {financialOverview.monthName}
          </p>
        </div>

        {/* Action quick buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDepositOpen(true)}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
          >
            + Deposit
          </button>
          <button
            onClick={() => setIsBazarOpen(true)}
            className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
          >
            + Bazar
          </button>
          <button
            onClick={() => setIsExpenseOpen(true)}
            className="px-3 py-1.5 text-xs font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
          >
            + Bill
          </button>
        </div>
      </div>

      {/* Primary Financial Metric Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Mess Cash Balance */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Cash Balance
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">
            ৳{cashBalance.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Current fund in drawer
          </div>
        </div>

        {/* This Month Total Expense */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Total Expenses
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">
            ৳{financialOverview.totalExpenses.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Bazar (৳{bazarTotal.toLocaleString('en-IN')}) + Bills (৳{(financialOverview.totalExpenses - bazarTotal).toLocaleString('en-IN')})
          </div>
        </div>

        {/* Per Member Share */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Per Person Share
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">
            ৳{financialOverview.perMemberShare.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Split across {financialOverview.activeMemberCount || 1} members
          </div>
        </div>

        {/* Total Collections / Deposits */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Total Deposits
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">
            ৳{financialOverview.totalDeposits.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {state.contributions.length} deposits recorded
          </div>
        </div>
      </div>

      {/* Two Column Layout: Today's Daily Management & Finance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Today's Daily Mess Schedule & Meals */}
        <div className="lg:col-span-6 space-y-6">
          {/* Today's Duty Roster */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-slate-700" />
                <h2 className="text-sm font-bold text-slate-900">
                  Today’s Duties
                </h2>
              </div>
              <button
                onClick={() => onNavigate('duties')}
                className="text-xs text-slate-500 hover:text-slate-900 font-medium flex items-center gap-1"
              >
                <span>Full Roster</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              {todayDuties.map((duty) => {
                const member = membersMap.get(duty.memberId);
                const isCompleted = duty.status === 'COMPLETED';

                return (
                  <div
                    key={duty.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      isCompleted
                        ? 'bg-slate-50/60 border-slate-200/80 text-slate-600'
                        : 'bg-white border-slate-200 text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                          duty.dutyType === 'BAZAR'
                            ? 'bg-emerald-100 text-emerald-800'
                            : duty.dutyType === 'COOKING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {duty.dutyType === 'BAZAR' ? 'বা' : duty.dutyType === 'COOKING' ? 'রা' : 'প'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-900">
                            {duty.dutyType}{' '}
                            {duty.mealType ? `(${duty.mealType})` : ''}
                          </span>
                          <span className="text-xs font-medium text-slate-700">
                            · {member?.name}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {duty.note || (isCompleted ? 'Finished on schedule' : 'Assigned')}
                        </div>
                      </div>
                    </div>

                    <div>
                      {isCompleted ? (
                        <div className="flex items-center gap-1 text-emerald-700 text-xs font-medium bg-emerald-50 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Done</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => toggleDutyStatus(duty.id)}
                          className="px-2.5 py-1 text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 rounded transition-colors"
                        >
                          Mark Completed
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Upcoming duties tomorrow */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Tomorrow’s Schedule
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {tomorrowDuties.slice(0, 4).map((d) => {
                  const member = membersMap.get(d.memberId);
                  return (
                    <div
                      key={d.id}
                      className="px-2.5 py-1 bg-slate-100 rounded-md text-slate-700"
                    >
                      <span className="text-slate-500">
                        {d.dutyType} {d.mealType ? `(${d.mealType})` : ''}:
                      </span>{' '}
                      <span className="font-semibold text-slate-900">{member?.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Today's Meal Menu */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4 text-slate-700" />
                <h2 className="text-sm font-bold text-slate-900">Today’s Meals</h2>
              </div>
              <button
                onClick={() => onNavigate('meals-shopping')}
                className="text-xs text-slate-500 hover:text-slate-900 font-medium"
              >
                Edit
              </button>
            </div>

            {todayMeal ? (
              <div className="mt-3 space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-semibold text-slate-900">Breakfast:</span>{' '}
                  <span className="text-slate-700">{todayMeal.breakfast}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-semibold text-slate-900">Lunch:</span>{' '}
                  <span className="text-slate-700">{todayMeal.lunch}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-semibold text-slate-900">Dinner:</span>{' '}
                  <span className="text-slate-700">{todayMeal.dinner}</span>
                </div>
                {todayMeal.note && (
                  <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded">
                    📌 {todayMeal.note}
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-3 text-xs text-slate-500">No meal plan entered for today.</div>
            )}
          </div>
        </div>

        {/* Right Column: Financial Breakdown Charts */}
        <div className="lg:col-span-6 space-y-6">
          {/* Member Balance Distribution Chart */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Member Balances</h2>
              </div>
              <button
                onClick={() => onNavigate('settlements')}
                className="text-xs text-slate-500 hover:text-slate-900 font-medium flex items-center gap-1"
              >
                <span>Settlements</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="mt-4 h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={balanceChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                  <Tooltip
                    formatter={(val: any) => [`৳${val.toLocaleString('en-IN')}`, 'Net Balance']}
                    contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}
                  />
                  <Bar dataKey="balance" radius={[4, 4, 0, 0]}>
                    {balanceChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.balance >= 0 ? '#10B981' : '#EF4444'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Quick table of member shares */}
            <div className="mt-3 divide-y divide-slate-100 text-xs">
              {financialOverview.memberSummaries.map((m) => (
                <div key={m.memberId} className="py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{m.memberName}</span>
                    <span className="text-[11px] text-slate-500">
                      Paid: ৳{m.totalDeposited.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div
                    className={`font-semibold tabular-nums ${
                      m.netBalance > 0
                        ? 'text-emerald-700'
                        : m.netBalance < 0
                        ? 'text-rose-700'
                        : 'text-slate-600'
                    }`}
                  >
                    {formatTaka(m.netBalance, true)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Expense Category Breakdown Chart */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Expenses by Category</h2>
              </div>
              <button
                onClick={() => onNavigate('expenses')}
                className="text-xs text-slate-500 hover:text-slate-900 font-medium"
              >
                All Expenses
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 items-center">
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={financialOverview.categoryBreakdown}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={36}
                      outerRadius={65}
                      paddingAngle={3}
                    >
                      {financialOverview.categoryBreakdown.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [`৳${val.toLocaleString('en-IN')}`, 'Amount']}
                      contentStyle={{ fontSize: '11px', borderRadius: '6px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-1.5 text-xs">
                {financialOverview.categoryBreakdown.slice(0, 5).map((cat, idx) => (
                  <div key={cat.code} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                      />
                      <span className="text-slate-700 truncate">{cat.category}</span>
                    </div>
                    <span className="font-semibold text-slate-900 tabular-nums shrink-0">
                      ৳{cat.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddDepositModal isOpen={isDepositOpen} onClose={() => setIsDepositOpen(false)} />
      <AddBazarModal isOpen={isBazarOpen} onClose={() => setIsBazarOpen(false)} />
      <AddExpenseModal isOpen={isExpenseOpen} onClose={() => setIsExpenseOpen(false)} />
      <RecordSettlementModal
        isOpen={isSettlementOpen}
        onClose={() => {
          setIsSettlementOpen(false);
          setSelectedSuggestion(null);
        }}
        presetSuggestion={selectedSuggestion}
      />
    </div>
  );
};
