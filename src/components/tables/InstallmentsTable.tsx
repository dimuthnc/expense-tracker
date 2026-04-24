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
import { sumInstallmentMonthly, sumInstallmentRemaining } from '@/state/selectors';

export function InstallmentsTable() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const monthly = sumInstallmentMonthly(state);
  const remaining = sumInstallmentRemaining(state);

  return (
    <section className="mb-8">
      <SectionHeader title="Installations and Monthly Bills" anchor="installments-bottom" />
      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-32 text-right">Amount</TableHead>
              <TableHead className="w-32 text-right">Remaining Months</TableHead>
              <TableHead className="w-40">Card</TableHead>
              <TableHead className="w-36 text-right">Total Remaining</TableHead>
              <TableHead className="w-24 text-center">Validated</TableHead>
              <TableHead className="w-16 text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.installments.map((i) => {
              const totalRemaining = (i.amount || 0) * (i.remainingMonths || 0);
              return (
                <TableRow key={i.id}>
                  <TableCell className="text-xs text-muted-foreground">{i.id}</TableCell>
                  <TableCell>
                    <Input
                      value={i.description}
                      placeholder="Description"
                      className="h-8 text-xs"
                      onChange={(ev) =>
                        dispatch({
                          type: 'UPDATE_INSTALLMENT',
                          id: i.id,
                          patch: { description: ev.target.value },
                        })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <AmountInput
                      value={i.amount}
                      onCommit={(v) =>
                        dispatch({ type: 'UPDATE_INSTALLMENT', id: i.id, patch: { amount: v } })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <AmountInput
                      value={i.remainingMonths}
                      integer
                      placeholder="0"
                      onCommit={(v) =>
                        dispatch({
                          type: 'UPDATE_INSTALLMENT',
                          id: i.id,
                          patch: { remainingMonths: v },
                        })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <OptionSelect
                      value={i.card}
                      options={state.cardPaymentMethods}
                      onChange={(v) =>
                        dispatch({ type: 'UPDATE_INSTALLMENT', id: i.id, patch: { card: v } })
                      }
                      ariaLabel="Card"
                    />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(totalRemaining)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={i.validated}
                      aria-label={i.validated ? 'Validated' : 'Not validated'}
                      title={i.validated ? 'Validated' : 'Not validated'}
                      onChange={(ev) =>
                        dispatch({
                          type: 'UPDATE_INSTALLMENT',
                          id: i.id,
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
                      onClick={() =>
                        dispatch({ type: 'DELETE_ROW', table: 'installments', id: i.id })
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableHead colSpan={2} className="bg-footer text-right">
                Totals:
              </TableHead>
              <TableHead className="bg-footer text-right tabular-nums">
                {formatCurrency(monthly)}
              </TableHead>
              <TableHead className="bg-footer" />
              <TableHead className="bg-footer" />
              <TableHead className="bg-footer text-right tabular-nums">
                {formatCurrency(remaining)}
              </TableHead>
              <TableHead className="bg-footer" />
              <TableHead className="bg-footer" />
            </TableRow>
          </TableFooter>
        </Table>
      </div>
      <div id="installments-bottom" className="mt-2">
        <Button size="sm" onClick={() => dispatch({ type: 'ADD_ROW', table: 'installments' })}>
          Add Item
        </Button>
      </div>
    </section>
  );
}
