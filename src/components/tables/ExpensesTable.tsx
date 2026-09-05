import { useState } from 'react';
import { Copy, Trash2, Upload } from 'lucide-react';
import { AmountInput } from '@/components/AmountInput';
import { ImportCardCsvDialog } from '@/components/ImportCardCsvDialog';
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
  const [importOpen, setImportOpen] = useState(false);

  return (
    <section className="mb-8">
      <SectionHeader
        title="Credit card expenses"
        anchor="expense-bottom"
        meta={`${state.expenses.length} ${state.expenses.length === 1 ? 'row' : 'rows'}`}
      />
      <div className="overflow-hidden rounded border border-rule bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">ID</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-32 text-right">Amount</TableHead>
              <TableHead className="w-40">Category</TableHead>
              <TableHead className="w-44">Payment method / card</TableHead>
              <TableHead className="w-24 text-center">Validated</TableHead>
              <TableHead className="w-16 text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.expenses.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="fx-figure font-mono text-micro text-ink-faint">{e.id}</TableCell>
                <TableCell>
                  <Input
                    value={e.description}
                    placeholder="Description"
                    className="h-8"
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
                    variant="ghost"
                    className="h-8 w-8 text-ink-faint hover:bg-signal-wash hover:text-signal"
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
              <TableCell className="bg-footer fx-figure px-3 text-right font-display text-small font-semibold text-machine">{formatCurrency(total)}</TableCell>
              <TableCell className="bg-footer" />
              <TableCell className="bg-footer" />
              <TableCell className="bg-footer" />
              <TableCell className="bg-footer" />
            </TableRow>
          </TableFooter>
        </Table>
      </div>
      <div id="expense-bottom" className="mt-3 flex flex-wrap gap-2">
        <Button
          id="addRowBtn"
          size="sm"
          onClick={() => dispatch({ type: 'ADD_ROW', table: 'expenses' })}
        >
          Add Expense
        </Button>
        <Button
          id="duplicateRowBtn"
          size="sm"
          variant="outline"
          title="Copy the last row into a new one"
          onClick={() => dispatch({ type: 'DUPLICATE_LAST_EXPENSE' })}
        >
          <Copy className="mr-1.5 h-3.5 w-3.5" />
          Add Duplicate Row
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setImportOpen(true)}>
          <Upload className="mr-1.5 h-3.5 w-3.5" />
          Import CSV
        </Button>
      </div>
      <ImportCardCsvDialog open={importOpen} onClose={() => setImportOpen(false)} />
    </section>
  );
}
