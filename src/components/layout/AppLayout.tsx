import React, { useState } from 'react';
import { useMess } from '../../context/MessContext';
import {
  LayoutDashboard,
  CalendarCheck,
  UtensilsCrossed,
  ShoppingCart,
  Receipt,
  PiggyBank,
  ArrowRightLeft,
  BookOpen,
  CalendarDays,
  FileSpreadsheet,
  Users,
  ShieldCheck,
  Bell,
  Plus,
  LogOut,
  ChevronDown,
  Check,
  ExternalLink,
  Sparkles,
  RotateCcw,
  Database,
  LogIn
} from 'lucide-react';
import { AddDepositModal } from '../modals/AddDepositModal';
import { AddBazarModal } from '../modals/AddBazarModal';
import { AddExpenseModal } from '../modals/AddExpenseModal';
import { RecordSettlementModal } from '../modals/RecordSettlementModal';
import { AuthModal } from '../auth/AuthModal';

export type ActiveTab =
  | 'dashboard'
  | 'duties'
  | 'meals-shopping'
  | 'bazar'
  | 'expenses'
  | 'contributions'
  | 'settlements'
  | 'ledger'
  | 'monthly-accounts'
  | 'reports'
  | 'members'
  | 'audit-logs';

interface Props {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<Props> = ({ activeTab, setActiveTab, children }) => {
  const {
    state,
    currentUser,
    currentRole,
    setCurrentUserId,
    selectedMonth,
    setSelectedMonth,
    cashBalance,
    markNotificationRead,
    markAllNotificationsRead,
    clearAllDatabaseData,
    isAuthenticated,
    isAuthModalOpen,
    setIsAuthModalOpen,
    logout
  } = useMess();

  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isBazarOpen, setIsBazarOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [isSettlementOpen, setIsSettlementOpen] = useState(false);

  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);

  const unreadNotifications = state.notifications.filter((n) => !n.isRead);

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    {
      id: 'duties',
      label: 'Daily Duties',
      icon: <CalendarCheck className="w-4 h-4" />,
      badge: state.dutySwaps.filter((s) => s.status === 'PENDING').length || undefined
    },
    { id: 'meals-shopping', label: 'Meal & Shopping', icon: <UtensilsCrossed className="w-4 h-4" /> },
    { id: 'bazar', label: 'Bazar Records', icon: <ShoppingCart className="w-4 h-4" /> },
    { id: 'expenses', label: 'Expenses & Bills', icon: <Receipt className="w-4 h-4" /> },
    { id: 'contributions', label: 'Deposits', icon: <PiggyBank className="w-4 h-4" /> },
    { id: 'settlements', label: 'Settlement Engine', icon: <ArrowRightLeft className="w-4 h-4" /> },
    { id: 'ledger', label: 'Unified Ledger', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'monthly-accounts', label: 'Monthly Closing', icon: <CalendarDays className="w-4 h-4" /> },
    { id: 'reports', label: 'Financial Reports', icon: <FileSpreadsheet className="w-4 h-4" /> },
    { id: 'members', label: 'Mess Members', icon: <Users className="w-4 h-4" /> },
    { id: 'audit-logs', label: 'Audit Trail', icon: <ShieldCheck className="w-4 h-4" /> }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="text-left group flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm tracking-tight">
                মেস
              </div>
              <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
                Dhaka Bachelor Mess
              </span>
            </button>

            {/* Month indicator */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-md text-xs font-medium text-slate-700">
              <span className="text-slate-400">Month:</span>
              <span className="font-semibold text-slate-900">September 2026</span>
            </div>

            {/* Neon DB Live status */}
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-md text-xs font-medium border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              <span className="font-semibold">Neon PostgreSQL Live</span>
            </div>
          </div>

          {/* Zone 2: Primary Nav Links (Compact desktop) */}
          <nav className="hidden md:flex items-center gap-5 text-xs font-medium text-slate-600">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap ${
                activeTab === 'dashboard' ? 'text-slate-900 font-semibold' : ''
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('duties')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap ${
                activeTab === 'duties' ? 'text-slate-900 font-semibold' : ''
              }`}
            >
              Duties
            </button>
            <button
              onClick={() => setActiveTab('bazar')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap ${
                activeTab === 'bazar' ? 'text-slate-900 font-semibold' : ''
              }`}
            >
              Bazar
            </button>
            <button
              onClick={() => setActiveTab('settlements')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap ${
                activeTab === 'settlements' ? 'text-slate-900 font-semibold' : ''
              }`}
            >
              Settlement
            </button>
            <button
              onClick={() => setActiveTab('ledger')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap ${
                activeTab === 'ledger' ? 'text-slate-900 font-semibold' : ''
              }`}
            >
              Ledger
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap ${
                activeTab === 'reports' ? 'text-slate-900 font-semibold' : ''
              }`}
            >
              Reports
            </button>
          </nav>

          {/* Zone 3: Actions & Active User Switcher */}
          <div className="flex items-center gap-2.5">
            {/* Cashier quick deposit button */}
            <button
              onClick={() => setIsDepositOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Deposit</span>
            </button>

            {/* Quick Bazar button */}
            <button
              onClick={() => setIsBazarOpen(true)}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Bazar</span>
            </button>

            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
                className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors relative"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-600 rounded-full" />
                )}
              </button>

              {isNotifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-900">Notifications ({unreadNotifications.length})</span>
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-[11px] text-slate-500 hover:text-slate-900 font-medium"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 text-xs">
                    {state.notifications.slice(0, 6).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationRead(n.id)}
                        className={`p-3 cursor-pointer hover:bg-slate-50 transition-colors ${
                          !n.isRead ? 'bg-slate-50/70 font-medium' : ''
                        }`}
                      >
                        <div className="text-xs text-slate-900">{n.title}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">{n.message}</div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User & Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-xs text-left"
              >
                <div className="w-6 h-6 rounded-full bg-slate-800 text-white font-semibold flex items-center justify-center text-[10px]">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="hidden sm:block leading-tight">
                  <div className="font-semibold text-slate-900 truncate max-w-[90px]">{currentUser.name}</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">{currentRole}</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isRoleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                      Switch Active Member Role
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Switch between Admin, Cashier, and Member to experience role-based views.
                    </p>
                  </div>
                  <div className="py-1">
                    {state.members.map((member) => (
                      <button
                        key={member.id}
                        onClick={() => {
                          setCurrentUserId(member.id);
                          setIsRoleDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors text-left ${
                          member.id === currentUser.id
                            ? 'bg-slate-100 text-slate-900 font-semibold'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <div>
                          <div>{member.name} {member.nameBn ? `(${member.nameBn})` : ''}</div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            {member.role} · {member.roomNumber || 'Room 301'}
                          </div>
                        </div>
                        {member.id === currentUser.id && (
                          <Check className="w-3.5 h-3.5 text-slate-900 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-1">
                    <button
                      onClick={() => {
                        setIsAuthModalOpen(true);
                        setIsRoleDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg transition-colors font-semibold"
                    >
                      <LogIn className="w-3.5 h-3.5 text-slate-500" />
                      <span>Sign In / Custom Login (লগইন)</span>
                    </button>

                    {isAuthenticated && (
                      <button
                        onClick={() => {
                          logout();
                          setIsRoleDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 rounded-lg transition-colors font-medium"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out (লগআউট)</span>
                      </button>
                    )}

                    <button
                      onClick={async () => {
                        if (window.confirm('Are you sure you want to clear all transactional records from Neon PostgreSQL? This cannot be undone.')) {
                          await clearAllDatabaseData();
                          setIsRoleDropdownOpen(false);
                        }
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors font-medium"
                    >
                      <Database className="w-3.5 h-3.5" />
                      <span>Wipe / Clear All Data from Neon DB</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Container: Sidebar + Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex gap-6">
        {/* Left Sidebar */}
        <aside className="w-56 shrink-0 hidden md:block">
          <div className="sticky top-24 space-y-4">
            {/* Quick fund card */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Mess Cash Fund
              </span>
              <div className="text-xl font-bold text-slate-900 tabular-nums mt-0.5">
                ৳{cashBalance.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Dhaka Mess · Sept 2026
              </div>
            </div>

            {/* Navigation item list */}
            <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-2xs space-y-0.5">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors text-left ${
                      isActive
                        ? 'bg-slate-900 text-white font-semibold shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {item.icon}
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                          isActive ? 'bg-white text-slate-900' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Cashier Quick Actions Box */}
            <div className="p-3 bg-slate-900 text-white rounded-xl space-y-2 shadow-sm">
              <div className="text-xs font-semibold text-slate-200">
                Quick Actions ({currentRole})
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                <button
                  onClick={() => setIsDepositOpen(true)}
                  className="w-full py-1.5 px-2.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 rounded text-left flex items-center gap-2 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>+ Record Deposit</span>
                </button>
                <button
                  onClick={() => setIsBazarOpen(true)}
                  className="w-full py-1.5 px-2.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 rounded text-left flex items-center gap-2 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                  <span>+ Add Bazar Record</span>
                </button>
                <button
                  onClick={() => setIsExpenseOpen(true)}
                  className="w-full py-1.5 px-2.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 rounded text-left flex items-center gap-2 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-rose-400" />
                  <span>+ Add Utility Bill</span>
                </button>
                <button
                  onClick={() => setIsSettlementOpen(true)}
                  className="w-full py-1.5 px-2.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 rounded text-left flex items-center gap-2 transition-colors"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Record Settlement</span>
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Horizontal Navigation Strip */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-2 py-1.5 flex justify-around items-center">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center gap-0.5 text-[10px] ${
              activeTab === 'dashboard' ? 'text-slate-900 font-bold' : 'text-slate-500'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Home</span>
          </button>
          <button
            onClick={() => setActiveTab('duties')}
            className={`flex flex-col items-center gap-0.5 text-[10px] ${
              activeTab === 'duties' ? 'text-slate-900 font-bold' : 'text-slate-500'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Duties</span>
          </button>
          <button
            onClick={() => setActiveTab('bazar')}
            className={`flex flex-col items-center gap-0.5 text-[10px] ${
              activeTab === 'bazar' ? 'text-slate-900 font-bold' : 'text-slate-500'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Bazar</span>
          </button>
          <button
            onClick={() => setActiveTab('settlements')}
            className={`flex flex-col items-center gap-0.5 text-[10px] ${
              activeTab === 'settlements' ? 'text-slate-900 font-bold' : 'text-slate-500'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Settle</span>
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`flex flex-col items-center gap-0.5 text-[10px] ${
              activeTab === 'ledger' ? 'text-slate-900 font-bold' : 'text-slate-500'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Ledger</span>
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex flex-col items-center gap-0.5 text-[10px] ${
              activeTab === 'reports' ? 'text-slate-900 font-bold' : 'text-slate-500'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Reports</span>
          </button>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 pb-16 md:pb-0">{children}</main>
      </div>

      {/* Modals mounted at root */}
      <AddDepositModal isOpen={isDepositOpen} onClose={() => setIsDepositOpen(false)} />
      <AddBazarModal isOpen={isBazarOpen} onClose={() => setIsBazarOpen(false)} />
      <AddExpenseModal isOpen={isExpenseOpen} onClose={() => setIsExpenseOpen(false)} />
      <RecordSettlementModal isOpen={isSettlementOpen} onClose={() => setIsSettlementOpen(false)} />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
};
