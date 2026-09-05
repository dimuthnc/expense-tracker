import { Check } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { useAppState } from '@/state/AppContext';
import { topTransactions, type TopTransactionSource } from '@/state/selectors';

const SOURCE_LABEL: Record<TopTransactionSource, string> = {
  expense: 'Card',
  installment: 'Installment',
};

function SourceTag({ source }: { source: TopTransactionSource }) {
  return (
    <span className={cn('fx-tag', source === 'installment' && 'fx-tag--thought')}>
      {SOURCE_LABEL[source]}
    </span>
  );
}

export function TopTransactions() {
  const state = useAppState();
  const rows = topTransactions(state, 10);

  return (
    <section className="mb-8">
      <h2 className="mb-3 mt-0 font-display text-lead font-semibold leading-tight tracking-tight">
        Top 10 transactions
      </h2>
      <Card className="border-l-bar border-l-machine p-4 pl-5">
        {rows.length === 0 ? (
          <p className="m-0 text-small text-ink-dim">
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
                <TableHead className="w-32">Card / method</TableHead>
                <TableHead className="w-24 text-center">Validated</TableHead>
                <TableHead className="w-32 text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, idx) => (
                <TableRow key={row.key}>
                  <TableCell className="fx-figure font-mono text-micro text-ink-faint">
                    {String(idx + 1).padStart(2, '0')}
                  </TableCell>
                  <TableCell>
                    <SourceTag source={row.source} />
                  </TableCell>
                  <TableCell className="text-small">
                    <div className="truncate">
                      {row.description || <span className="text-ink-faint">(no description)</span>}
                    </div>
                    {row.meta && <div className="text-micro text-ink-faint">{row.meta}</div>}
                  </TableCell>
                  <TableCell className="text-small">
                    {row.category || <span className="text-ink-faint">—</span>}
                  </TableCell>
                  <TableCell className="text-small">
                    {row.paymentOrCard || <span className="text-ink-faint">—</span>}
                  </TableCell>
                  <TableCell className="text-center">
                    {row.validated ? (
                      <Check className="mx-auto h-4 w-4 text-human" aria-label="Validated" />
                    ) : (
                      <span className="text-micro text-ink-faint" aria-label="Not validated">
                        —
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="fx-figure text-right text-small font-semibold text-machine">
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
