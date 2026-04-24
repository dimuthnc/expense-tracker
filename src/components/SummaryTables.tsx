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

export function SummaryTables() {
  const state = useAppState();
  const byCategory = totalsByCategory(state);
  const byPayment = totalsByPayment(state);

  return (
    <section className="mb-8 grid gap-6 sm:grid-cols-2">
      <Card className="p-4">
        <h3 className="mb-3 mt-0 text-base font-semibold">Totals by Category</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.categories.map((cat) => (
              <TableRow key={cat}>
                <TableCell className="text-xs">{cat}</TableCell>
                <TableCell className="text-right text-xs tabular-nums">
                  {formatCurrency(byCategory[cat] || 0)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card className="p-4">
        <h3 className="mb-3 mt-0 text-base font-semibold">Totals by Payment Method / Card</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payment Method / Card</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.cardPaymentMethods.map((p) => (
              <TableRow key={p}>
                <TableCell className="text-xs">{p}</TableCell>
                <TableCell className="text-right text-xs tabular-nums">
                  {formatCurrency(byPayment[p] || 0)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </section>
  );
}
