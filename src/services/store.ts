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

export const STORAGE_KEY = 'bachelor_mess_data_v4_ovi_admin_only';

export const OVI_ADMIN_USER: User = {
  id: 'user-ovi',
  name: 'Ovi',
  nameBn: 'অভি',
  email: 'ashikurovi2003@gmail.com',
  phone: '+880 1711-223344',
  role: 'ADMIN',
  status: 'ACTIVE',
  roomNumber: 'Room 301',
  joinDate: '2026-09-25',
  messId: 'mess-dhaka-01',
  createdAt: '2026-09-25T00:00:00.000Z',
  updatedAt: '2026-09-25T00:00:00.000Z'
};

const REMOVED_DEFAULT_USER_IDS = new Set(['user-rahim', 'user-karim', 'user-hasan', 'user-sakib']);
const REMOVED_DEFAULT_EMAILS = new Set(['rahim.mess@gmail.com', 'karim.mess@gmail.com', 'hasan.mess@gmail.com', 'sakib.mess@gmail.com']);

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

  // Pure clean dynamic state - ONLY Ovi (ADMIN) as default user
  return {
    currentUserId: OVI_ADMIN_USER.id,
    activeMessId: 'mess-dhaka-01',
    selectedMonth: '2026-09',
    mess: DEFAULT_MESS,
    members: [OVI_ADMIN_USER],
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
  // Persistence is now fully handled by the backend API.
}
