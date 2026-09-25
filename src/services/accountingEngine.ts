import {
  Contribution,
  Expense,
  Settlement,
  User,
  MemberFinancialSummary,
  SettlementSuggestion,
  MonthlyFinancialOverview,
  LedgerTransaction,
  MonthStatus,
  ExpenseCategory,
  ExpenseCategoryCode
} from '../types';

/**
 * Ensures financial precision by rounding to 2 decimal places and avoiding JS float quirks.
 */
export function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export function formatTaka(amount: number, showSign: boolean = false): string {
  const rounded = roundMoney(amount);
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  }).format(Math.abs(rounded));

  const sign = rounded > 0 && showSign ? '+' : rounded < 0 ? '-' : '';
  return `${sign}৳${formatted}`;
}

/**
 * Filter items for a specific month (format "YYYY-MM").
 */
export function isInMonth(dateStr: string, monthYear: string): boolean {
  return dateStr.startsWith(monthYear);
}

/**
 * Calculate member financial summaries for a given month.
 * Formula:
 * Balance = Total Contribution - Member Share - Settlement Paid + Settlement Received
 * Positive (>0): Member should receive money (+৳)
 * Negative (<0): Member needs to pay money (-৳)
 * Zero (=0): Settled (৳0)
 */
export function calculateMemberSummaries(
  members: User[],
  contributions: Contribution[],
  expenses: Expense[],
  settlements: Settlement[],
  monthYear: string
): {
  memberSummaries: MemberFinancialSummary[];
  perMemberShare: number;
  totalExpenses: number;
  totalDeposits: number;
  activeMembers: User[];
} {
  // Only non-deleted expenses for this month
  const monthExpenses = expenses.filter(
    (e) => !e.isDeleted && isInMonth(e.expenseDate, monthYear)
  );
  const totalExpenses = roundMoney(
    monthExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)
  );

  // Active members who participate in share
  const activeMembers = members.filter((m) => m.status === 'ACTIVE');
  const activeCount = Math.max(activeMembers.length, 1);
  const perMemberShare = activeMembers.length > 0
    ? roundMoney(totalExpenses / activeCount)
    : 0;

  // Active contributions for this month
  const monthContributions = contributions.filter(
    (c) => !c.isDeleted && isInMonth(c.transactionDate, monthYear)
  );
  const totalDeposits = roundMoney(
    monthContributions.reduce((sum, c) => sum + Number(c.amount || 0), 0)
  );

  // Completed settlements for this month
  const monthSettlements = settlements.filter(
    (s) => s.status === 'COMPLETED' && isInMonth(s.settlementDate, monthYear)
  );

  const summaries: MemberFinancialSummary[] = members.map((member) => {
    const isMemberActive = member.status === 'ACTIVE';

    // Member deposits
    const memberDeposits = monthContributions
      .filter((c) => c.memberId === member.id)
      .reduce((sum, c) => sum + Number(c.amount || 0), 0);

    // Active members bear equal share; inactive members do not participate
    const memberShare = isMemberActive ? perMemberShare : 0;

    // Settlements paid by this member to others
    const settlementsPaid = monthSettlements
      .filter((s) => s.fromMemberId === member.id)
      .reduce((sum, s) => sum + Number(s.amount || 0), 0);

    // Settlements received by this member from others
    const settlementsReceived = monthSettlements
      .filter((s) => s.toMemberId === member.id)
      .reduce((sum, s) => sum + Number(s.amount || 0), 0);

    // Balance formula: Total Contribution - Member Share - Settlement Paid + Settlement Received
    // Note: If member owed 1000 and paid 1000 settlement, their debt is resolved.
    // Let's verify:
    // Rahim: Paid 3000 deposit, Share 4000. Balance initially = 3000 - 4000 = -1000.
    // Rahim pays Ovi 1000 settlement: settlementsPaid = 1000.
    // Rahim's remaining balance to settle = (Total Paid 3000 + 1000) - 4000 = 0!
    // Therefore, effective balance after settlement:
    // Net Due = (Deposit + Settlement Paid) - (Share + Settlement Received)
    // If > 0, member has excess money and should receive it.
    // If < 0, member is still in deficit and needs to pay.
    const netBalance = roundMoney(
      (memberDeposits + settlementsPaid) - (memberShare + settlementsReceived)
    );

    let statusLabel: 'RECEIVES' | 'OWES' | 'SETTLED' = 'SETTLED';
    if (netBalance > 0.01) {
      statusLabel = 'RECEIVES';
    } else if (netBalance < -0.01) {
      statusLabel = 'OWES';
    }

    return {
      memberId: member.id,
      memberName: member.name,
      role: member.role,
      status: member.status,
      totalDeposited: roundMoney(memberDeposits),
      share: roundMoney(memberShare),
      settlementsPaid: roundMoney(settlementsPaid),
      settlementsReceived: roundMoney(settlementsReceived),
      netBalance,
      statusLabel
    };
  });

  return {
    memberSummaries: summaries,
    perMemberShare,
    totalExpenses,
    totalDeposits,
    activeMembers
  };
}

/**
 * Automatic Settlement Engine:
 * Generates the minimum number of direct settlement transactions (Debtor -> Creditor).
 * Guarantees zero unnecessary intermediate steps or circular payment chains.
 */
export function generateSettlementSuggestions(
  memberSummaries: MemberFinancialSummary[]
): SettlementSuggestion[] {
  // Creditors: netBalance > 0.01 (should receive money)
  const creditors = memberSummaries
    .filter((m) => m.netBalance > 0.01)
    .map((m) => ({
      id: m.memberId,
      name: m.memberName,
      remaining: roundMoney(m.netBalance)
    }))
    .sort((a, b) => b.remaining - a.remaining);

  // Debtors: netBalance < -0.01 (needs to pay money)
  const debtors = memberSummaries
    .filter((m) => m.netBalance < -0.01)
    .map((m) => ({
      id: m.memberId,
      name: m.memberName,
      remaining: roundMoney(Math.abs(m.netBalance))
    }))
    .sort((a, b) => b.remaining - a.remaining);

  const suggestions: SettlementSuggestion[] = [];

  let i = 0; // debtor index
  let j = 0; // creditor index

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const amountToTransfer = roundMoney(Math.min(debtor.remaining, creditor.remaining));

    if (amountToTransfer > 0.01) {
      suggestions.push({
        fromMemberId: debtor.id,
        fromMemberName: debtor.name,
        toMemberId: creditor.id,
        toMemberName: creditor.name,
        amount: amountToTransfer
      });

      debtor.remaining = roundMoney(debtor.remaining - amountToTransfer);
      creditor.remaining = roundMoney(creditor.remaining - amountToTransfer);
    }

    if (debtor.remaining <= 0.01) {
      i++;
    }
    if (creditor.remaining <= 0.01) {
      j++;
    }
  }

  return suggestions;
}

/**
 * Rule 15: Mess Cash Balance
 * Cash Balance = Opening Balance + Contributions - Expenses + Other Income - Refunds
 * Personal member-to-member settlements DO NOT affect mess cash!
 */
export function calculateCashBalance(
  openingBalance: number,
  contributions: Contribution[],
  expenses: Expense[],
  monthYear?: string
): number {
  const filteredContributions = monthYear
    ? contributions.filter((c) => !c.isDeleted && isInMonth(c.transactionDate, monthYear))
    : contributions.filter((c) => !c.isDeleted);

  const filteredExpenses = monthYear
    ? expenses.filter((e) => !e.isDeleted && isInMonth(e.expenseDate, monthYear))
    : expenses.filter((e) => !e.isDeleted);

  const totalDeposits = filteredContributions.reduce(
    (sum, c) => sum + Number(c.amount || 0),
    0
  );
  const totalExpenses = filteredExpenses.reduce(
    (sum, e) => sum + Number(e.amount || 0),
    0
  );

  return roundMoney(Number(openingBalance || 0) + totalDeposits - totalExpenses);
}

/**
 * Builds the complete unified chronological ledger.
 */
export function buildLedger(
  messId: string,
  openingBalance: number,
  contributions: Contribution[],
  expenses: Expense[],
  settlements: Settlement[],
  membersMap: Map<string, User>,
  categoriesMap: Map<string, ExpenseCategory>
): LedgerTransaction[] {
  const entries: LedgerTransaction[] = [];

  // Add contributions
  contributions
    .filter((c) => !c.isDeleted)
    .forEach((c) => {
      const member = membersMap.get(c.memberId);
      entries.push({
        id: `ledger-contrib-${c.id}`,
        messId,
        date: c.transactionDate,
        type: 'CONTRIBUTION',
        title: `${member?.name || 'Member'} deposited`,
        description: `Deposit via ${c.paymentMethod}${c.note ? ` · ${c.note}` : ''}`,
        amount: Number(c.amount),
        memberId: c.memberId,
        memberName: member?.name || 'Unknown',
        paymentMethod: c.paymentMethod,
        impactOnCash: Number(c.amount), // Increases mess cash
        referenceId: c.id,
        receiptUrl: c.receiptUrl,
        recordedBy: c.recordedBy
      });
    });

  // Add expenses
  expenses
    .filter((e) => !e.isDeleted)
    .forEach((e) => {
      const category = categoriesMap.get(e.categoryId);
      const paidByMember = membersMap.get(e.paidBy);
      entries.push({
        id: `ledger-exp-${e.id}`,
        messId,
        date: e.expenseDate,
        type: 'EXPENSE',
        title: e.description,
        description: `Category: ${category?.name || e.categoryCode}${e.note ? ` · ${e.note}` : ''}`,
        amount: Number(e.amount),
        memberId: e.paidBy !== 'CASHIER' && e.paidBy !== 'MESS_FUND' ? e.paidBy : undefined,
        memberName: paidByMember ? paidByMember.name : 'Mess Fund',
        category: category?.name || e.categoryCode,
        paymentMethod: e.paymentMethod,
        impactOnCash: -Number(e.amount), // Decreases mess cash
        referenceId: e.id,
        receiptUrl: e.receiptUrl,
        recordedBy: e.recordedBy
      });
    });

  // Add settlements (impact on mess cash is ZERO because it's member-to-member)
  settlements
    .filter((s) => s.status === 'COMPLETED')
    .forEach((s) => {
      const fromMember = membersMap.get(s.fromMemberId);
      const toMember = membersMap.get(s.toMemberId);
      entries.push({
        id: `ledger-settle-${s.id}`,
        messId,
        date: s.settlementDate,
        type: 'SETTLEMENT',
        title: `${fromMember?.name || 'Member'} → ${toMember?.name || 'Member'} settlement`,
        description: `Personal settlement via ${s.paymentMethod}${s.note ? ` · ${s.note}` : ''}`,
        amount: Number(s.amount),
        memberId: s.fromMemberId,
        memberName: `${fromMember?.name} to ${toMember?.name}`,
        paymentMethod: s.paymentMethod,
        impactOnCash: 0, // No impact on mess cash fund
        referenceId: s.id,
        recordedBy: s.recordedBy
      });
    });

  // Sort chronological ascending to calculate running cash balance
  entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let running = Number(openingBalance || 0);
  entries.forEach((item) => {
    running = roundMoney(running + item.impactOnCash);
    item.runningBalance = running;
  });

  // Return reverse chronological (newest first) for UI display
  return entries.reverse();
}

/**
 * Builds comprehensive monthly financial overview.
 */
export function getMonthlyFinancialOverview(
  monthYear: string,
  monthName: string,
  status: MonthStatus,
  openingBalance: number,
  members: User[],
  contributions: Contribution[],
  expenses: Expense[],
  settlements: Settlement[],
  categories: ExpenseCategory[]
): MonthlyFinancialOverview {
  const {
    memberSummaries,
    perMemberShare,
    totalExpenses,
    totalDeposits,
    activeMembers
  } = calculateMemberSummaries(members, contributions, expenses, settlements, monthYear);

  const cashBalance = calculateCashBalance(openingBalance, contributions, expenses, monthYear);
  const settlementSuggestions = generateSettlementSuggestions(memberSummaries);

  // Total receivables (money to collect from debtors)
  const totalPayables = roundMoney(
    memberSummaries
      .filter((m) => m.netBalance < -0.01)
      .reduce((sum, m) => sum + Math.abs(m.netBalance), 0)
  );

  // Total payables (money to distribute to creditors)
  const totalReceivables = roundMoney(
    memberSummaries
      .filter((m) => m.netBalance > 0.01)
      .reduce((sum, m) => sum + m.netBalance, 0)
  );

  // Category breakdown
  const monthExpenses = expenses.filter(
    (e) => !e.isDeleted && isInMonth(e.expenseDate, monthYear)
  );

  const categoryTotals: Record<string, { code: ExpenseCategoryCode; name: string; amount: number }> = {};
  categories.forEach((cat) => {
    categoryTotals[cat.id] = { code: cat.code, name: cat.name, amount: 0 };
  });

  monthExpenses.forEach((exp) => {
    if (!categoryTotals[exp.categoryId]) {
      categoryTotals[exp.categoryId] = {
        code: exp.categoryCode,
        name: exp.categoryCode,
        amount: 0
      };
    }
    categoryTotals[exp.categoryId].amount += Number(exp.amount || 0);
  });

  const categoryBreakdown = Object.values(categoryTotals)
    .filter((c) => c.amount > 0)
    .map((c) => ({
      category: c.name,
      code: c.code,
      amount: roundMoney(c.amount),
      percentage: totalExpenses > 0 ? roundMoney((c.amount / totalExpenses) * 100) : 0
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    monthYear,
    monthName,
    status,
    openingBalance,
    totalDeposits,
    totalExpenses,
    cashBalance,
    perMemberShare,
    activeMemberCount: activeMembers.length,
    totalReceivables,
    totalPayables,
    categoryBreakdown,
    memberSummaries,
    settlementSuggestions
  };
}
