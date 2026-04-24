import { useEffect } from 'react';
import { ConfigSection } from '@/components/ConfigSection';
import { CycleSelector } from '@/components/CycleSelector';
import { ExpenseCharts } from '@/components/ExpenseCharts';
import { FinancialSummary } from '@/components/FinancialSummary';
import { Header } from '@/components/Header';
import { SummaryTables } from '@/components/SummaryTables';
import { TopTransactions } from '@/components/TopTransactions';
import { CashExpensesTable } from '@/components/tables/CashExpensesTable';
import { ExpensesTable } from '@/components/tables/ExpensesTable';
import { FixedCostsTable } from '@/components/tables/FixedCostsTable';
import { InstallmentsTable } from '@/components/tables/InstallmentsTable';
import { useAltAShortcut } from '@/hooks/useAltAShortcut';

export function Home() {
  useAltAShortcut();

  useEffect(() => {
    document.title = 'Personal Expense Manager';
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-8">
      <Header title="Personal Expense Manager" />
      <CycleSelector />
      <ConfigSection />
      <ExpensesTable />
      <InstallmentsTable />
      <FixedCostsTable />
      <CashExpensesTable />
      <SummaryTables />
      <FinancialSummary />
      <ExpenseCharts />
      <TopTransactions />
    </div>
  );
}
