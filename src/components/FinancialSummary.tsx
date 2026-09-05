import type { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppState } from '@/state/AppContext';
import { computeSummary } from '@/state/selectors';

/**
 * The summary follows the accent rules strictly:
 *   amber  — figures the user decides (income, savings target)
 *   teal   — figures the machine derives (every total)
 *   coral  — the one warning state (over budget)
 * and one loud thing per screen: the remaining-budget figure.
 */

function Metric({
  label,
  meta,
  value,
  tone = 'plain',
  large = false,
  className,
}: {
  label: string;
  meta?: string;
  value: string;
  tone?: 'plain' | 'machine' | 'signal';
  /** Only the two figures that sit beside the remaining budget get the larger size. */
  large?: boolean;
  className?: string;
}) {
  return (
    <Card className={cn('flex flex-col justify-between gap-4 p-5', className)}>
      <div>
        <div className="fx-label">{label}</div>
        {meta && <div className="mt-1 text-micro text-ink-faint">{meta}</div>}
      </div>
      <div
        className={cn(
          'fx-figure font-display font-semibold leading-none tracking-tight',
          large ? 'text-title' : 'text-lead',
          tone === 'plain' && 'text-ink',
          tone === 'machine' && 'text-machine',
          tone === 'signal' && 'text-signal',
        )}
      >
        {value}
      </div>
    </Card>
  );
}

function HumanInput({
  id,
  label,
  meta,
  value,
  onChange,
  children,
}: {
  id: string;
  label: string;
  meta: string;
  value: string;
  onChange: (next: string) => void;
  children?: ReactNode;
}) {
  return (
    <Card className="flex flex-col justify-between gap-4 border-l-bar border-l-human p-5 pl-6">
      <div>
        <label htmlFor={id} className="fx-label block">
          {label}
        </label>
        <div className="mt-1 text-micro text-ink-faint">{meta}</div>
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-small text-human">$</span>
          <Input
            id={id}
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="fx-figure h-10 max-w-[200px] border-human-edge text-right font-display text-lead font-semibold text-human focus:border-human"
          />
        </div>
        {children}
      </div>
    </Card>
  );
}

export function FinancialSummary() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const summary = computeSummary(state);
  const overBudget = summary.remainingBudget < 0;
  const perDayValue =
    summary.remainingPerDay == null ? 'n/a' : formatCurrency(summary.remainingPerDay);
  const perDayNegative = summary.remainingPerDay != null && summary.remainingPerDay < 0;

  return (
    <section className="mb-8" aria-labelledby="summary-heading">
      <h2
        id="summary-heading"
        className="mb-3 font-display text-lead font-semibold leading-tight tracking-tight"
      >
        Summary
      </h2>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* The loud thing. */}
        <Card
          className={cn(
            'flex flex-col justify-between gap-6 border-l-bar p-6 pl-7 lg:col-span-2',
            overBudget ? 'border-l-signal' : 'border-l-machine',
          )}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="fx-label">Remaining budget</div>
              <div className="mt-1 text-micro text-ink-faint">
                Income − (card + installments + fixed + savings)
              </div>
            </div>
            <span className={cn('fx-tag', overBudget ? 'fx-tag--solid bg-signal' : 'fx-tag--machine')}>
              {overBudget ? 'Over budget' : 'On track'}
            </span>
          </div>
          <div
            className={cn(
              'fx-figure font-display text-display font-semibold leading-none tracking-tight',
              overBudget ? 'text-signal' : 'text-machine',
            )}
          >
            {formatCurrency(summary.remainingBudget)}
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <Metric
            label="Per day"
            meta="Remaining ÷ days left"
            value={perDayValue}
            tone={perDayNegative ? 'signal' : 'machine'}
            large
          />
          <Metric
            label="Days remaining"
            meta="Excluding today"
            value={String(summary.daysRemaining)}
            tone="machine"
            large
          />
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <HumanInput
          id="expectedIncome"
          label="Expected income"
          meta="Take-home or budgeted income for this cycle"
          value={state.expectedIncome}
          onChange={(value) => dispatch({ type: 'SET_INCOME', value })}
        />
        <HumanInput
          id="expectedSavings"
          label="Savings target"
          meta="What you plan to set aside"
          value={state.expectedSavings}
          onChange={(value) => dispatch({ type: 'SET_SAVINGS', value })}
        >
          <div className="mt-3 flex items-baseline gap-2 text-micro text-ink-faint">
            <span className="fx-label">Projected</span>
            <span className="fx-figure font-display text-small font-semibold text-machine">
              {formatCurrency(summary.projectedSavings)}
            </span>
          </div>
        </HumanInput>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Card bill" meta="Credit card expenses" value={formatCurrency(summary.cardTotal)} />
        <Metric
          label="Installments"
          meta="Monthly amounts"
          value={formatCurrency(summary.monthlyInstallments)}
        />
        <Metric label="Fixed costs" meta="Recurring obligations" value={formatCurrency(summary.fixedCosts)} />
        <Metric label="Cash" meta="Cash, transfer, wallet" value={formatCurrency(summary.cashExpenses)} />
      </div>
    </section>
  );
}
