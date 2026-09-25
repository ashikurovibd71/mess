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
  ExpenseCategoryCode
} from '../types';

export const STORAGE_KEY = 'bachelor_mess_data_v3_pure_dynamic';

export interface AppState {
  currentUserId: string;
  activeMessId: string;
  selectedMonth: string; // "2026-09"
  mess: Mess;
  members: User[];
  monthlyAccounts: MonthlyAccount[];
  categories: ExpenseCategory[];
  contributions: Contribution[];
  expenses: Expense[];
  bazarRecords: BazarRecord[];
  settlements: Settlement[];
  dutySchedules: DutySchedule[];
  dutySwaps: DutySwapRequest[];
  mealPlans: MealPlan[];
  shoppingList: ShoppingListItem[];
  auditLogs: AuditLog[];
  notifications: AppNotification[];
}

const DEFAULT_MESS: Mess = {
  id: 'mess-dhaka-01',
  name: 'Dhaka Bachelor Mess',
  address: 'Dhanmondi, Dhaka',
  description: 'Shared living apartment for bachelor professionals & students',
  createdBy: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const DEFAULT_CATEGORIES: ExpenseCategory[] = [
  { id: 'cat-bazar', messId: 'mess-dhaka-01', code: 'BAZAR', name: 'Bazar / Grocery', nameBn: 'বাজার খরচ' },
  { id: 'cat-elec', messId: 'mess-dhaka-01', code: 'ELECTRICITY', name: 'Electricity Bill', nameBn: 'বিদ্যুৎ বিল' },
  { id: 'cat-gas', messId: 'mess-dhaka-01', code: 'GAS', name: 'Gas / Cylinder', nameBn: 'গ্যাস বিল' },
  { id: 'cat-water', messId: 'mess-dhaka-01', code: 'WATER', name: 'Water Supply', nameBn: 'পানি বিল' },
  { id: 'cat-net', messId: 'mess-dhaka-01', code: 'INTERNET', name: 'Internet / WiFi', nameBn: 'ইন্টারনেট বিল' },
  { id: 'cat-rent', messId: 'mess-dhaka-01', code: 'HOUSE_RENT', name: 'House Rent', nameBn: 'বাড়ি ভাড়া' },
  { id: 'cat-clean', messId: 'mess-dhaka-01', code: 'CLEANING', name: 'Cleaning & Maid', nameBn: 'বুয়া ও পরিষ্কার' },
  { id: 'cat-maint', messId: 'mess-dhaka-01', code: 'MAINTENANCE', name: 'Apartment Maintenance', nameBn: 'মেরামত' },
  { id: 'cat-food', messId: 'mess-dhaka-01', code: 'FOOD', name: 'Special Feast / Snacks', nameBn: 'খাবার / নাস্তা' },
  { id: 'cat-other', messId: 'mess-dhaka-01', code: 'OTHER', name: 'Other Mess Expenses', nameBn: 'অন্যান্য খরচ' }
];

const DEFAULT_MONTHLY_ACCOUNTS: MonthlyAccount[] = [
  {
    id: 'month-2026-09',
    messId: 'mess-dhaka-01',
    monthYear: '2026-09',
    name: 'September 2026',
    openingBalance: 0,
    totalDeposits: 0,
    totalExpenses: 0,
    totalSettlements: 0,
    totalReceivables: 0,
    totalPayables: 0,
    closingBalance: 0,
    status: 'OPEN'
  }
];

export function getInitialState(): AppState {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load mess data from storage:', e);
    }
  }

  // Pure clean dynamic state - NO hardcoded default dummy entries
  return {
    currentUserId: '',
    activeMessId: 'mess-dhaka-01',
    selectedMonth: '2026-09',
    mess: DEFAULT_MESS,
    members: [],
    monthlyAccounts: DEFAULT_MONTHLY_ACCOUNTS,
    categories: DEFAULT_CATEGORIES,
    contributions: [],
    expenses: [],
    bazarRecords: [],
    settlements: [],
    dutySchedules: [],
    dutySwaps: [],
    mealPlans: [],
    shoppingList: [],
    auditLogs: [],
    notifications: []
  };
}

export function saveState(state: AppState): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to persist mess data:', e);
    }
  }
}
