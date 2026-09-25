import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  User,
  Mess,
  MonthlyAccount,
  Contribution,
  ExpenseCategory,
  Expense,
  BazarRecord,
  BazarItem,
  Settlement,
  DutySchedule,
  DutySwapRequest,
  MealPlan,
  ShoppingListItem,
  AuditLog,
  AppNotification,
  Role,
  PaymentMethod,
  ExpenseCategoryCode,
  MonthlyFinancialOverview,
  DutyType,
  MealType,
  ShoppingPriority
} from '../types';
import {
  AppState,
  getInitialState,
  saveState,
  STORAGE_KEY
} from '../services/store';
import {
  getMonthlyFinancialOverview,
  buildLedger,
  calculateCashBalance,
  roundMoney
} from '../services/accountingEngine';
import {
  generateDutyRotation,
  calculateDutyStats,
  MemberDutyStat
} from '../services/dutyEngine';
import {
  apiRequest,
  getStoredToken,
  setStoredToken,
  clearStoredToken
} from '../services/api';

interface MessContextType {
  state: AppState;
  currentUser: User;
  currentRole: Role;
  setCurrentUserId: (id: string) => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  financialOverview: MonthlyFinancialOverview;
  cashBalance: number;
  membersMap: Map<string, User>;
  categoriesMap: Map<string, ExpenseCategory>;
  dutyStats: MemberDutyStat[];
  activeMembers: User[];
  isMonthClosed: boolean;

  // Actions
  addContribution: (data: {
    memberId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    transactionDate: string;
    note?: string;
    receiptUrl?: string;
  }) => Promise<void>;

  addExpense: (data: {
    categoryId: string;
    categoryCode: ExpenseCategoryCode;
    amount: number;
    description: string;
    expenseDate: string;
    paidBy: string;
    paymentMethod: PaymentMethod;
    note?: string;
    receiptUrl?: string;
    bazarId?: string;
  }) => Promise<void>;

  addBazarRecord: (data: {
    purchasedBy: string;
    marketName: string;
    date: string;
    note?: string;
    receiptUrl?: string;
    items: Omit<BazarItem, 'id' | 'bazarId'>[];
  }) => Promise<void>;

  convertShoppingToBazar: (
    items: { itemName: string; quantity: number; unit: string; unitPrice: number }[],
    purchasedBy: string,
    marketName: string,
    date: string,
    note?: string
  ) => Promise<void>;

  recordSettlement: (data: {
    fromMemberId: string;
    toMemberId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    settlementDate: string;
    note?: string;
  }) => Promise<void>;

  toggleDutyStatus: (dutyId: string, markMissed?: boolean) => Promise<void>;
  requestDutySwap: (dutyId: string, targetMemberId: string, reason: string) => Promise<void>;
  respondDutySwap: (swapId: string, approve: boolean) => Promise<void>;
  createAutoDutyRotation: (startDate: string, days: number, includeBazar: boolean, includeCooking: boolean, includeCleaning: boolean) => Promise<void>;
  addManualDuty: (data: { memberId: string; dutyType: DutyType; date: string; mealType?: MealType; customDutyName?: string; note?: string }) => Promise<void>;

  addShoppingItem: (data: { itemName: string; quantity: number; unit: string; priority: ShoppingPriority; estimatedCost?: number; note?: string }) => Promise<void>;
  toggleShoppingItem: (id: string) => Promise<void>;
  deleteShoppingItem: (id: string) => Promise<void>;

  saveMealPlan: (date: string, breakfast: string, lunch: string, dinner: string, note?: string) => Promise<void>;

  closeMonth: (notes?: string) => Promise<void>;
  reopenMonth: () => Promise<void>;

  addMember: (data: { name: string; nameBn?: string; email: string; phone: string; role: Role; roomNumber?: string }) => Promise<void>;
  toggleMemberStatus: (memberId: string) => Promise<void>;
  updateMemberRole: (memberId: string, role: Role) => Promise<void>;

  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  resetDemoData: () => void;
  clearAllDatabaseData: () => Promise<void>;

  // Real Database & Authentication
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  loginWithCredentials: (email: string, password?: string) => Promise<void>;
  registerUser: (data: {
    name: string;
    nameBn?: string;
    email: string;
    password: string;
    phone?: string;
    roomNumber?: string;
    role?: Role;
  }) => Promise<void>;
  logout: () => void;
  dbStatus: 'connected' | 'checking' | 'fallback';
  reloadDatabaseData: () => Promise<void>;
}

const MessContext = createContext<MessContextType | undefined>(undefined);

const DEFAULT_GUEST: User = {
  id: 'guest',
  name: 'New Member',
  email: '',
  phone: '',
  role: 'ADMIN',
  status: 'ACTIVE',
  joinDate: new Date().toISOString().split('T')[0],
  messId: 'mess-dhaka-01',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const MessProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(getInitialState);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!getStoredToken());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [dbStatus, setDbStatus] = useState<'connected' | 'checking' | 'fallback'>('checking');

  // Dynamically load from PostgreSQL backend
  const reloadDatabaseData = async () => {
    try {
      setDbStatus('checking');
      const data = await apiRequest('/api/bootstrap');
      if (data) {
        setState((prev) => ({
          ...prev,
          mess: data.mess || prev.mess,
          members: data.members || [],
          monthlyAccounts: data.monthlyAccounts && data.monthlyAccounts.length > 0 ? data.monthlyAccounts : prev.monthlyAccounts,
          categories: data.categories && data.categories.length > 0 ? data.categories : prev.categories,
          contributions: data.contributions || [],
          expenses: data.expenses || [],
          bazarRecords: data.bazarRecords || [],
          settlements: data.settlements || [],
          dutySchedules: data.dutySchedules || [],
          dutySwaps: data.dutySwaps || [],
          mealPlans: data.mealPlans || [],
          shoppingList: data.shoppingList || [],
          auditLogs: data.auditLogs || [],
          notifications: data.notifications || [],
          currentUserId: prev.currentUserId || (data.members?.[0]?.id ?? '')
        }));
        setDbStatus('connected');
      }
    } catch (err) {
      console.warn('Backend API initializing or offline:', err);
      setDbStatus('fallback');
    }
  };

  useEffect(() => {
    const initAuthAndData = async () => {
      const token = getStoredToken();
      if (token) {
        try {
          const authData = await apiRequest('/api/auth/me');
          if (authData && authData.user) {
            setIsAuthenticated(true);
            setState((prev) => ({ ...prev, currentUserId: authData.user.id }));
          }
        } catch (e) {
          clearStoredToken();
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
      await reloadDatabaseData();
    };

    initAuthAndData();
  }, []);

  // Sync state to LocalStorage
  useEffect(() => {
    saveState(state);
  }, [state]);

  const currentUser = useMemo(() => {
    return (
      state.members.find((m) => m.id === state.currentUserId) ||
      state.members[0] ||
      DEFAULT_GUEST
    );
  }, [state.members, state.currentUserId]);

  const currentRole = currentUser.role || 'ADMIN';

  const membersMap = useMemo(() => {
    const map = new Map<string, User>();
    state.members.forEach((m) => map.set(m.id, m));
    return map;
  }, [state.members]);

  const categoriesMap = useMemo(() => {
    const map = new Map<string, ExpenseCategory>();
    state.categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [state.categories]);

  const activeMembers = useMemo(() => {
    return state.members.filter((m) => m.status === 'ACTIVE');
  }, [state.members]);

  const currentMonthAccount = useMemo(() => {
    return state.monthlyAccounts.find((m) => m.monthYear === state.selectedMonth) || {
      id: `month-${state.selectedMonth}`,
      messId: state.activeMessId,
      monthYear: state.selectedMonth,
      name: `Month ${state.selectedMonth}`,
      openingBalance: 0,
      totalDeposits: 0,
      totalExpenses: 0,
      totalSettlements: 0,
      totalReceivables: 0,
      totalPayables: 0,
      closingBalance: 0,
      status: 'OPEN' as const
    };
  }, [state.monthlyAccounts, state.selectedMonth, state.activeMessId]);

  const isMonthClosed = currentMonthAccount.status === 'CLOSED';

  // Real-time financial overview
  const financialOverview = useMemo(() => {
    return getMonthlyFinancialOverview(
      state.selectedMonth,
      currentMonthAccount.name || state.selectedMonth,
      currentMonthAccount.status,
      currentMonthAccount.openingBalance,
      state.members,
      state.contributions,
      state.expenses,
      state.settlements,
      state.categories
    );
  }, [
    state.selectedMonth,
    currentMonthAccount,
    state.members,
    state.contributions,
    state.expenses,
    state.settlements,
    state.categories
  ]);

  // Current real-time cash balance for the mess fund
  const cashBalance = useMemo(() => {
    return calculateCashBalance(
      currentMonthAccount.openingBalance,
      state.contributions,
      state.expenses,
      state.selectedMonth
    );
  }, [currentMonthAccount.openingBalance, state.contributions, state.expenses, state.selectedMonth]);

  // Duty statistics
  const dutyStats = useMemo(() => {
    return calculateDutyStats(state.members, state.dutySchedules);
  }, [state.members, state.dutySchedules]);

  // Helper to add audit log
  const logAudit = (
    action: string,
    entity: string,
    entityId: string,
    details: string,
    newValue?: string,
    oldValue?: string
  ) => {
    const newLog: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: currentUser.id,
      userName: currentUser.name,
      action,
      entity,
      entityId,
      oldValue,
      newValue,
      details,
      timestamp: new Date().toISOString()
    };
    return newLog;
  };

  const createNotification = (
    userId: string,
    title: string,
    message: string,
    type: AppNotification['type']
  ) => {
    const notif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId,
      title,
      message,
      type,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    return notif;
  };

  // 1. Add Contribution
  const addContribution = async (data: {
    memberId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    transactionDate: string;
    note?: string;
    receiptUrl?: string;
  }) => {
    if (isMonthClosed) {
      alert('This month is closed. Please ask Admin to reopen before making changes.');
      return;
    }

    const member = membersMap.get(data.memberId);
    const newId = `contrib-${Date.now()}`;
    const newContribution: Contribution = {
      id: newId,
      messId: state.activeMessId,
      memberId: data.memberId,
      amount: Number(data.amount),
      paymentMethod: data.paymentMethod,
      transactionDate: data.transactionDate,
      note: data.note,
      receiptUrl: data.receiptUrl,
      recordedBy: currentUser.id,
      createdAt: new Date().toISOString()
    };

    const audit = logAudit(
      'RECORD_DEPOSIT',
      'Contribution',
      newId,
      `Recorded deposit of ৳${data.amount} for ${member?.name} via ${data.paymentMethod}`,
      `৳${data.amount}`
    );

    const notif = createNotification(
      data.memberId,
      'Deposit Confirmed',
      `৳${data.amount} deposit via ${data.paymentMethod} was successfully recorded.`,
      'DEPOSIT'
    );

    // Update UI immediately
    setState((prev) => ({
      ...prev,
      contributions: [newContribution, ...prev.contributions],
      auditLogs: [audit, ...prev.auditLogs],
      notifications: [notif, ...prev.notifications]
    }));

    // Persist to Neon PostgreSQL
    try {
      await apiRequest('/api/contributions', {
        method: 'POST',
        body: JSON.stringify({
          memberId: data.memberId,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          transactionDate: data.transactionDate,
          note: data.note,
          receiptUrl: data.receiptUrl,
          recordedBy: currentUser.id
        })
      });
    } catch (err) {
      console.warn('API sync warning:', err);
    }
  };

  // 2. Add Expense
  const addExpense = async (data: {
    categoryId: string;
    categoryCode: ExpenseCategoryCode;
    amount: number;
    description: string;
    expenseDate: string;
    paidBy: string;
    paymentMethod: PaymentMethod;
    note?: string;
    receiptUrl?: string;
    bazarId?: string;
  }) => {
    if (isMonthClosed) {
      alert('This month is closed. Please ask Admin to reopen before making changes.');
      return;
    }

    const newId = `exp-${Date.now()}`;
    const newExpense: Expense = {
      id: newId,
      messId: state.activeMessId,
      categoryId: data.categoryId,
      categoryCode: data.categoryCode,
      amount: Number(data.amount),
      description: data.description,
      expenseDate: data.expenseDate,
      paidBy: data.paidBy,
      paymentMethod: data.paymentMethod,
      receiptUrl: data.receiptUrl,
      note: data.note,
      bazarId: data.bazarId,
      recordedBy: currentUser.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const audit = logAudit(
      'CREATE_EXPENSE',
      'Expense',
      newId,
      `Created ${data.categoryCode} expense: "${data.description}" for ৳${data.amount}`,
      `৳${data.amount}`
    );

    const notif = createNotification(
      'ALL',
      'New Expense Logged',
      `${currentUser.name} recorded an expense of ৳${data.amount} (${data.description}).`,
      'EXPENSE'
    );

    setState((prev) => ({
      ...prev,
      expenses: [newExpense, ...prev.expenses],
      auditLogs: [audit, ...prev.auditLogs],
      notifications: [notif, ...prev.notifications]
    }));

    try {
      await apiRequest('/api/expenses', {
        method: 'POST',
        body: JSON.stringify({
          categoryId: data.categoryId,
          categoryCode: data.categoryCode,
          amount: data.amount,
          description: data.description,
          expenseDate: data.expenseDate,
          paidBy: data.paidBy,
          paymentMethod: data.paymentMethod,
          note: data.note,
          receiptUrl: data.receiptUrl,
          bazarId: data.bazarId,
          recordedBy: currentUser.id
        })
      });
    } catch (err) {
      console.warn('API sync warning:', err);
    }
  };

  // 3. Add Bazar Record
  const addBazarRecord = async (data: {
    purchasedBy: string;
    marketName: string;
    date: string;
    note?: string;
    receiptUrl?: string;
    items: Omit<BazarItem, 'id' | 'bazarId'>[];
  }) => {
    if (isMonthClosed) {
      alert('This month is closed. Please ask Admin to reopen before making changes.');
      return;
    }

    const bazarId = `bazar-${Date.now()}`;
    const expenseId = `exp-${Date.now()}`;

    const itemsWithIds: BazarItem[] = data.items.map((item, idx) => ({
      ...item,
      id: `bitem-${Date.now()}-${idx}`,
      bazarId,
      totalPrice: roundMoney(Number(item.quantity) * Number(item.unitPrice))
    }));

    const totalAmount = roundMoney(
      itemsWithIds.reduce((sum, item) => sum + item.totalPrice, 0)
    );

    const newBazarRecord: BazarRecord = {
      id: bazarId,
      messId: state.activeMessId,
      date: data.date,
      purchasedBy: data.purchasedBy,
      marketName: data.marketName,
      totalAmount,
      note: data.note,
      receiptUrl: data.receiptUrl,
      items: itemsWithIds,
      expenseId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const bazarCat = state.categories.find((c) => c.code === 'BAZAR') || state.categories[0];
    const purchaser = membersMap.get(data.purchasedBy);

    const newExpense: Expense = {
      id: expenseId,
      messId: state.activeMessId,
      categoryId: bazarCat.id,
      categoryCode: 'BAZAR',
      amount: totalAmount,
      description: `Bazar from ${data.marketName} (${itemsWithIds.length} items)`,
      expenseDate: data.date,
      paidBy: data.purchasedBy,
      paymentMethod: 'CASH',
      receiptUrl: data.receiptUrl,
      note: data.note,
      bazarId,
      recordedBy: currentUser.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const audit = logAudit(
      'CREATE_BAZAR',
      'BazarRecord',
      bazarId,
      `Recorded Bazar for ৳${totalAmount} by ${purchaser?.name} (${itemsWithIds.length} items)`,
      `৳${totalAmount}`
    );

    const notif = createNotification(
      'ALL',
      'Bazar Recorded',
      `${purchaser?.name || 'Member'} completed bazar for ৳${totalAmount} at ${data.marketName}.`,
      'EXPENSE'
    );

    setState((prev) => ({
      ...prev,
      bazarRecords: [newBazarRecord, ...prev.bazarRecords],
      expenses: [newExpense, ...prev.expenses],
      auditLogs: [audit, ...prev.auditLogs],
      notifications: [notif, ...prev.notifications]
    }));

    try {
      await apiRequest('/api/bazar', {
        method: 'POST',
        body: JSON.stringify({
          purchasedBy: data.purchasedBy,
          marketName: data.marketName,
          date: data.date,
          totalAmount,
          note: data.note,
          receiptUrl: data.receiptUrl,
          items: itemsWithIds,
          recordedBy: currentUser.id
        })
      });
    } catch (err) {
      console.warn('API sync warning:', err);
    }
  };

  // 4. Convert Shopping List to Bazar
  const convertShoppingToBazar = async (
    items: { itemName: string; quantity: number; unit: string; unitPrice: number }[],
    purchasedBy: string,
    marketName: string,
    date: string,
    note?: string
  ) => {
    await addBazarRecord({
      purchasedBy,
      marketName,
      date,
      note: note ? `Converted from Shopping List. ${note}` : 'Converted from Shopping List',
      items: items.map((item) => ({
        itemName: item.itemName,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        totalPrice: roundMoney(item.quantity * item.unitPrice)
      }))
    });

    const itemNames = new Set(items.map((i) => i.itemName.toLowerCase().trim()));
    setState((prev) => ({
      ...prev,
      shoppingList: prev.shoppingList.map((item) =>
        itemNames.has(item.itemName.toLowerCase().trim())
          ? { ...item, status: 'PURCHASED' }
          : item
      )
    }));
  };

  // 5. Record Settlement
  const recordSettlement = async (data: {
    fromMemberId: string;
    toMemberId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    settlementDate: string;
    note?: string;
  }) => {
    if (isMonthClosed) {
      alert('This month is closed. Please ask Admin to reopen before making changes.');
      return;
    }

    const fromMember = membersMap.get(data.fromMemberId);
    const toMember = membersMap.get(data.toMemberId);
    const newId = `settle-${Date.now()}`;

    const newSettlement: Settlement = {
      id: newId,
      messId: state.activeMessId,
      fromMemberId: data.fromMemberId,
      toMemberId: data.toMemberId,
      amount: Number(data.amount),
      paymentMethod: data.paymentMethod,
      settlementDate: data.settlementDate,
      note: data.note,
      status: 'COMPLETED',
      recordedBy: currentUser.id,
      createdAt: new Date().toISOString()
    };

    const audit = logAudit(
      'RECORD_SETTLEMENT',
      'Settlement',
      newId,
      `Completed settlement: ${fromMember?.name} paid ৳${data.amount} to ${toMember?.name} via ${data.paymentMethod}`,
      `৳${data.amount}`
    );

    const notifFrom = createNotification(
      data.fromMemberId,
      'Settlement Recorded',
      `Your settlement payment of ৳${data.amount} to ${toMember?.name} has been completed.`,
      'SETTLEMENT'
    );

    const notifTo = createNotification(
      data.toMemberId,
      'Settlement Received',
      `You received a settlement of ৳${data.amount} from ${fromMember?.name}.`,
      'SETTLEMENT'
    );

    setState((prev) => ({
      ...prev,
      settlements: [newSettlement, ...prev.settlements],
      auditLogs: [audit, ...prev.auditLogs],
      notifications: [notifFrom, notifTo, ...prev.notifications]
    }));

    try {
      await apiRequest('/api/settlements', {
        method: 'POST',
        body: JSON.stringify({
          fromMemberId: data.fromMemberId,
          toMemberId: data.toMemberId,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          settlementDate: data.settlementDate,
          note: data.note,
          recordedBy: currentUser.id
        })
      });
    } catch (err) {
      console.warn('API sync warning:', err);
    }
  };

  // 6. Duties
  const toggleDutyStatus = async (dutyId: string, markMissed: boolean = false) => {
    let newStatus: DutySchedule['status'] = 'ASSIGNED';
    let completedAt: string | undefined = undefined;

    setState((prev) => {
      const duty = prev.dutySchedules.find((d) => d.id === dutyId);
      if (!duty) return prev;

      if (markMissed) {
        newStatus = 'MISSED';
      } else {
        newStatus = duty.status === 'COMPLETED' ? 'ASSIGNED' : 'COMPLETED';
        completedAt = newStatus === 'COMPLETED' ? new Date().toISOString() : undefined;
      }

      return {
        ...prev,
        dutySchedules: prev.dutySchedules.map((d) =>
          d.id === dutyId ? { ...d, status: newStatus, completedAt, updatedAt: new Date().toISOString() } : d
        )
      };
    });

    try {
      await apiRequest(`/api/duties/${dutyId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) {
      console.warn('API sync warning:', err);
    }
  };

  const requestDutySwap = async (dutyId: string, targetMemberId: string, reason: string) => {
    const swapId = `swap-${Date.now()}`;
    const newSwap: DutySwapRequest = {
      id: swapId,
      messId: state.activeMessId,
      dutyId,
      requesterMemberId: currentUser.id,
      targetMemberId,
      reason,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    setState((prev) => ({
      ...prev,
      dutySwaps: [newSwap, ...prev.dutySwaps]
    }));
  };

  const respondDutySwap = async (swapId: string, approve: boolean) => {
    setState((prev) => {
      const swap = prev.dutySwaps.find((s) => s.id === swapId);
      if (!swap) return prev;

      const newStatus = approve ? 'APPROVED' : 'REJECTED';

      return {
        ...prev,
        dutySwaps: prev.dutySwaps.map((s) =>
          s.id === swapId ? { ...s, status: newStatus, reviewedBy: currentUser.id, reviewedAt: new Date().toISOString() } : s
        ),
        dutySchedules: approve
          ? prev.dutySchedules.map((d) =>
              d.id === swap.dutyId ? { ...d, memberId: swap.targetMemberId } : d
            )
          : prev.dutySchedules
      };
    });
  };

  const createAutoDutyRotation = async (
    startDate: string,
    days: number,
    includeBazar: boolean,
    includeCooking: boolean,
    includeCleaning: boolean
  ) => {
    const generated = generateDutyRotation(
      startDate,
      days,
      activeMembers,
      state.activeMessId,
      currentUser.id,
      includeBazar,
      includeCooking,
      includeCleaning
    );

    setState((prev) => ({
      ...prev,
      dutySchedules: [...generated, ...prev.dutySchedules]
    }));

    for (const d of generated) {
      try {
        await apiRequest('/api/duties', {
          method: 'POST',
          body: JSON.stringify({
            memberId: d.memberId,
            dutyType: d.dutyType,
            mealType: d.mealType,
            date: d.date,
            note: d.note,
            assignedBy: currentUser.id
          })
        });
      } catch (err) {
        console.warn('API sync duty error:', err);
      }
    }
  };

  const addManualDuty = async (data: {
    memberId: string;
    dutyType: DutyType;
    date: string;
    mealType?: MealType;
    customDutyName?: string;
    note?: string;
  }) => {
    const newId = `duty-${Date.now()}`;
    const newDuty: DutySchedule = {
      id: newId,
      messId: state.activeMessId,
      memberId: data.memberId,
      dutyType: data.dutyType,
      date: data.date,
      mealType: data.mealType,
      customDutyName: data.customDutyName,
      status: 'ASSIGNED',
      note: data.note,
      assignedBy: currentUser.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setState((prev) => ({
      ...prev,
      dutySchedules: [newDuty, ...prev.dutySchedules]
    }));

    try {
      await apiRequest('/api/duties', {
        method: 'POST',
        body: JSON.stringify({
          memberId: data.memberId,
          dutyType: data.dutyType,
          customDutyName: data.customDutyName,
          mealType: data.mealType,
          date: data.date,
          note: data.note,
          assignedBy: currentUser.id
        })
      });
    } catch (err) {
      console.warn('API sync warning:', err);
    }
  };

  // 7. Shopping List
  const addShoppingItem = async (data: {
    itemName: string;
    quantity: number;
    unit: string;
    priority: ShoppingPriority;
    estimatedCost?: number;
    note?: string;
  }) => {
    const newItem: ShoppingListItem = {
      id: `shop-${Date.now()}`,
      messId: state.activeMessId,
      itemName: data.itemName,
      quantity: Number(data.quantity),
      unit: data.unit,
      priority: data.priority,
      status: 'PENDING',
      estimatedCost: data.estimatedCost ? Number(data.estimatedCost) : undefined,
      addedBy: currentUser.id,
      note: data.note,
      createdAt: new Date().toISOString()
    };

    setState((prev) => ({
      ...prev,
      shoppingList: [newItem, ...prev.shoppingList]
    }));

    try {
      await apiRequest('/api/shopping', {
        method: 'POST',
        body: JSON.stringify({
          itemName: data.itemName,
          quantity: data.quantity,
          unit: data.unit,
          priority: data.priority,
          estimatedCost: data.estimatedCost,
          note: data.note,
          addedBy: currentUser.id
        })
      });
    } catch (err) {
      console.warn('API sync warning:', err);
    }
  };

  const toggleShoppingItem = async (id: string) => {
    setState((prev) => ({
      ...prev,
      shoppingList: prev.shoppingList.map((item) =>
        item.id === id
          ? { ...item, status: item.status === 'PURCHASED' ? 'PENDING' : 'PURCHASED' }
          : item
      )
    }));

    try {
      await apiRequest(`/api/shopping/${id}/toggle`, { method: 'PATCH' });
    } catch (err) {
      console.warn('API sync warning:', err);
    }
  };

  const deleteShoppingItem = async (id: string) => {
    setState((prev) => ({
      ...prev,
      shoppingList: prev.shoppingList.filter((item) => item.id !== id)
    }));

    try {
      await apiRequest(`/api/shopping/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('API sync warning:', err);
    }
  };

  // 8. Meal Plan
  const saveMealPlan = async (
    date: string,
    breakfast: string,
    lunch: string,
    dinner: string,
    note?: string
  ) => {
    setState((prev) => {
      const existing = prev.mealPlans.find((m) => m.date === date);
      const updatedList = existing
        ? prev.mealPlans.map((m) =>
            m.date === date
              ? { ...m, breakfast, lunch, dinner, note, updatedAt: new Date().toISOString() }
              : m
          )
        : [
            {
              id: `meal-${date}`,
              messId: prev.activeMessId,
              date,
              breakfast,
              lunch,
              dinner,
              note,
              createdBy: currentUser.id,
              updatedAt: new Date().toISOString()
            },
            ...prev.mealPlans
          ];

      return {
        ...prev,
        mealPlans: updatedList
      };
    });

    try {
      await apiRequest('/api/meals', {
        method: 'POST',
        body: JSON.stringify({
          date,
          breakfast,
          lunch,
          dinner,
          note,
          createdBy: currentUser.id
        })
      });
    } catch (err) {
      console.warn('API sync warning:', err);
    }
  };

  // 9. Monthly Accounting
  const closeMonth = async (notes?: string) => {
    const overview = financialOverview;
    setState((prev) => ({
      ...prev,
      monthlyAccounts: prev.monthlyAccounts.map((acc) =>
        acc.monthYear === prev.selectedMonth
          ? {
              ...acc,
              status: 'CLOSED' as const,
              closedAt: new Date().toISOString(),
              closedBy: currentUser.id,
              totalDeposits: overview.totalDeposits,
              totalExpenses: overview.totalExpenses,
              totalReceivables: overview.totalReceivables,
              totalPayables: overview.totalPayables,
              closingBalance: overview.cashBalance,
              notes: notes || acc.notes
            }
          : acc
      )
    }));

    try {
      await apiRequest('/api/monthly-accounts/close', {
        method: 'POST',
        body: JSON.stringify({
          monthYear: state.selectedMonth,
          closingBalance: overview.cashBalance,
          closedBy: currentUser.id,
          notes
        })
      });
    } catch (err) {
      console.warn('API sync warning:', err);
    }
  };

  const reopenMonth = async () => {
    setState((prev) => ({
      ...prev,
      monthlyAccounts: prev.monthlyAccounts.map((acc) =>
        acc.monthYear === prev.selectedMonth
          ? { ...acc, status: 'OPEN' as const, closedAt: undefined, closedBy: undefined }
          : acc
      )
    }));

    try {
      await apiRequest('/api/monthly-accounts/reopen', {
        method: 'POST',
        body: JSON.stringify({ monthYear: state.selectedMonth })
      });
    } catch (err) {
      console.warn('API sync warning:', err);
    }
  };

  // 10. Members
  const addMember = async (data: {
    name: string;
    nameBn?: string;
    email: string;
    phone: string;
    role: Role;
    roomNumber?: string;
  }) => {
    const newId = `user-${Date.now()}`;
    const newMember: User = {
      id: newId,
      name: data.name,
      nameBn: data.nameBn,
      email: data.email,
      phone: data.phone,
      role: data.role,
      status: 'ACTIVE',
      roomNumber: data.roomNumber,
      joinDate: new Date().toISOString().split('T')[0],
      messId: state.activeMessId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setState((prev) => ({
      ...prev,
      members: [...prev.members, newMember]
    }));

    try {
      const res = await apiRequest('/api/members', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      if (res && res.member) {
        setState((prev) => ({
          ...prev,
          members: prev.members.map((m) => (m.id === newId ? res.member : m))
        }));
      }
    } catch (err) {
      console.warn('API sync warning:', err);
    }
  };

  const toggleMemberStatus = async (memberId: string) => {
    setState((prev) => ({
      ...prev,
      members: prev.members.map((m) =>
        m.id === memberId
          ? {
              ...m,
              status: m.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
              leaveDate: m.status === 'ACTIVE' ? new Date().toISOString().split('T')[0] : undefined
            }
          : m
      )
    }));

    try {
      await apiRequest(`/api/members/${memberId}/status`, { method: 'PATCH' });
    } catch (err) {
      console.warn('API sync warning:', err);
    }
  };

  const updateMemberRole = async (memberId: string, role: Role) => {
    setState((prev) => ({
      ...prev,
      members: prev.members.map((m) => (m.id === memberId ? { ...m, role } : m))
    }));

    try {
      await apiRequest(`/api/members/${memberId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role })
      });
    } catch (err) {
      console.warn('API sync warning:', err);
    }
  };

  const markNotificationRead = (id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    }));
  };

  const markAllNotificationsRead = () => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, isRead: true }))
    }));
  };

  const resetDemoData = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    setState(getInitialState());
  };

  const clearAllDatabaseData = async () => {
    try {
      await apiRequest('/api/clear-all-data', { method: 'POST' });
      resetDemoData();
      await reloadDatabaseData();
    } catch (err) {
      console.error('Failed to clear database data:', err);
    }
  };

  const loginWithCredentials = async (email: string, password?: string) => {
    try {
      const res = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      if (res && res.token && res.user) {
        setStoredToken(res.token);
        setIsAuthenticated(true);
        setState((prev) => ({ ...prev, currentUserId: res.user.id }));
        await reloadDatabaseData();
      }
    } catch (err: any) {
      const found = state.members.find((m) => m.email.toLowerCase() === email.toLowerCase());
      if (found) {
        setStoredToken(`local-token-${found.id}`);
        setIsAuthenticated(true);
        setState((prev) => ({ ...prev, currentUserId: found.id }));
      } else {
        throw new Error(err.message || 'User not found');
      }
    }
  };

  const registerUser = async (data: {
    name: string;
    nameBn?: string;
    email: string;
    password: string;
    phone?: string;
    roomNumber?: string;
    role?: Role;
  }) => {
    try {
      const res = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      if (res && res.token && res.user) {
        setStoredToken(res.token);
        setIsAuthenticated(true);
        setState((prev) => ({
          ...prev,
          currentUserId: res.user.id,
          members: [...prev.members.filter((m) => m.id !== res.user.id), res.user]
        }));
        await reloadDatabaseData();
      }
    } catch (err: any) {
      throw new Error(err.message || 'Registration failed');
    }
  };

  const logout = () => {
    clearStoredToken();
    setIsAuthenticated(false);
    setState((prev) => ({ ...prev, currentUserId: '' }));
  };

  return (
    <MessContext.Provider
      value={{
        state,
        currentUser,
        currentRole,
        setCurrentUserId: (id) => setState((prev) => ({ ...prev, currentUserId: id })),
        selectedMonth: state.selectedMonth,
        setSelectedMonth: (month) => setState((prev) => ({ ...prev, selectedMonth: month })),
        financialOverview,
        cashBalance,
        membersMap,
        categoriesMap,
        dutyStats,
        activeMembers,
        isMonthClosed,
        addContribution,
        addExpense,
        addBazarRecord,
        convertShoppingToBazar,
        recordSettlement,
        toggleDutyStatus,
        requestDutySwap,
        respondDutySwap,
        createAutoDutyRotation,
        addManualDuty,
        addShoppingItem,
        toggleShoppingItem,
        deleteShoppingItem,
        saveMealPlan,
        closeMonth,
        reopenMonth,
        addMember,
        toggleMemberStatus,
        updateMemberRole,
        markNotificationRead,
        markAllNotificationsRead,
        resetDemoData,
        clearAllDatabaseData,
        isAuthenticated,
        isAuthModalOpen,
        setIsAuthModalOpen,
        loginWithCredentials,
        registerUser,
        logout,
        dbStatus,
        reloadDatabaseData
      }}
    >
      {children}
    </MessContext.Provider>
  );
};

export const useMess = () => {
  const context = useContext(MessContext);
  if (!context) {
    throw new Error('useMess must be used within a MessProvider');
  }
  return context;
};
