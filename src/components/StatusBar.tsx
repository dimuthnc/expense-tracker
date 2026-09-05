import { useAppState } from '@/state/AppContext';

/**
 * The persistent footer strip. One honest piece of state: this app keeps
 * nothing after the tab closes, so the bar says so and counts what is
 * currently in memory.
 */
export function StatusBar() {
  const state = useAppState();
  const rows =
    state.expenses.length +
    state.installments.length +
    state.fixedCosts.length +
    state.cashExpenses.length;

  return (
    <footer className="fx-statusbar mt-16">
      <span className="fx-pulse" aria-hidden="true" />
      <span>In memory only</span>
      <span className="fx-dot" aria-hidden="true" />
      <span className="fx-figure">{rows} rows</span>
      <span className="fx-dot" aria-hidden="true" />
      <span>Export to keep</span>
      <span className="fx-statusbar__end">Personal Expense Manager</span>
    </footer>
  );
}
