import { CheckCircle2, CreditCard, Repeat2 } from 'lucide-react';
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
import { topTransactions, type TopTransactionSource } from '@/state/selectors';

const SOURCE_LABEL: Record<TopTransactionSource, string> = {
  expense: 'Credit Card',
  installment: 'Installment',
};

function SourceBadge({ source }: { source: TopTransactionSource }) {
  const Icon = source === 'expense' ? CreditCard : Repeat2;
  return (
    <span className="inline-flex items-center gap-1 rounded-md surface-alt px-2 py-0.5 text-[0.7rem] font-medium">
      <Icon className="h-3 w-3" />
      {SOURCE_LABEL[source]}
    </span>
  );
}

export function TopTransactions() {
  const state = useAppState();
  const rows = topTransactions(state, 10);

  return (
    <section className="mb-8">
      <h2 className="mb-3 mt-0 text-lg font-semibold">Top 10 Transactions</h2>
      <Card className="p-4">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No transactions recorded yet. Add credit card expenses or installments to see them
            ranked here.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead className="w-32">Source</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-32">Category</TableHead>
                <TableHead className="w-32">Card / Method</TableHead>
                <TableHead className="w-24 text-center">Validated</TableHead>
                <TableHead className="w-32 text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, idx) => (
                <TableRow key={row.key}>
                  <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell>
                    <SourceBadge source={row.source} />
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="truncate">{row.description || <span className="text-muted-foreground">(no description)</span>}</div>
                    {row.meta && (
                      <div className="text-[0.7rem] text-muted-foreground">{row.meta}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">
                    {row.category || <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-xs">
                    {row.paymentOrCard || <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-center">
                    {row.validated ? (
                      <CheckCircle2
                        className="mx-auto h-4 w-4 text-emerald-600 dark:text-emerald-400"
                        aria-label="Validated"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground" aria-label="Not validated">
                        —
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-sm font-semibold tabular-nums">
                    {formatCurrency(row.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </section>
  );
}
