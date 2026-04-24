import { Trash2 } from 'lucide-react';
import { AmountInput } from '@/components/AmountInput';
import { OptionSelect } from '@/components/OptionSelect';
import { SectionHeader } from '@/components/SectionHeader';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { sumExpenses } from '@/state/selectors';

export function ExpensesTable() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const total = sumExpenses(state);

  return (
    <section className="mb-8">
      <SectionHeader title="Credit Card Expenses" anchor="expense-bottom" />
      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Expense ID</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-32 text-right">Amount</TableHead>
              <TableHead className="w-40">Category</TableHead>
              <TableHead className="w-44">Payment Method / Card</TableHead>
              <TableHead className="w-24 text-center">Validated</TableHead>
              <TableHead className="w-16 text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.expenses.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="text-xs text-muted-foreground">{e.id}</TableCell>
                <TableCell>
                  <Input
                    value={e.description}
                    placeholder="Description"
                    className="h-8 text-xs"
                    onChange={(ev) =>
                      dispatch({
                        type: 'UPDATE_EXPENSE',
                        id: e.id,
                        patch: { description: ev.target.value },
                      })
                    }
                  />
                </TableCell>
                <TableCell>
                  <AmountInput
                    value={e.amount}
                    onCommit={(v) =>
                      dispatch({ type: 'UPDATE_EXPENSE', id: e.id, patch: { amount: v } })
                    }
                  />
                </TableCell>
                <TableCell>
                  <OptionSelect
                    value={e.category}
                    options={state.categories}
                    onChange={(v) =>
                      dispatch({ type: 'UPDATE_EXPENSE', id: e.id, patch: { category: v } })
                    }
                    ariaLabel="Category"
                  />
                </TableCell>
                <TableCell>
                  <OptionSelect
                    value={e.payment}
                    options={state.cardPaymentMethods}
                    onChange={(v) =>
                      dispatch({ type: 'UPDATE_EXPENSE', id: e.id, patch: { payment: v } })
                    }
                    ariaLabel="Payment method"
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox
                    checked={e.validated}
                    aria-label={e.validated ? 'Validated' : 'Not validated'}
                    title={e.validated ? 'Validated' : 'Not validated'}
                    onChange={(ev) =>
                      dispatch({
                        type: 'UPDATE_EXPENSE',
                        id: e.id,
                        patch: { validated: ev.target.checked },
                      })
                    }
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="h-8 w-8"
                    aria-label="Delete row"
                    onClick={() => dispatch({ type: 'DELETE_ROW', table: 'expenses', id: e.id })}
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
              <TableHead className="bg-footer" />
            </TableRow>
          </TableFooter>
        </Table>
      </div>
      <div id="expense-bottom" className="mt-2">
        <Button
          id="addRowBtn"
          size="sm"
          onClick={() => dispatch({ type: 'ADD_ROW', table: 'expenses' })}
        >
          Add Expense
        </Button>
      </div>
    </section>
  );
}
