import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/format';
import { useAppState } from '@/state/AppContext';
import { totalsByCategory, totalsByPayment } from '@/state/selectors';

function TotalsPanel({
  title,
  column,
  keys,
  totals,
}: {
  title: string;
  column: string;
  keys: string[];
  totals: Record<string, number>;
}) {
  return (
    <Card className="border-l-bar border-l-machine p-4 pl-5">
      <h3 className="mb-3 mt-0 font-display text-body font-semibold leading-tight tracking-tight">
        {title}
      </h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{column}</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {keys.map((k) => (
            <TableRow key={k}>
              <TableCell className="text-small">{k}</TableCell>
              <TableCell className="fx-figure text-right text-small text-machine">
                {formatCurrency(totals[k] || 0)}
              </TableCell>
            </TableRow>
          ))}
          {keys.length === 0 && (
            <TableRow>
              <TableCell colSpan={2} className="text-small text-ink-faint">
                Nothing defined yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}

export function SummaryTables() {
  const state = useAppState();
  const byCategory = totalsByCategory(state);
  const byPayment = totalsByPayment(state);

  return (
    <section className="mb-8 grid gap-4 sm:grid-cols-2">
      <TotalsPanel
        title="Totals by category"
        column="Category"
        keys={state.categories}
        totals={byCategory}
      />
      <TotalsPanel
        title="Totals by payment method / card"
        column="Payment method / card"
        keys={state.cardPaymentMethods}
        totals={byPayment}
      />
    </section>
  );
}
