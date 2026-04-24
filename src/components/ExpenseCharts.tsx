import { useMemo } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/format';
import { generatePalette } from '@/lib/palette';
import { useAppState } from '@/state/AppContext';
import { totalsByCategory, totalsByPayment } from '@/state/selectors';

interface DonutProps {
  title: string;
  data: Record<string, number>;
  seedHue: number;
  ariaLabel: string;
}

function Donut({ title, data, seedHue, ariaLabel }: DonutProps) {
  const pairs = useMemo(
    () =>
      Object.entries(data)
        .filter(([, v]) => v > 0)
        .sort((a, b) => b[1] - a[1]),
    [data],
  );
  const total = pairs.reduce((s, [, v]) => s + v, 0);
  const palette = useMemo(() => generatePalette(Math.max(pairs.length, 1), seedHue), [pairs.length, seedHue]);
  const chartData = pairs.map(([name, value]) => ({ name, value }));

  return (
    <Card className="flex flex-col items-center p-4">
      <figcaption className="mb-2 text-sm font-semibold">{title}</figcaption>
      <div className="relative h-[260px] w-full" aria-label={ariaLabel} role="img">
        {total > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={95}
                stroke="none"
                isAnimationActive={false}
              >
                {chartData.map((_, idx) => (
                  <Cell key={idx} fill={palette[idx % palette.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full w-full items-center justify-center surface-alt rounded-full text-xs text-muted-foreground">
            No data
          </div>
        )}
      </div>
      <ul className="mt-3 w-full space-y-1.5 text-xs">
        {pairs.map(([label, value], idx) => (
          <li key={label} className="flex items-center gap-2">
            <span
              className="h-3.5 w-3.5 flex-shrink-0 rounded border border-border"
              style={{ background: palette[idx % palette.length] }}
            />
            <span className="flex-1 truncate">{label || '(Uncategorized)'}</span>
            <span className="font-semibold tabular-nums">{formatCurrency(value)}</span>
            <span className="tabular-nums text-muted-foreground">
              {total > 0 ? ((value / total) * 100).toFixed(1) : '0'}%
            </span>
          </li>
        ))}
        {pairs.length === 0 && <li className="text-muted-foreground">No data yet.</li>}
      </ul>
    </Card>
  );
}

export function ExpenseCharts() {
  const state = useAppState();
  const byCategory = totalsByCategory(state);
  const byPayment = totalsByPayment(state);

  return (
    <section className="mb-8">
      <h2 className="mb-3 mt-0 text-lg font-semibold">Expense Distribution</h2>
      <div className="grid gap-6 sm:grid-cols-2">
        <Donut
          title="By Category"
          data={byCategory}
          seedHue={330}
          ariaLabel="Pie chart showing expense distribution by category"
        />
        <Donut
          title="By Payment Method / Card"
          data={byPayment}
          seedHue={210}
          ariaLabel="Pie chart showing expense distribution by payment method or card"
        />
      </div>
    </section>
  );
}
