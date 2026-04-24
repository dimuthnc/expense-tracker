import {
  CalendarDays,
  CreditCard,
  HandCoins,
  PiggyBank,
  Receipt,
  Repeat2,
  TrendingDown,
  Wallet,
} from 'lucide-react';
import { BentoGrid, type BentoItem } from '@/components/bento/BentoGrid';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppState } from '@/state/AppContext';
import { computeSummary } from '@/state/selectors';

function ValueDisplay({
  value,
  negative,
  prefix,
  className,
}: {
  value: string;
  negative?: boolean;
  prefix?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'text-2xl font-semibold tabular-nums tracking-tight',
        negative ? 'text-destructive' : 'text-foreground',
        className,
      )}
    >
      {prefix && <span className="mr-1 text-sm font-normal text-muted-foreground">{prefix}</span>}
      {value}
    </div>
  );
}

export function FinancialSummary() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const summary = computeSummary(state);
  const remainingNegative = summary.remainingBudget < 0;
  const perDayValue =
    summary.remainingPerDay == null ? 'Not Applicable' : formatCurrency(summary.remainingPerDay);
  const perDayNegative = summary.remainingPerDay != null && summary.remainingPerDay < 0;

  const items: BentoItem[] = [
    {
      key: 'income',
      title: 'Monthly Expected Income',
      meta: 'Take-home or budgeted income',
      icon: <Wallet className="h-4 w-4" />,
      hasPersistentHover: true,
      children: (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">$</span>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={state.expectedIncome}
            onChange={(e) => dispatch({ type: 'SET_INCOME', value: e.target.value })}
            className="h-9 max-w-[160px] text-right text-base font-semibold tabular-nums"
            aria-label="Monthly expected income"
          />
        </div>
      ),
    },
    {
      key: 'cardBill',
      title: 'Total Credit Card Bill',
      meta: 'Sum of card expenses this cycle',
      icon: <CreditCard className="h-4 w-4" />,
      children: <ValueDisplay value={formatCurrency(summary.cardTotal)} />,
    },
    {
      key: 'installments',
      title: 'Total Installments (Monthly)',
      meta: 'Sum of installment monthly amounts',
      icon: <Repeat2 className="h-4 w-4" />,
      children: <ValueDisplay value={formatCurrency(summary.monthlyInstallments)} />,
    },
    {
      key: 'fixed',
      title: 'Total Fixed Costs',
      meta: 'Recurring monthly obligations',
      icon: <Receipt className="h-4 w-4" />,
      children: <ValueDisplay value={formatCurrency(summary.fixedCosts)} />,
    },
    {
      key: 'cash',
      title: 'Total Cash Expenses',
      meta: 'Cash, transfer, or wallet spending',
      icon: <HandCoins className="h-4 w-4" />,
      children: <ValueDisplay value={formatCurrency(summary.cashExpenses)} />,
    },
    {
      key: 'remaining',
      title: 'Remaining Budget',
      meta: 'Income − (Card + Installments + Fixed + Savings)',
      icon: <TrendingDown className="h-4 w-4" />,
      status: remainingNegative ? 'Over budget' : 'On track',
      statusTone: remainingNegative ? 'danger' : 'success',
      colSpan: 2,
      children: (
        <ValueDisplay
          value={formatCurrency(summary.remainingBudget)}
          negative={remainingNegative}
          className="text-3xl"
        />
      ),
    },
    {
      key: 'perDay',
      title: 'Remaining Budget / Day',
      meta: 'Remaining ÷ days remaining',
      icon: <CalendarDays className="h-4 w-4" />,
      children: (
        <ValueDisplay
          value={perDayValue}
          negative={perDayNegative}
          className={perDayValue === 'Not Applicable' ? 'text-base font-medium' : undefined}
        />
      ),
    },
    {
      key: 'savings',
      title: 'Expected Savings',
      meta: 'Target you plan to set aside',
      icon: <PiggyBank className="h-4 w-4" />,
      children: (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">$</span>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={state.expectedSavings}
              onChange={(e) => dispatch({ type: 'SET_SAVINGS', value: e.target.value })}
              className="h-9 max-w-[160px] text-right text-base font-semibold tabular-nums"
              aria-label="Expected savings target"
            />
          </div>
          <div className="text-xs text-muted-foreground">
            Projected:{' '}
            <span className="font-semibold text-foreground tabular-nums">
              {formatCurrency(summary.projectedSavings)}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'days',
      title: 'Days Remaining in Cycle',
      meta: 'Excluding today',
      icon: <CalendarDays className="h-4 w-4" />,
      children: <ValueDisplay value={String(summary.daysRemaining)} />,
    },
  ];

  return (
    <section className="mb-8 rounded-xl border bg-card p-5 shadow-sm">
      <h2 className="mb-4 mt-0 text-lg font-semibold">Summary</h2>
      <BentoGrid items={items} />
    </section>
  );
}
