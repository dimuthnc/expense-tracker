import { useMemo } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { useFxTokens } from '@/hooks/useFxTokens';
import { formatCurrency } from '@/lib/format';
import { generatePalette } from '@/lib/palette';
import { useAppState } from '@/state/AppContext';
import { totalsByCategory, totalsByPayment } from '@/state/selectors';

interface DonutProps {
  title: string;
  data: Record<string, number>;
  /** Resolved accent colour for the ramp (see `useFxTokens`). */
  accent: string;
  /** Resolved page background, used to cut the slices apart. */
  ground: string;
  ariaLabel: string;
}

function Donut({ title, data, accent, ground, ariaLabel }: DonutProps) {
  const pairs = useMemo(
    () =>
      Object.entries(data)
        .filter(([, v]) => v > 0)
        .sort((a, b) => b[1] - a[1]),
    [data],
  );
  const total = pairs.reduce((s, [, v]) => s + v, 0);
  const palette = useMemo(
    () => generatePalette(Math.max(pairs.length, 1), accent),
    [pairs.length, accent],
  );
  const chartData = pairs.map(([name, value]) => ({ name, value }));

  return (
    <Card className="flex flex-col border-l-bar border-l-machine p-4 pl-5">
      <figure className="m-0">
        <figcaption className="mb-2 font-display text-body font-semibold leading-tight tracking-tight">
          {title}
        </figcaption>
        <div className="relative h-[240px] w-full" aria-label={ariaLabel} role="img">
          {total > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={96}
                  stroke={ground}
                  strokeWidth={2}
                  isAnimationActive={false}
                >
                  {chartData.map((_, idx) => (
                    <Cell key={idx} fill={palette[idx % palette.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <div className="fx-label flex h-40 w-40 items-center justify-center rounded-pill border border-dashed border-rule-strong text-ink-faint">
                No data
              </div>
            </div>
          )}
        </div>
        <ul className="mt-3 w-full list-none space-y-1.5 p-0 text-small">
          {pairs.map(([label, value], idx) => (
            <li key={label} className="flex items-center gap-2">
              <span
                className="h-3 w-3 flex-shrink-0 rounded-sm"
                style={{ background: palette[idx % palette.length] }}
                aria-hidden="true"
              />
              <span className="flex-1 truncate">{label || '(Uncategorized)'}</span>
              <span className="fx-figure font-medium">{formatCurrency(value)}</span>
              <span className="fx-figure w-14 text-right font-mono text-micro text-ink-faint">
                {total > 0 ? ((value / total) * 100).toFixed(1) : '0'}%
              </span>
            </li>
          ))}
          {pairs.length === 0 && <li className="text-ink-faint">No data yet.</li>}
        </ul>
      </figure>
    </Card>
  );
}

export function ExpenseCharts() {
  const state = useAppState();
  const byCategory = totalsByCategory(state);
  const byPayment = totalsByPayment(state);
  const [accent, ground] = useFxTokens(['--fx-machine', '--fx-bg']);

  return (
    <section className="mb-8">
      <h2 className="mb-3 mt-0 font-display text-lead font-semibold leading-tight tracking-tight">
        Expense distribution
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Donut
          title="By category"
          data={byCategory}
          accent={accent}
          ground={ground}
          ariaLabel="Pie chart showing expense distribution by category"
        />
        <Donut
          title="By payment method / card"
          data={byPayment}
          accent={accent}
          ground={ground}
          ariaLabel="Pie chart showing expense distribution by payment method or card"
        />
      </div>
    </section>
  );
}
