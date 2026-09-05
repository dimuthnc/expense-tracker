import { useEffect } from 'react';
import { ConfigSection } from '@/components/ConfigSection';
import { CycleSelector } from '@/components/CycleSelector';
import { ExpenseCharts } from '@/components/ExpenseCharts';
import { FinancialSummary } from '@/components/FinancialSummary';
import { Header } from '@/components/Header';
import { SectionMarker } from '@/components/SectionMarker';
import { StatusBar } from '@/components/StatusBar';
import { SummaryTables } from '@/components/SummaryTables';
import { TopTransactions } from '@/components/TopTransactions';
import { CashExpensesTable } from '@/components/tables/CashExpensesTable';
import { ExpensesTable } from '@/components/tables/ExpensesTable';
import { FixedCostsTable } from '@/components/tables/FixedCostsTable';
import { InstallmentsTable } from '@/components/tables/InstallmentsTable';
import { useAltAShortcut } from '@/hooks/useAltAShortcut';
import { useAppState } from '@/state/AppContext';

export function Home() {
  useAltAShortcut();
  const { cycleStart, cycleEnd } = useAppState();

  useEffect(() => {
    document.title = 'Personal Expense Manager';
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8">
      <Header
        title="Personal Expense Manager"
        eyebrow={
          <>
            Personal finance
            <span className="fx-dot" aria-hidden="true" />
            <span className="fx-figure normal-case">
              {cycleStart || '…'} → {cycleEnd || '…'}
            </span>
          </>
        }
      />

      <SectionMarker>Setup</SectionMarker>
      <CycleSelector />
      <ConfigSection />

      <SectionMarker>Ledgers</SectionMarker>
      <ExpensesTable />
      <InstallmentsTable />
      <FixedCostsTable />
      <CashExpensesTable />

      <SectionMarker>Summary</SectionMarker>
      <SummaryTables />
      <FinancialSummary />
      <ExpenseCharts />
      <TopTransactions />

      <StatusBar />
    </div>
  );
}
