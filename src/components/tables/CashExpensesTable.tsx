import { Trash2 } from 'lucide-react';
import { AmountInput } from '@/components/AmountInput';
import { OptionSelect } from '@/components/OptionSelect';
import { SectionHeader } from '@/components/SectionHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/format';
import { useAppDispatch, useAppState } from '@/state/AppContext';
import { sumCashExpenses } from '@/state/selectors';

export function CashExpensesTable() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const total = sumCashExpenses(state);

  return (
    <section className="mb-8">
      <SectionHeader title="Cash Expenses" anchor="cash-bottom" />
      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-32 text-right">Amount</TableHead>
              <TableHead className="w-40">Payment Method</TableHead>
              <TableHead className="w-40">Category</TableHead>
              <TableHead className="w-16 text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.cashExpenses.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="text-xs text-muted-foreground">{c.id}</TableCell>
                <TableCell>
                  <Input
                    value={c.description}
                    placeholder="Description"
                    className="h-8 text-xs"
                    onChange={(ev) =>
                      dispatch({
                        type: 'UPDATE_CASH',
                        id: c.id,
                        patch: { description: ev.target.value },
                      })
                    }
                  />
                </TableCell>
                <TableCell>
                  <AmountInput
                    value={c.amount}
                    onCommit={(v) =>
                      dispatch({ type: 'UPDATE_CASH', id: c.id, patch: { amount: v } })
                    }
                  />
                </TableCell>
                <TableCell>
                  <OptionSelect
                    value={c.paymentMethod}
                    options={state.cashPaymentMethods}
                    onChange={(v) =>
                      dispatch({ type: 'UPDATE_CASH', id: c.id, patch: { paymentMethod: v } })
                    }
                    ariaLabel="Payment method"
                  />
                </TableCell>
                <TableCell>
                  <OptionSelect
                    value={c.category}
                    options={state.categories}
                    onChange={(v) =>
                      dispatch({ type: 'UPDATE_CASH', id: c.id, patch: { category: v } })
                    }
                    ariaLabel="Category"
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="h-8 w-8"
                    aria-label="Delete row"
                    onClick={() => dispatch({ type: 'DELETE_ROW', table: 'cashExpenses', id: c.id })}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableHead colSpan={2} className="bg-footer text-right">
                Total:
              </TableHead>
              <TableHead className="bg-footer text-right tabular-nums">
                {formatCurrency(total)}
              </TableHead>
              <TableHead className="bg-footer" />
              <TableHead className="bg-footer" />
              <TableHead className="bg-footer" />
            </TableRow>
          </TableFooter>
        </Table>
      </div>
      <div id="cash-bottom" className="mt-2">
        <Button size="sm" onClick={() => dispatch({ type: 'ADD_ROW', table: 'cashExpenses' })}>
          Add Cash Expense
        </Button>
      </div>
    </section>
  );
}
