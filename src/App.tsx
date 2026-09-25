/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MessProvider, useMess } from './context/MessContext';
import { AppLayout, ActiveTab } from './components/layout/AppLayout';
import { AuthScreen } from './components/auth/AuthScreen';
import { CombinedDashboard } from './components/dashboard/CombinedDashboard';
import { DutyManagementView } from './components/duties/DutyManagementView';
import { MealShoppingView } from './components/meals/MealShoppingView';
import { BazarListView } from './components/bazar/BazarListView';
import { ExpenseListView } from './components/expenses/ExpenseListView';
import { ContributionListView } from './components/contributions/ContributionListView';
import { SettlementView } from './components/settlements/SettlementView';
import { LedgerView } from './components/ledger/LedgerView';
import { MonthlyAccountView } from './components/monthly/MonthlyAccountView';
import { ReportsView } from './components/reports/ReportsView';
import { MemberManagementView } from './components/members/MemberManagementView';
import { AuditLogsView } from './components/audit/AuditLogsView';
import { runAccountingTests } from './services/accountingEngine.test';

function MainApp() {
  const { isAuthenticated } = useMess();
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  useEffect(() => {
    // Run accounting unit tests in background to verify calculations
    runAccountingTests();
  }, []);

  if (!isAuthenticated && !isGuestMode) {
    return <AuthScreen onContinueAsGuest={() => setIsGuestMode(true)} />;
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <CombinedDashboard onNavigate={setActiveTab} />;
      case 'duties':
        return <DutyManagementView />;
      case 'meals-shopping':
        return <MealShoppingView />;
      case 'bazar':
        return <BazarListView />;
      case 'expenses':
        return <ExpenseListView />;
      case 'contributions':
        return <ContributionListView />;
      case 'settlements':
        return <SettlementView />;
      case 'ledger':
        return <LedgerView />;
      case 'monthly-accounts':
        return <MonthlyAccountView />;
      case 'reports':
        return <ReportsView />;
      case 'members':
        return <MemberManagementView />;
      case 'audit-logs':
        return <AuditLogsView />;
      default:
        return <CombinedDashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <AppLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderActiveView()}
    </AppLayout>
  );
}

export default function App() {
  return (
    <MessProvider>
      <MainApp />
    </MessProvider>
  );
}
