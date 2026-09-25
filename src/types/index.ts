export type Role = 'ADMIN' | 'CASHIER' | 'MEMBER';

export type MemberStatus = 'ACTIVE' | 'INACTIVE';

export type PaymentMethod = 'CASH' | 'BKASH' | 'NAGAD' | 'BANK' | 'OTHER';

export type ExpenseCategoryCode = 
  | 'BAZAR'
  | 'ELECTRICITY'
  | 'GAS'
  | 'WATER'
  | 'INTERNET'
  | 'HOUSE_RENT'
  | 'CLEANING'
  | 'MAINTENANCE'
  | 'TRANSPORT'
  | 'FOOD'
  | 'OTHER';

export type DutyType = 'BAZAR' | 'COOKING' | 'CLEANING' | 'OTHER';

export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'ALL_DAY';

export type DutyStatus = 'ASSIGNED' | 'COMPLETED' | 'MISSED' | 'CANCELLED';

export type SettlementStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export type MonthStatus = 'OPEN' | 'CLOSED';

export type ShoppingPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export type ShoppingStatus = 'PENDING' | 'PURCHASED' | 'CANCELLED';

export type LedgerTransactionType = 
  | 'CONTRIBUTION'
  | 'EXPENSE'
  | 'SETTLEMENT'
  | 'REFUND'
  | 'ADJUSTMENT';

export interface User {
  id: string;
  name: string;
  nameBn?: string;
  email: string;
  phone: string;
  role: Role;
  status: MemberStatus;
  joinDate: string;
  leaveDate?: string;
  profileImage?: string;
  roomNumber?: string;
  messId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Mess {
  id: string;
  name: string;
  address: string;
  description: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyAccount {
  id: string;
  messId: string;
  monthYear: string; // e.g. "2026-09"
  name: string; // e.g. "September 2026"
  openingBalance: number;
  totalDeposits: number;
  totalExpenses: number;
  totalSettlements: number;
  totalReceivables: number;
  totalPayables: number;
  closingBalance: number;
  status: MonthStatus;
  closedAt?: string;
  closedBy?: string;
  notes?: string;
}

export interface Contribution {
  id: string;
  messId: string;
  memberId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionDate: string;
  note?: string;
  receiptUrl?: string;
  recordedBy: string;
  createdAt: string;
  updatedAt?: string;
  isDeleted?: boolean;
}

export interface ExpenseCategory {
  id: string;
  messId: string;
  code: ExpenseCategoryCode;
  name: string;
  nameBn?: string;
  isCustom?: boolean;
  icon?: string;
}

export interface Expense {
  id: string;
  messId: string;
  categoryId: string;
  categoryCode: ExpenseCategoryCode;
  amount: number;
  description: string;
  expenseDate: string;
  paidBy: string; // memberId or "CASHIER" / "MESS_FUND"
  paymentMethod: PaymentMethod;
  receiptUrl?: string;
  note?: string;
  bazarId?: string; // If originated from a bazar record
  recordedBy: string;
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
}

export interface BazarItem {
  id: string;
  bazarId: string;
  itemName: string;
  quantity: number;
  unit: string; // 'kg', 'g', 'litre', 'pcs', 'pack', 'hali'
  unitPrice: number;
  totalPrice: number;
}

export interface BazarRecord {
  id: string;
  messId: string;
  date: string;
  purchasedBy: string; // memberId
  marketName: string;
  totalAmount: number;
  note?: string;
  receiptUrl?: string;
  items: BazarItem[];
  expenseId?: string; // Linked expense in mess funds
  createdAt: string;
  updatedAt: string;
}

export interface Settlement {
  id: string;
  messId: string;
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  settlementDate: string;
  note?: string;
  status: SettlementStatus;
  recordedBy: string;
  createdAt: string;
}

export interface SettlementSuggestion {
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  fromMemberName: string;
  toMemberName: string;
}

export interface DutySchedule {
  id: string;
  messId: string;
  memberId: string;
  dutyType: DutyType;
  customDutyName?: string;
  mealType?: MealType;
  date: string; // YYYY-MM-DD
  status: DutyStatus;
  completedAt?: string;
  note?: string;
  assignedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DutySwapRequest {
  id: string;
  messId: string;
  dutyId: string;
  requesterMemberId: string;
  targetMemberId: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface MealPlan {
  id: string;
  messId: string;
  date: string; // YYYY-MM-DD
  breakfast: string;
  lunch: string;
  dinner: string;
  note?: string;
  createdBy: string;
  updatedAt: string;
}

export interface ShoppingListItem {
  id: string;
  messId: string;
  itemName: string;
  quantity: number;
  unit: string;
  priority: ShoppingPriority;
  status: ShoppingStatus;
  estimatedCost?: number;
  addedBy: string;
  note?: string;
  createdAt: string;
}

export interface LedgerTransaction {
  id: string;
  messId: string;
  date: string;
  type: LedgerTransactionType;
  title: string;
  description: string;
  amount: number;
  memberId?: string;
  memberName?: string;
  category?: string;
  paymentMethod?: PaymentMethod;
  impactOnCash: number; // positive, negative, or 0 (personal settlement)
  runningBalance?: number;
  referenceId: string;
  receiptUrl?: string;
  recordedBy: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId: string;
  oldValue?: string;
  newValue?: string;
  details: string;
  timestamp: string;
}

export interface AppNotification {
  id: string;
  userId: string; // specific user or 'ALL'
  title: string;
  message: string;
  type: 'EXPENSE' | 'DEPOSIT' | 'SETTLEMENT' | 'DUTY' | 'MONTHLY_CLOSING' | 'REMINDER';
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export interface MemberFinancialSummary {
  memberId: string;
  memberName: string;
  role: Role;
  status: MemberStatus;
  totalDeposited: number;
  share: number;
  settlementsPaid: number;
  settlementsReceived: number;
  netBalance: number; // positive = should receive (+৳), negative = owes (-৳)
  statusLabel: 'RECEIVES' | 'OWES' | 'SETTLED';
}

export interface MonthlyFinancialOverview {
  monthYear: string;
  monthName: string;
  status: MonthStatus;
  openingBalance: number;
  totalDeposits: number;
  totalExpenses: number;
  cashBalance: number; // Opening + Deposits - Expenses
  perMemberShare: number;
  activeMemberCount: number;
  totalReceivables: number;
  totalPayables: number;
  categoryBreakdown: { category: string; code: ExpenseCategoryCode; amount: number; percentage: number }[];
  memberSummaries: MemberFinancialSummary[];
  settlementSuggestions: SettlementSuggestion[];
}
