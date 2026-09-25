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
  }) => void;

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
  }) => void;

  addBazarRecord: (data: {
    purchasedBy: string;
    marketName: string;
    date: string;
    note?: string;
    receiptUrl?: string;
    items: Omit<BazarItem, 'id' | 'bazarId'>[];
  }) => void;

  convertShoppingToBazar: (
    items: { itemName: string; quantity: number; unit: string; unitPrice: number }[],
    purchasedBy: string,
    marketName: string,
    date: string,
    note?: string
  ) => void;

  recordSettlement: (data: {
    fromMemberId: string;
    toMemberId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    settlementDate: string;
    note?: string;
  }) => void;

  toggleDutyStatus: (dutyId: string, markMissed?: boolean) => void;
  requestDutySwap: (dutyId: string, targetMemberId: string, reason: string) => void;
  respondDutySwap: (swapId: string, approve: boolean) => void;
  createAutoDutyRotation: (startDate: string, days: number, includeBazar: boolean, includeCooking: boolean, includeCleaning: boolean) => void;
  addManualDuty: (data: { memberId: string; dutyType: DutyType; date: string; mealType?: MealType; customDutyName?: string; note?: string }) => void;

  addShoppingItem: (data: { itemName: string; quantity: number; unit: string; priority: ShoppingPriority; estimatedCost?: number; note?: string }) => void;
  toggleShoppingItem: (id: string) => void;
  deleteShoppingItem: (id: string) => void;

  saveMealPlan: (date: string, breakfast: string, lunch: string, dinner: string, note?: string) => void;

  closeMonth: (notes?: string) => void;
  reopenMonth: () => void;

  addMember: (data: { name: string; nameBn?: string; email: string; phone: string; role: Role; roomNumber?: string }) => void;
  toggleMemberStatus: (memberId: string) => void;
  updateMemberRole: (memberId: string, role: Role) => void;

  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  resetDemoData: () => void;
}

const MessContext = createContext<MessContextType | undefined>(undefined);

export const MessProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(getInitialState);

  // Sync state to LocalStorage
  useEffect(() => {
    saveState(state);
  }, [state]);

  const currentUser = useMemo(() => {
    return state.members.find((m) => m.id === state.currentUserId) || state.members[0];
  }, [state.members, state.currentUserId]);

  const currentRole = currentUser.role;

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

  // Helper to add notification
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
  const addContribution = (data: {
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
      `৳${data.amount} deposit via ${data.paymentMethod} was successfully recorded to the mess fund.`,
      'DEPOSIT'
    );

    setState((prev) => ({
      ...prev,
      contributions: [newContribution, ...prev.contributions],
      auditLogs: [audit, ...prev.auditLogs],
      notifications: [notif, ...prev.notifications]
    }));
  };

  // 2. Add Expense
  const addExpense = (data: {
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
  };

  // 3. Add Bazar Record with line items
  const addBazarRecord = (data: {
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

    // Find bazar category
    const bazarCat = state.categories.find((c) => c.code === 'BAZAR') || state.categories[0];

    const purchaser = membersMap.get(data.purchasedBy);

    // Corresponding expense entry in mess funds
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
  };

  // 4. Convert Shopping List directly to Bazar Expense
  const convertShoppingToBazar = (
    items: { itemName: string; quantity: number; unit: string; unitPrice: number }[],
    purchasedBy: string,
    marketName: string,
    date: string,
    note?: string
  ) => {
    addBazarRecord({
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

    // Mark matching items as purchased in shopping list
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
  const recordSettlement = (data: {
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
  };

  // 6. Duty Management
  const toggleDutyStatus = (dutyId: string, markMissed: boolean = false) => {
    setState((prev) => {
      const duty = prev.dutySchedules.find((d) => d.id === dutyId);
      if (!duty) return prev;

      let newStatus: DutySchedule['status'] = 'ASSIGNED';
      let completedAt: string | undefined = undefined;

      if (markMissed) {
        newStatus = 'MISSED';
      } else {
        newStatus = duty.status === 'COMPLETED' ? 'ASSIGNED' : 'COMPLETED';
        completedAt = newStatus === 'COMPLETED' ? new Date().toISOString() : undefined;
      }

      const member = membersMap.get(duty.memberId);
      const audit = logAudit(
        'UPDATE_DUTY_STATUS',
        'DutySchedule',
        dutyId,
        `Marked ${duty.dutyType} duty for ${member?.name} on ${duty.date} as ${newStatus}`,
        newStatus,
        duty.status
      );

      const notif = createNotification(
        duty.memberId,
        'Duty Status Updated',
        `Your ${duty.dutyType} duty for ${duty.date} is marked as ${newStatus}.`,
        'DUTY'
      );

      return {
        ...prev,
        dutySchedules: prev.dutySchedules.map((d) =>
          d.id === dutyId ? { ...d, status: newStatus, completedAt, updatedAt: new Date().toISOString() } : d
        ),
        auditLogs: [audit, ...prev.auditLogs],
        notifications: [notif, ...prev.notifications]
      };
    });
  };

  const requestDutySwap = (dutyId: string, targetMemberId: string, reason: string) => {
    const duty = state.dutySchedules.find((d) => d.id === dutyId);
    if (!duty) return;

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

    const targetUser = membersMap.get(targetMemberId);
    const audit = logAudit(
      'REQUEST_DUTY_SWAP',
      'DutySwapRequest',
      swapId,
      `${currentUser.name} requested duty swap with ${targetUser?.name}: "${reason}"`
    );

    const notif = createNotification(
      targetMemberId,
      'Duty Swap Request',
      `${currentUser.name} wants to swap their ${duty.dutyType} duty on ${duty.date}. Reason: ${reason}`,
      'DUTY'
    );

    setState((prev) => ({
      ...prev,
      dutySwaps: [newSwap, ...prev.dutySwaps],
      auditLogs: [audit, ...prev.auditLogs],
      notifications: [notif, ...prev.notifications]
    }));
  };

  const respondDutySwap = (swapId: string, approve: boolean) => {
    setState((prev) => {
      const swap = prev.dutySwaps.find((s) => s.id === swapId);
      if (!swap) return prev;

      const duty = prev.dutySchedules.find((d) => d.id === swap.dutyId);
      if (!duty) return prev;

      const requester = membersMap.get(swap.requesterMemberId);
      const target = membersMap.get(swap.targetMemberId);

      const newStatus = approve ? 'APPROVED' : 'REJECTED';

      const audit = logAudit(
        'RESPOND_DUTY_SWAP',
        'DutySwapRequest',
        swapId,
        `Duty swap was ${newStatus.toLowerCase()} between ${requester?.name} and ${target?.name}`
      );

      const notif = createNotification(
        swap.requesterMemberId,
        `Duty Swap ${approve ? 'Approved' : 'Declined'}`,
        `${target?.name || 'Member'} ${approve ? 'accepted' : 'declined'} your swap request for ${duty.date}.`,
        'DUTY'
      );

      return {
        ...prev,
        dutySwaps: prev.dutySwaps.map((s) =>
          s.id === swapId
            ? { ...s, status: newStatus, reviewedBy: currentUser.id, reviewedAt: new Date().toISOString() }
            : s
        ),
        // If approved, reassign the duty to target member!
        dutySchedules: approve
          ? prev.dutySchedules.map((d) =>
              d.id === swap.dutyId ? { ...d, memberId: swap.targetMemberId, note: `Swapped from ${requester?.name}. ${d.note || ''}` } : d
            )
          : prev.dutySchedules,
        auditLogs: [audit, ...prev.auditLogs],
        notifications: [notif, ...prev.notifications]
      };
    });
  };

  const createAutoDutyRotation = (
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

    const audit = logAudit(
      'GENERATE_DUTY_SCHEDULE',
      'DutySchedule',
      `batch-${Date.now()}`,
      `Auto-generated ${generated.length} duty shifts for ${days} days starting ${startDate}`
    );

    const notif = createNotification(
      'ALL',
      'New Duty Schedule Published',
      `Duty rotation schedule for the next ${days} days has been generated.`,
      'DUTY'
    );

    setState((prev) => ({
      ...prev,
      dutySchedules: [...generated, ...prev.dutySchedules],
      auditLogs: [audit, ...prev.auditLogs],
      notifications: [notif, ...prev.notifications]
    }));
  };

  const addManualDuty = (data: {
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

    const member = membersMap.get(data.memberId);
    const audit = logAudit(
      'ASSIGN_DUTY',
      'DutySchedule',
      newId,
      `Assigned ${data.dutyType} duty to ${member?.name} on ${data.date}`
    );

    const notif = createNotification(
      data.memberId,
      'New Duty Assigned',
      `You have been assigned ${data.dutyType} duty on ${data.date}.`,
      'DUTY'
    );

    setState((prev) => ({
      ...prev,
      dutySchedules: [newDuty, ...prev.dutySchedules],
      auditLogs: [audit, ...prev.auditLogs],
      notifications: [notif, ...prev.notifications]
    }));
  };

  // 7. Shopping List
  const addShoppingItem = (data: {
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
  };

  const toggleShoppingItem = (id: string) => {
    setState((prev) => ({
      ...prev,
      shoppingList: prev.shoppingList.map((item) =>
        item.id === id
          ? { ...item, status: item.status === 'PURCHASED' ? 'PENDING' : 'PURCHASED' }
          : item
      )
    }));
  };

  const deleteShoppingItem = (id: string) => {
    setState((prev) => ({
      ...prev,
      shoppingList: prev.shoppingList.filter((item) => item.id !== id)
    }));
  };

  // 8. Meal Plan
  const saveMealPlan = (
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

      const audit = logAudit(
        'UPDATE_MEAL_PLAN',
        'MealPlan',
        date,
        `Updated meal plan for ${date}`
      );

      const notif = createNotification(
        'ALL',
        'Meal Plan Updated',
        `Menu for ${date} has been updated.`,
        'DUTY'
      );

      return {
        ...prev,
        mealPlans: updatedList,
        auditLogs: [audit, ...prev.auditLogs],
        notifications: [notif, ...prev.notifications]
      };
    });
  };

  // 9. Monthly Accounting (Close / Reopen)
  const closeMonth = (notes?: string) => {
    if (currentRole !== 'ADMIN') {
      alert('Only Admin can close monthly accounts.');
      return;
    }

    setState((prev) => {
      const overview = financialOverview;
      const updatedAccounts = prev.monthlyAccounts.map((acc) =>
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
      );

      const audit = logAudit(
        'CLOSE_MONTH',
        'MonthlyAccount',
        prev.selectedMonth,
        `Admin closed accounting period ${prev.selectedMonth}. Closing Balance: ৳${overview.cashBalance}`
      );

      const notif = createNotification(
        'ALL',
        'Month Account Closed',
        `${prev.selectedMonth} accounting has been closed by Admin. Final reports are available.`,
        'MONTHLY_CLOSING'
      );

      return {
        ...prev,
        monthlyAccounts: updatedAccounts,
        auditLogs: [audit, ...prev.auditLogs],
        notifications: [notif, ...prev.notifications]
      };
    });
  };

  const reopenMonth = () => {
    if (currentRole !== 'ADMIN') {
      alert('Only Admin can reopen closed accounts.');
      return;
    }

    setState((prev) => {
      const updatedAccounts = prev.monthlyAccounts.map((acc) =>
        acc.monthYear === prev.selectedMonth
          ? {
              ...acc,
              status: 'OPEN' as const,
              closedAt: undefined,
              closedBy: undefined
            }
          : acc
      );

      const audit = logAudit(
        'REOPEN_MONTH',
        'MonthlyAccount',
        prev.selectedMonth,
        `Admin reopened accounting period ${prev.selectedMonth} for adjustments.`
      );

      return {
        ...prev,
        monthlyAccounts: updatedAccounts,
        auditLogs: [audit, ...prev.auditLogs]
      };
    });
  };

  // 10. Member Management
  const addMember = (data: {
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

    const audit = logAudit(
      'ADD_MEMBER',
      'User',
      newId,
      `Added new member ${data.name} with role ${data.role}`
    );

    setState((prev) => ({
      ...prev,
      members: [...prev.members, newMember],
      auditLogs: [audit, ...prev.auditLogs]
    }));
  };

  const toggleMemberStatus = (memberId: string) => {
    setState((prev) => {
      const member = prev.members.find((m) => m.id === memberId);
      if (!member) return prev;

      const newStatus = member.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const audit = logAudit(
        'UPDATE_MEMBER_STATUS',
        'User',
        memberId,
        `Changed member ${member.name} status to ${newStatus}`,
        newStatus,
        member.status
      );

      return {
        ...prev,
        members: prev.members.map((m) =>
          m.id === memberId
            ? {
                ...m,
                status: newStatus,
                leaveDate: newStatus === 'INACTIVE' ? new Date().toISOString().split('T')[0] : undefined,
                updatedAt: new Date().toISOString()
              }
            : m
        ),
        auditLogs: [audit, ...prev.auditLogs]
      };
    });
  };

  const updateMemberRole = (memberId: string, role: Role) => {
    setState((prev) => {
      const member = prev.members.find((m) => m.id === memberId);
      if (!member) return prev;

      const audit = logAudit(
        'CHANGE_MEMBER_ROLE',
        'User',
        memberId,
        `Updated role for ${member.name} from ${member.role} to ${role}`,
        role,
        member.role
      );

      return {
        ...prev,
        members: prev.members.map((m) =>
          m.id === memberId ? { ...m, role, updatedAt: new Date().toISOString() } : m
        ),
        auditLogs: [audit, ...prev.auditLogs]
      };
    });
  };

  const markNotificationRead = (id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      )
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
        resetDemoData
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
