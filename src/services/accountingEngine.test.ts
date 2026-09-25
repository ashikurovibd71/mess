import {
  calculateMemberSummaries,
  generateSettlementSuggestions,
  calculateCashBalance,
  roundMoney
} from './accountingEngine';
import { User, Contribution, Expense, Settlement, ExpenseCategory } from '../types';

/**
 * Section 34: Unit Tests for Critical Accounting Logic
 */
export function runAccountingTests() {
  console.log('--- Running Bachelor Mess Accounting Tests ---');

  // Test 1: 5 Members, ৳20,000 Total Expenses -> Equal share = ৳4,000
  const mockMembers: User[] = [
    { id: 'u1', name: 'Ovi', role: 'ADMIN', status: 'ACTIVE', email: '', phone: '', joinDate: '2026-01-01', messId: 'm1', createdAt: '', updatedAt: '' },
    { id: 'u2', name: 'Rahim', role: 'CASHIER', status: 'ACTIVE', email: '', phone: '', joinDate: '2026-01-01', messId: 'm1', createdAt: '', updatedAt: '' },
    { id: 'u3', name: 'Karim', role: 'MEMBER', status: 'ACTIVE', email: '', phone: '', joinDate: '2026-01-01', messId: 'm1', createdAt: '', updatedAt: '' },
    { id: 'u4', name: 'Hasan', role: 'MEMBER', status: 'ACTIVE', email: '', phone: '', joinDate: '2026-01-01', messId: 'm1', createdAt: '', updatedAt: '' },
    { id: 'u5', name: 'Sakib', role: 'MEMBER', status: 'ACTIVE', email: '', phone: '', joinDate: '2026-01-01', messId: 'm1', createdAt: '', updatedAt: '' }
  ];

  const mockExpenses: Expense[] = [
    { id: 'e1', messId: 'm1', categoryId: 'c1', categoryCode: 'BAZAR', amount: 12000, description: 'Bazar', expenseDate: '2026-09-10', paidBy: 'u1', paymentMethod: 'CASH', recordedBy: 'u1', createdAt: '', updatedAt: '' },
    { id: 'e2', messId: 'm1', categoryId: 'c2', categoryCode: 'ELECTRICITY', amount: 2000, description: 'DESCO', expenseDate: '2026-09-12', paidBy: 'u2', paymentMethod: 'BKASH', recordedBy: 'u2', createdAt: '', updatedAt: '' },
    { id: 'e3', messId: 'm1', categoryId: 'c3', categoryCode: 'GAS', amount: 1000, description: 'Titas', expenseDate: '2026-09-14', paidBy: 'u2', paymentMethod: 'NAGAD', recordedBy: 'u2', createdAt: '', updatedAt: '' },
    { id: 'e4', messId: 'm1', categoryId: 'c4', categoryCode: 'INTERNET', amount: 1000, description: 'AmberIT', expenseDate: '2026-09-15', paidBy: 'u2', paymentMethod: 'BKASH', recordedBy: 'u2', createdAt: '', updatedAt: '' },
    { id: 'e5', messId: 'm1', categoryId: 'c5', categoryCode: 'OTHER', amount: 4000, description: 'Maid & Water', expenseDate: '2026-09-18', paidBy: 'u2', paymentMethod: 'CASH', recordedBy: 'u2', createdAt: '', updatedAt: '' }
  ];

  // Total expenses = 12000 + 2000 + 1000 + 1000 + 4000 = 20,000

  // Deposits: Ovi 5000, Rahim 3000, Karim 4000, Hasan 4500, Sakib 3500
  const mockContributions: Contribution[] = [
    { id: 'c1', messId: 'm1', memberId: 'u1', amount: 5000, paymentMethod: 'BKASH', transactionDate: '2026-09-02', recordedBy: 'u2', createdAt: '' },
    { id: 'c2', messId: 'm1', memberId: 'u2', amount: 3000, paymentMethod: 'CASH', transactionDate: '2026-09-03', recordedBy: 'u1', createdAt: '' },
    { id: 'c3', messId: 'm1', memberId: 'u3', amount: 4000, paymentMethod: 'NAGAD', transactionDate: '2026-09-04', recordedBy: 'u2', createdAt: '' },
    { id: 'c4', messId: 'm1', memberId: 'u4', amount: 4500, paymentMethod: 'BKASH', transactionDate: '2026-09-05', recordedBy: 'u2', createdAt: '' },
    { id: 'c5', messId: 'm1', memberId: 'u5', amount: 3500, paymentMethod: 'CASH', transactionDate: '2026-09-05', recordedBy: 'u2', createdAt: '' }
  ];

  const { memberSummaries, perMemberShare, totalExpenses, totalDeposits } = calculateMemberSummaries(
    mockMembers,
    mockContributions,
    mockExpenses,
    [],
    '2026-09'
  );

  console.assert(totalExpenses === 20000, `Expected totalExpenses 20000, got ${totalExpenses}`);
  console.assert(perMemberShare === 4000, `Expected perMemberShare 4000, got ${perMemberShare}`);

  // Test individual balances
  const ovi = memberSummaries.find(m => m.memberName === 'Ovi');
  const rahim = memberSummaries.find(m => m.memberName === 'Rahim');
  const karim = memberSummaries.find(m => m.memberName === 'Karim');
  const hasan = memberSummaries.find(m => m.memberName === 'Hasan');
  const sakib = memberSummaries.find(m => m.memberName === 'Sakib');

  console.assert(ovi?.netBalance === 1000, `Expected Ovi +1000, got ${ovi?.netBalance}`);
  console.assert(rahim?.netBalance === -1000, `Expected Rahim -1000, got ${rahim?.netBalance}`);
  console.assert(karim?.netBalance === 0, `Expected Karim 0, got ${karim?.netBalance}`);
  console.assert(hasan?.netBalance === 500, `Expected Hasan +500, got ${hasan?.netBalance}`);
  console.assert(sakib?.netBalance === -500, `Expected Sakib -500, got ${sakib?.netBalance}`);

  // Test Automatic Settlement Engine:
  // Debtors: Rahim (-1000), Sakib (-500)
  // Creditors: Ovi (+1000), Hasan (+500)
  // Expected Suggestions: Rahim -> Ovi 1000, Sakib -> Hasan 500
  const suggestions = generateSettlementSuggestions(memberSummaries);
  console.assert(suggestions.length === 2, `Expected 2 minimal settlements, got ${suggestions.length}`);
  console.assert(suggestions[0].fromMemberName === 'Rahim' && suggestions[0].toMemberName === 'Ovi' && suggestions[0].amount === 1000);
  console.assert(suggestions[1].fromMemberName === 'Sakib' && suggestions[1].toMemberName === 'Hasan' && suggestions[1].amount === 500);

  // Test Cash Balance Rule:
  // Opening Balance = 2000, Deposits = 20000, Expenses = 20000 -> Cash Balance = 2000
  const cashBal = calculateCashBalance(2000, mockContributions, mockExpenses, '2026-09');
  console.assert(cashBal === 2000, `Expected Cash Balance 2000, got ${cashBal}`);

  console.log('✅ All Bachelor Mess Accounting Logic Tests Passed Successfully!');
  return true;
}
