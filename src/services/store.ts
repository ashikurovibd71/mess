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

export const STORAGE_KEY = 'bachelor_mess_data_v1';

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
  address: 'House 42, Road 9, Dhanmondi, Dhaka-1205',
  description: 'Shared living apartment for professionals and students',
  createdBy: 'user-ovi',
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-24T00:00:00.000Z'
};

const DEFAULT_MEMBERS: User[] = [
  {
    id: 'user-ovi',
    name: 'Ovi',
    nameBn: 'অভি',
    email: 'ashikurovi2003@gmail.com',
    phone: '+880 1711-223344',
    role: 'ADMIN',
    status: 'ACTIVE',
    roomNumber: 'Room 301',
    joinDate: '2026-01-01',
    messId: 'mess-dhaka-01',
    profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-09-24T00:00:00.000Z'
  },
  {
    id: 'user-rahim',
    name: 'Rahim',
    nameBn: 'রহিম',
    email: 'rahim.mess@gmail.com',
    phone: '+880 1811-223344',
    role: 'CASHIER',
    status: 'ACTIVE',
    roomNumber: 'Room 302',
    joinDate: '2026-01-01',
    messId: 'mess-dhaka-01',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-09-24T00:00:00.000Z'
  },
  {
    id: 'user-karim',
    name: 'Karim',
    nameBn: 'করিম',
    email: 'karim.mess@gmail.com',
    phone: '+880 1911-223344',
    role: 'MEMBER',
    status: 'ACTIVE',
    roomNumber: 'Room 302',
    joinDate: '2026-02-01',
    messId: 'mess-dhaka-01',
    createdAt: '2026-02-01T00:00:00.000Z',
    updatedAt: '2026-09-24T00:00:00.000Z'
  },
  {
    id: 'user-hasan',
    name: 'Hasan',
    nameBn: 'হাসান',
    email: 'hasan.mess@gmail.com',
    phone: '+880 1511-223344',
    role: 'MEMBER',
    status: 'ACTIVE',
    roomNumber: 'Room 303',
    joinDate: '2026-03-01',
    messId: 'mess-dhaka-01',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-09-24T00:00:00.000Z'
  },
  {
    id: 'user-sakib',
    name: 'Sakib',
    nameBn: 'সাকিব',
    email: 'sakib.mess@gmail.com',
    phone: '+880 1611-223344',
    role: 'MEMBER',
    status: 'ACTIVE',
    roomNumber: 'Room 303',
    joinDate: '2026-04-01',
    messId: 'mess-dhaka-01',
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-09-24T00:00:00.000Z'
  }
];

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
    openingBalance: 2000,
    totalDeposits: 20000,
    totalExpenses: 20000,
    totalSettlements: 0,
    totalReceivables: 1500,
    totalPayables: 1500,
    closingBalance: 2000,
    status: 'OPEN'
  }
];

// Deposits matching the prompt scenario:
// Ovi 5000, Rahim 3000, Karim 4000, Hasan 4500, Sakib 3500 -> Total 20,000
const DEFAULT_CONTRIBUTIONS: Contribution[] = [
  {
    id: 'contrib-1',
    messId: 'mess-dhaka-01',
    memberId: 'user-ovi',
    amount: 5000,
    paymentMethod: 'BKASH',
    transactionDate: '2026-09-02',
    note: 'September initial advance via bKash',
    recordedBy: 'user-rahim',
    createdAt: '2026-09-02T10:00:00.000Z'
  },
  {
    id: 'contrib-2',
    messId: 'mess-dhaka-01',
    memberId: 'user-rahim',
    amount: 3000,
    paymentMethod: 'CASH',
    transactionDate: '2026-09-03',
    note: 'Handed over cash deposit',
    recordedBy: 'user-ovi',
    createdAt: '2026-09-03T11:30:00.000Z'
  },
  {
    id: 'contrib-3',
    messId: 'mess-dhaka-01',
    memberId: 'user-karim',
    amount: 4000,
    paymentMethod: 'NAGAD',
    transactionDate: '2026-09-04',
    note: 'Nagad payment for monthly fund',
    recordedBy: 'user-rahim',
    createdAt: '2026-09-04T14:15:00.000Z'
  },
  {
    id: 'contrib-4',
    messId: 'mess-dhaka-01',
    memberId: 'user-hasan',
    amount: 4500,
    paymentMethod: 'BKASH',
    transactionDate: '2026-09-05',
    note: 'bKash deposit with extra buffer',
    recordedBy: 'user-rahim',
    createdAt: '2026-09-05T09:40:00.000Z'
  },
  {
    id: 'contrib-5',
    messId: 'mess-dhaka-01',
    memberId: 'user-sakib',
    amount: 3500,
    paymentMethod: 'CASH',
    transactionDate: '2026-09-05',
    note: 'Cash deposit to cashier',
    recordedBy: 'user-rahim',
    createdAt: '2026-09-05T16:20:00.000Z'
  }
];

// Expenses matching the prompt:
// Bazar 12,000, Electricity 2,000, Gas 1,000, Internet 1,000, Other 4,000 = Total 20,000
const DEFAULT_EXPENSES: Expense[] = [
  {
    id: 'exp-1',
    messId: 'mess-dhaka-01',
    categoryId: 'cat-bazar',
    categoryCode: 'BAZAR',
    amount: 1530,
    description: 'Weekly Fresh Bazar (Fish, Rice, Veggies, Eggs)',
    expenseDate: '2026-09-25',
    paidBy: 'user-ovi',
    paymentMethod: 'CASH',
    bazarId: 'bazar-1',
    recordedBy: 'user-rahim',
    note: 'Purchased from Dhanmondi Raw Market',
    createdAt: '2026-09-25T08:30:00.000Z',
    updatedAt: '2026-09-25T08:30:00.000Z'
  },
  {
    id: 'exp-2',
    messId: 'mess-dhaka-01',
    categoryId: 'cat-bazar',
    categoryCode: 'BAZAR',
    amount: 4200,
    description: 'Major Monthly Staples (Rice sack, Lentils, Spices, Oil)',
    expenseDate: '2026-09-05',
    paidBy: 'user-rahim',
    paymentMethod: 'CASH',
    recordedBy: 'user-rahim',
    note: 'Wholesale market purchase',
    createdAt: '2026-09-05T12:00:00.000Z',
    updatedAt: '2026-09-05T12:00:00.000Z'
  },
  {
    id: 'exp-3',
    messId: 'mess-dhaka-01',
    categoryId: 'cat-bazar',
    categoryCode: 'BAZAR',
    amount: 3450,
    description: 'Weekly Bazar (Chicken, Beef, Potato, Onion)',
    expenseDate: '2026-09-12',
    paidBy: 'user-karim',
    paymentMethod: 'CASH',
    recordedBy: 'user-rahim',
    createdAt: '2026-09-12T09:00:00.000Z',
    updatedAt: '2026-09-12T09:00:00.000Z'
  },
  {
    id: 'exp-4',
    messId: 'mess-dhaka-01',
    categoryId: 'cat-bazar',
    categoryCode: 'BAZAR',
    amount: 2820,
    description: 'Mid-Month Bazar (Eggs, Rui Fish, Vegetables, Spices)',
    expenseDate: '2026-09-19',
    paidBy: 'user-hasan',
    paymentMethod: 'CASH',
    recordedBy: 'user-rahim',
    createdAt: '2026-09-19T08:45:00.000Z',
    updatedAt: '2026-09-19T08:45:00.000Z'
  },
  {
    id: 'exp-elec',
    messId: 'mess-dhaka-01',
    categoryId: 'cat-elec',
    categoryCode: 'ELECTRICITY',
    amount: 2000,
    description: 'DESCO Prepaid Electricity Meter Recharge',
    expenseDate: '2026-09-24',
    paidBy: 'user-rahim',
    paymentMethod: 'BKASH',
    recordedBy: 'user-rahim',
    note: 'Meter Token: 8943-1284-9023-4512',
    createdAt: '2026-09-24T15:00:00.000Z',
    updatedAt: '2026-09-24T15:00:00.000Z'
  },
  {
    id: 'exp-gas',
    messId: 'mess-dhaka-01',
    categoryId: 'cat-gas',
    categoryCode: 'GAS',
    amount: 1000,
    description: 'Titas Gas Monthly Prepaid Smart Card Recharge',
    expenseDate: '2026-09-20',
    paidBy: 'user-rahim',
    paymentMethod: 'NAGAD',
    recordedBy: 'user-rahim',
    createdAt: '2026-09-20T11:00:00.000Z',
    updatedAt: '2026-09-20T11:00:00.000Z'
  },
  {
    id: 'exp-net',
    messId: 'mess-dhaka-01',
    categoryId: 'cat-net',
    categoryCode: 'INTERNET',
    amount: 1000,
    description: 'AmberIT 50 Mbps Fiber Broadband Monthly Bill',
    expenseDate: '2026-09-15',
    paidBy: 'user-rahim',
    paymentMethod: 'BKASH',
    recordedBy: 'user-rahim',
    note: 'Client ID: AMB-DH-4029',
    createdAt: '2026-09-15T10:30:00.000Z',
    updatedAt: '2026-09-15T10:30:00.000Z'
  },
  {
    id: 'exp-other-maid',
    messId: 'mess-dhaka-01',
    categoryId: 'cat-clean',
    categoryCode: 'CLEANING',
    amount: 2500,
    description: 'Monthly House Maid / Bua Honorarium & Cooking Charge',
    expenseDate: '2026-09-07',
    paidBy: 'user-rahim',
    paymentMethod: 'CASH',
    recordedBy: 'user-rahim',
    note: 'Paid to Morium Bua for Sept',
    createdAt: '2026-09-07T18:00:00.000Z',
    updatedAt: '2026-09-07T18:00:00.000Z'
  },
  {
    id: 'exp-other-water',
    messId: 'mess-dhaka-01',
    categoryId: 'cat-other',
    categoryCode: 'OTHER',
    amount: 1500,
    description: 'Pure Drinking Mineral Water Jars & Dishwashing Supplies',
    expenseDate: '2026-09-14',
    paidBy: 'user-sakib',
    paymentMethod: 'CASH',
    recordedBy: 'user-rahim',
    note: '10 water jars + Vim liquid',
    createdAt: '2026-09-14T17:15:00.000Z',
    updatedAt: '2026-09-14T17:15:00.000Z'
  }
];

const DEFAULT_BAZAR_RECORDS: BazarRecord[] = [
  {
    id: 'bazar-1',
    messId: 'mess-dhaka-01',
    date: '2026-09-25',
    purchasedBy: 'user-ovi',
    marketName: 'Dhanmondi Raw Market (ধানমন্ডি কাঁচাবাজার)',
    totalAmount: 1530,
    note: 'Morning fresh bazar done by Ovi',
    expenseId: 'exp-1',
    items: [
      { id: 'bitem-1', bazarId: 'bazar-1', itemName: 'Miniket Rice (মিনিকেট চাল)', quantity: 5, unit: 'kg', unitPrice: 80, totalPrice: 400 },
      { id: 'bitem-2', bazarId: 'bazar-1', itemName: 'Fresh Rui Fish (তাজা রুই মাছ)', quantity: 1.5, unit: 'kg', unitPrice: 300, totalPrice: 450 },
      { id: 'bitem-3', bazarId: 'bazar-1', itemName: 'Assorted Vegetables (কাঁচা সবজি)', quantity: 1, unit: 'pack', unitPrice: 200, totalPrice: 200 },
      { id: 'bitem-4', bazarId: 'bazar-1', itemName: 'Soybean Oil (সয়াবিন তেল)', quantity: 1.5, unit: 'litre', unitPrice: 200, totalPrice: 300 },
      { id: 'bitem-5', bazarId: 'bazar-1', itemName: 'Farm Eggs (ফার্মের ডিম)', quantity: 15, unit: 'pcs', unitPrice: 12, totalPrice: 180 }
    ],
    createdAt: '2026-09-25T08:30:00.000Z',
    updatedAt: '2026-09-25T08:30:00.000Z'
  }
];

const DEFAULT_DUTIES: DutySchedule[] = [
  {
    id: 'duty-1',
    messId: 'mess-dhaka-01',
    memberId: 'user-ovi',
    dutyType: 'BAZAR',
    date: '2026-09-25',
    status: 'COMPLETED',
    completedAt: '2026-09-25T08:45:00.000Z',
    note: 'Bazar completed and recorded',
    assignedBy: 'user-rahim',
    createdAt: '2026-09-24T00:00:00.000Z',
    updatedAt: '2026-09-25T08:45:00.000Z'
  },
  {
    id: 'duty-2',
    messId: 'mess-dhaka-01',
    memberId: 'user-rahim',
    dutyType: 'COOKING',
    mealType: 'BREAKFAST',
    date: '2026-09-25',
    status: 'COMPLETED',
    completedAt: '2026-09-25T08:15:00.000Z',
    note: 'Paratha & Egg prepared',
    assignedBy: 'user-ovi',
    createdAt: '2026-09-24T00:00:00.000Z',
    updatedAt: '2026-09-25T08:15:00.000Z'
  },
  {
    id: 'duty-3',
    messId: 'mess-dhaka-01',
    memberId: 'user-karim',
    dutyType: 'COOKING',
    mealType: 'LUNCH',
    date: '2026-09-25',
    status: 'ASSIGNED',
    note: 'Lunch: Rice, Rui fish & Dal',
    assignedBy: 'user-ovi',
    createdAt: '2026-09-24T00:00:00.000Z',
    updatedAt: '2026-09-24T00:00:00.000Z'
  },
  {
    id: 'duty-4',
    messId: 'mess-dhaka-01',
    memberId: 'user-hasan',
    dutyType: 'COOKING',
    mealType: 'DINNER',
    date: '2026-09-25',
    status: 'ASSIGNED',
    note: 'Dinner: Rice, Chicken & Veggies',
    assignedBy: 'user-ovi',
    createdAt: '2026-09-24T00:00:00.000Z',
    updatedAt: '2026-09-24T00:00:00.000Z'
  },
  {
    id: 'duty-5',
    messId: 'mess-dhaka-01',
    memberId: 'user-sakib',
    dutyType: 'CLEANING',
    date: '2026-09-25',
    status: 'ASSIGNED',
    note: 'Dining hall & kitchen cleaning',
    assignedBy: 'user-rahim',
    createdAt: '2026-09-24T00:00:00.000Z',
    updatedAt: '2026-09-24T00:00:00.000Z'
  },
  // Upcoming duties for Sep 26
  {
    id: 'duty-6',
    messId: 'mess-dhaka-01',
    memberId: 'user-rahim',
    dutyType: 'BAZAR',
    date: '2026-09-26',
    status: 'ASSIGNED',
    note: 'Morning Bazar',
    assignedBy: 'user-ovi',
    createdAt: '2026-09-24T00:00:00.000Z',
    updatedAt: '2026-09-24T00:00:00.000Z'
  },
  {
    id: 'duty-7',
    messId: 'mess-dhaka-01',
    memberId: 'user-karim',
    dutyType: 'COOKING',
    mealType: 'BREAKFAST',
    date: '2026-09-26',
    status: 'ASSIGNED',
    assignedBy: 'user-ovi',
    createdAt: '2026-09-24T00:00:00.000Z',
    updatedAt: '2026-09-24T00:00:00.000Z'
  },
  {
    id: 'duty-8',
    messId: 'mess-dhaka-01',
    memberId: 'user-hasan',
    dutyType: 'COOKING',
    mealType: 'LUNCH',
    date: '2026-09-26',
    status: 'ASSIGNED',
    assignedBy: 'user-ovi',
    createdAt: '2026-09-24T00:00:00.000Z',
    updatedAt: '2026-09-24T00:00:00.000Z'
  },
  {
    id: 'duty-9',
    messId: 'mess-dhaka-01',
    memberId: 'user-sakib',
    dutyType: 'COOKING',
    mealType: 'DINNER',
    date: '2026-09-26',
    status: 'ASSIGNED',
    assignedBy: 'user-ovi',
    createdAt: '2026-09-24T00:00:00.000Z',
    updatedAt: '2026-09-24T00:00:00.000Z'
  },
  {
    id: 'duty-10',
    messId: 'mess-dhaka-01',
    memberId: 'user-ovi',
    dutyType: 'CLEANING',
    date: '2026-09-26',
    status: 'ASSIGNED',
    assignedBy: 'user-rahim',
    createdAt: '2026-09-24T00:00:00.000Z',
    updatedAt: '2026-09-24T00:00:00.000Z'
  }
];

const DEFAULT_MEAL_PLANS: MealPlan[] = [
  {
    id: 'meal-2026-09-25',
    messId: 'mess-dhaka-01',
    date: '2026-09-25',
    breakfast: 'Paratha + Egg Omelette + Hot Tea (পরোটা, ডিম ভাজি ও চা)',
    lunch: 'Steamed Rice + Rui Fish Curry + Mung Dal + Green Salad (ভাত, রুই মাছ ও ডাল)',
    dinner: 'Rice + Chicken Bhuna + Mixed Vegetable Labra (ভাত, মুরগির মাংস ও লাবড়া)',
    note: 'Guest coming for dinner: Rahim’s cousin',
    createdBy: 'user-rahim',
    updatedAt: '2026-09-24T20:00:00.000Z'
  },
  {
    id: 'meal-2026-09-26',
    messId: 'mess-dhaka-01',
    date: '2026-09-26',
    breakfast: 'Khichuri + Begun Bhaja (খিচুড়ি ও বেগুন ভাজা)',
    lunch: 'Rice + Egg Curry + Bottle Gourd Dal (ভাত, ডিমের ঝোল ও লাউ ডাল)',
    dinner: 'Rice + Beef Kala Bhuna + Potato Mash (ভাত, বিফ কালা ভুনা ও আলু ভর্তা)',
    note: 'Weekend special menu',
    createdBy: 'user-ovi',
    updatedAt: '2026-09-24T21:00:00.000Z'
  }
];

const DEFAULT_SHOPPING_LIST: ShoppingListItem[] = [
  { id: 'shop-1', messId: 'mess-dhaka-01', itemName: 'Miniket Rice (মিনিকেট চাল)', quantity: 5, unit: 'kg', priority: 'HIGH', status: 'PENDING', estimatedCost: 400, addedBy: 'user-rahim', createdAt: '2026-09-24T18:00:00.000Z' },
  { id: 'shop-2', messId: 'mess-dhaka-01', itemName: 'Fresh Potato (আলু)', quantity: 3, unit: 'kg', priority: 'HIGH', status: 'PENDING', estimatedCost: 150, addedBy: 'user-karim', createdAt: '2026-09-24T18:10:00.000Z' },
  { id: 'shop-3', messId: 'mess-dhaka-01', itemName: 'Local Onion (দেশি পেঁয়াজ)', quantity: 2, unit: 'kg', priority: 'HIGH', status: 'PENDING', estimatedCost: 200, addedBy: 'user-hasan', createdAt: '2026-09-24T18:15:00.000Z' },
  { id: 'shop-4', messId: 'mess-dhaka-01', itemName: 'Broiler Chicken (ব্রয়লার মুরগি)', quantity: 2, unit: 'kg', priority: 'MEDIUM', status: 'PENDING', estimatedCost: 420, addedBy: 'user-ovi', createdAt: '2026-09-24T18:20:00.000Z' },
  { id: 'shop-5', messId: 'mess-dhaka-01', itemName: 'Red Lentils (মসুর ডাল)', quantity: 1, unit: 'kg', priority: 'MEDIUM', status: 'PENDING', estimatedCost: 140, addedBy: 'user-sakib', createdAt: '2026-09-24T18:30:00.000Z' },
  { id: 'shop-6', messId: 'mess-dhaka-01', itemName: 'Teer Soybean Oil (তীর তেল)', quantity: 2, unit: 'litre', priority: 'HIGH', status: 'PENDING', estimatedCost: 380, addedBy: 'user-rahim', createdAt: '2026-09-24T19:00:00.000Z' }
];

const DEFAULT_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'audit-1',
    userId: 'user-ovi',
    userName: 'Ovi',
    action: 'CREATE_EXPENSE',
    entity: 'Expense',
    entityId: 'exp-1',
    newValue: '৳1,530 Bazar expense',
    details: 'Recorded fresh morning bazar with 5 line items',
    timestamp: '2026-09-25T08:35:00.000Z'
  },
  {
    id: 'audit-2',
    userId: 'user-rahim',
    userName: 'Rahim',
    action: 'CREATE_EXPENSE',
    entity: 'Expense',
    entityId: 'exp-elec',
    newValue: '৳2,000 Electricity Bill',
    details: 'DESCO Prepaid electricity token purchased via bKash',
    timestamp: '2026-09-24T15:05:00.000Z'
  },
  {
    id: 'audit-3',
    userId: 'user-rahim',
    userName: 'Rahim',
    action: 'RECORD_DEPOSIT',
    entity: 'Contribution',
    entityId: 'contrib-1',
    newValue: '৳5,000',
    details: 'Received monthly fund deposit from Ovi via bKash',
    timestamp: '2026-09-02T10:05:00.000Z'
  }
];

const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    userId: 'ALL',
    title: 'Morning Bazar Completed',
    message: 'Ovi finished morning bazar for ৳1,530. Today’s menu is set!',
    type: 'EXPENSE',
    isRead: false,
    createdAt: '2026-09-25T08:50:00.000Z'
  },
  {
    id: 'notif-2',
    userId: 'user-karim',
    title: 'Cooking Duty Reminder',
    message: 'You have Lunch cooking duty today (Rice + Fish Curry).',
    type: 'DUTY',
    isRead: false,
    createdAt: '2026-09-25T09:00:00.000Z'
  },
  {
    id: 'notif-3',
    userId: 'user-rahim',
    title: 'Settlement Suggestion Generated',
    message: 'Monthly balance calculated. You have a suggested settlement of ৳1,000 to Ovi.',
    type: 'SETTLEMENT',
    isRead: false,
    createdAt: '2026-09-25T07:00:00.000Z'
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

  return {
    currentUserId: 'user-ovi', // Default logged-in user (Admin)
    activeMessId: 'mess-dhaka-01',
    selectedMonth: '2026-09',
    mess: DEFAULT_MESS,
    members: DEFAULT_MEMBERS,
    monthlyAccounts: DEFAULT_MONTHLY_ACCOUNTS,
    categories: DEFAULT_CATEGORIES,
    contributions: DEFAULT_CONTRIBUTIONS,
    expenses: DEFAULT_EXPENSES,
    bazarRecords: DEFAULT_BAZAR_RECORDS,
    settlements: [],
    dutySchedules: DEFAULT_DUTIES,
    dutySwaps: [],
    mealPlans: DEFAULT_MEAL_PLANS,
    shoppingList: DEFAULT_SHOPPING_LIST,
    auditLogs: DEFAULT_AUDIT_LOGS,
    notifications: DEFAULT_NOTIFICATIONS
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
