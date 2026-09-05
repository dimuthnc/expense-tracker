import { Trash2 } from 'lucide-react';
import { AmountInput } from '@/components/AmountInput';
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
import { sumFixedCosts } from '@/state/selectors';

export function FixedCostsTable() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const total = sumFixedCosts(state);

  return (
    <section className="mb-8">
      <SectionHeader
        title="Fixed costs"
        anchor="fixedcosts-bottom"
        meta={`${state.fixedCosts.length} ${state.fixedCosts.length === 1 ? 'row' : 'rows'}`}
      />
      <div className="overflow-hidden rounded border border-rule bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-32 text-right">Amount</TableHead>
              <TableHead className="w-24 text-center">Validated</TableHead>
              <TableHead className="w-16 text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.fixedCosts.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="fx-figure font-mono text-micro text-ink-faint">{f.id}</TableCell>
                <TableCell>
                  <Input
                    value={f.description}
                    placeholder="Description"
                    className="h-8"
                    onChange={(ev) =>
                      dispatch({
                        type: 'UPDATE_FIXED',
                        id: f.id,
                        patch: { description: ev.target.value },
                      })
                    }
                  />
                </TableCell>
                <TableCell>
                  <AmountInput
                    value={f.amount}
                    onCommit={(v) =>
                      dispatch({ type: 'UPDATE_FIXED', id: f.id, patch: { amount: v } })
                    }
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox
                    checked={f.validated}
                    aria-label={f.validated ? 'Validated' : 'Not validated'}
                    title={f.validated ? 'Validated' : 'Not validated'}
                    onChange={(ev) =>
                      dispatch({
                        type: 'UPDATE_FIXED',
                        id: f.id,
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
                    onClick={() => dispatch({ type: 'DELETE_ROW', table: 'fixedCosts', id: f.id })}
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
            </TableRow>
          </TableFooter>
        </Table>
      </div>
      <div id="fixedcosts-bottom" className="mt-3">
        <Button size="sm" onClick={() => dispatch({ type: 'ADD_ROW', table: 'fixedCosts' })}>
          Add Fixed Cost
        </Button>
      </div>
    </section>
  );
}
