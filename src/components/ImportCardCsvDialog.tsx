import { useEffect, useMemo, useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { OptionSelect } from '@/components/OptionSelect';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/format';
import { readFileAsText } from '@/lib/io';
import { parseCardCsv, type ParsedCardCsv } from '@/lib/cardCsv';
import {
  buildImportPlan,
  collectImportKeys,
  toExpenseRows,
  type ImportRowStatus,
} from '@/lib/importPlan';
import { useAppDispatch, useAppState } from '@/state/AppContext';

interface ImportCardCsvDialogProps {
  open: boolean;
  onClose: () => void;
}

const STATUS_LABEL: Record<ImportRowStatus, string> = {
  new: 'Will import',
  duplicate: 'Already imported',
  'outside-cycle': 'Outside cycle',
  credit: 'Refund / payment',
  invalid: 'Skipped',
};

const STATUS_CLASS: Record<ImportRowStatus, string> = {
  new: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  duplicate: 'bg-muted text-muted-foreground',
  'outside-cycle': 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  credit: 'bg-sky-500/15 text-sky-700 dark:text-sky-400',
  invalid: 'bg-destructive/15 text-destructive',
};

/** Pick the payment method whose name looks like the card in the CSV, e.g. "DBS/POSB …" → "DBS". */
function guessCard(cardLabel: string, options: string[]): string | undefined {
  const label = cardLabel.toLowerCase();
  return options.find((o) => o && label.includes(o.toLowerCase()));
}

export function ImportCardCsvDialog({ open, onClose }: ImportCardCsvDialogProps) {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const [fileName, setFileName] = useState('');
  const [parsed, setParsed] = useState<ParsedCardCsv | null>(null);
  const [readError, setReadError] = useState('');
  const [card, setCard] = useState('');
  const [category, setCategory] = useState('');
  const [dragging, setDragging] = useState(false);

  // Reset on every open so a previous import's file never lingers in the dialog.
  useEffect(() => {
    if (!open) return;
    setFileName('');
    setParsed(null);
    setReadError('');
    setDragging(false);
    setCard(state.cardPaymentMethods[0] ?? '');
    setCategory(
      state.categories.find((c) => c.toLowerCase() === 'other') ?? state.categories[0] ?? '',
    );
    // Intentionally keyed on `open` only: reopening should not re-seed while the user edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // An open Radix select portals outside this panel and handles Escape itself; closing the
      // whole dialog on the same keypress would throw away the file the user just picked.
      if (document.querySelector('[data-radix-popper-content-wrapper]')) return;
      onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  const plan = useMemo(() => {
    if (!parsed || parsed.error) return null;
    return buildImportPlan({
      parsed,
      card,
      cycleStart: state.cycleStart,
      cycleEnd: state.cycleEnd,
      existingKeys: collectImportKeys(state.expenses),
    });
  }, [parsed, card, state.cycleStart, state.cycleEnd, state.expenses]);

  if (!open) return null;

  const loadFile = async (file: File) => {
    setFileName(file.name);
    setReadError('');
    try {
      const text = await readFileAsText(file);
      const result = parseCardCsv(text);
      setParsed(result);
      const guess = guessCard(result.cardLabel, state.cardPaymentMethods);
      if (guess) setCard(guess);
    } catch {
      setParsed(null);
      setReadError('That file could not be read.');
    }
  };

  const onImport = () => {
    if (!plan || plan.newRows.length === 0) return;
    dispatch({ type: 'IMPORT_EXPENSES', rows: toExpenseRows(plan, card, category) });
    onClose();
  };

  const counts = plan?.counts;
  const newCount = plan?.newRows.length ?? 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-csv-title"
        tabIndex={-1}
        className="w-full max-w-3xl rounded-lg border bg-card shadow-lg outline-none"
      >
        <div className="flex items-start justify-between gap-4 border-b px-4 py-3">
          <div>
            <h2 id="import-csv-title" className="text-base font-semibold">
              Import card transactions
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Upload the unbilled transactions CSV from your bank. Transactions already imported
              are skipped automatically.
            </p>
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0"
            aria-label="Close"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="px-4 py-3">
          {!parsed && (
            <div
              className={`flex flex-col items-center justify-center rounded-lg border border-dashed px-4 py-10 text-center transition-colors ${
                dragging ? 'border-primary bg-accent' : 'border-border'
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) loadFile(file);
              }}
            >
              <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
              <p className="text-sm">Drop the CSV here, or</p>
              <Button
                type="button"
                size="sm"
                className="mt-2"
                onClick={() => fileRef.current?.click()}
              >
                Choose file
              </Button>
              {readError && <p className="mt-3 text-xs text-destructive">{readError}</p>}
            </div>
          )}

          {parsed?.error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3">
              <p className="text-sm font-medium text-destructive">{fileName}</p>
              <p className="mt-1 text-xs text-destructive">{parsed.error}</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => fileRef.current?.click()}
              >
                Choose another file
              </Button>
            </div>
          )}

          {parsed && !parsed.error && plan && (
            <>
              <div className="surface-alt flex flex-wrap items-center justify-between gap-2 rounded-md p-3 text-xs">
                <div className="min-w-0">
                  <p className="truncate font-medium">{parsed.cardLabel || fileName}</p>
                  <p className="text-muted-foreground">
                    {fileName}
                    {parsed.statementDate && ` • as at ${parsed.statementDate}`} •{' '}
                    {parsed.transactions.length} line
                    {parsed.transactions.length === 1 ? '' : 's'}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => fileRef.current?.click()}
                >
                  Change file
                </Button>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block text-xs">
                  <span className="mb-1 block font-medium">Credit card</span>
                  <OptionSelect
                    value={card}
                    options={state.cardPaymentMethods}
                    onChange={setCard}
                    ariaLabel="Credit card"
                    className="h-9 w-full text-xs"
                  />
                </label>
                <label className="block text-xs">
                  <span className="mb-1 block font-medium">Category for imported rows</span>
                  <OptionSelect
                    value={category}
                    options={state.categories}
                    onChange={setCategory}
                    ariaLabel="Category for imported rows"
                    className="h-9 w-full text-xs"
                  />
                </label>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                {(Object.keys(STATUS_LABEL) as ImportRowStatus[])
                  .filter((s) => (counts?.[s] ?? 0) > 0)
                  .map((s) => (
                    <span key={s} className={`rounded px-2 py-1 font-medium ${STATUS_CLASS[s]}`}>
                      {counts?.[s]} {STATUS_LABEL[s].toLowerCase()}
                    </span>
                  ))}
              </div>

              <div className="mt-3 max-h-72 overflow-y-auto rounded-md border">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-footer">
                    <tr className="text-left">
                      <th className="px-2 py-1.5 font-medium">Date</th>
                      <th className="px-2 py-1.5 font-medium">Description</th>
                      <th className="px-2 py-1.5 text-right font-medium">Amount</th>
                      <th className="px-2 py-1.5 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plan.rows.map((row, i) => (
                      <tr
                        key={`${row.importKey ?? 'x'}-${i}`}
                        className={`border-t ${row.status === 'new' ? '' : 'text-muted-foreground'}`}
                      >
                        <td className="whitespace-nowrap px-2 py-1.5 tabular-nums">
                          {row.transaction.date || row.transaction.rawDate || '—'}
                        </td>
                        <td className="px-2 py-1.5">{row.transaction.description || '—'}</td>
                        <td className="whitespace-nowrap px-2 py-1.5 text-right tabular-nums">
                          {formatCurrency(row.transaction.debit || row.transaction.credit)}
                        </td>
                        <td className="px-2 py-1.5">
                          <span
                            className={`inline-block rounded px-1.5 py-0.5 ${STATUS_CLASS[row.status]}`}
                            title={row.reason}
                          >
                            {STATUS_LABEL[row.status]}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {plan.rows.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-2 py-4 text-center text-muted-foreground">
                          No transactions found in this file.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {(counts?.['outside-cycle'] ?? 0) > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {counts?.['outside-cycle']} transaction
                  {counts?.['outside-cycle'] === 1 ? ' falls' : 's fall'} outside the current{' '}
                  {state.cycleStart} → {state.cycleEnd} cycle and will not be imported. Switch to
                  that cycle and import the same file again to pick them up.
                </p>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t px-4 py-3">
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {plan
              ? newCount > 0
                ? `${newCount} new transaction${newCount === 1 ? '' : 's'} • ${formatCurrency(plan.newTotal)}`
                : 'Nothing new to import.'
              : 'No file selected.'}
          </p>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" size="sm" disabled={newCount === 0} onClick={onImport}>
              Import {newCount > 0 ? newCount : ''}
            </Button>
          </div>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) loadFile(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}
