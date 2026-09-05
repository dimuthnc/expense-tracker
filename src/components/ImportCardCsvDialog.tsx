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

// Accent meanings: teal = the machine will act, amber = needs a human decision (change cycle),
// blue = an aside (credits are reported, not acted on), coral = a warning, neutral = nothing to do.
const STATUS_CLASS: Record<ImportRowStatus, string> = {
  new: 'fx-tag fx-tag--machine',
  duplicate: 'fx-tag',
  'outside-cycle': 'fx-tag fx-tag--human',
  credit: 'fx-tag fx-tag--thought',
  invalid: 'fx-tag border-signal-edge bg-signal-wash text-signal',
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
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:items-center"
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
        className="w-full max-w-3xl rounded border border-rule-strong border-l-bar border-l-machine bg-popover outline-none"
      >
        <div className="flex items-start justify-between gap-4 border-b border-rule px-4 py-3">
          <div>
            <h2 id="import-csv-title" className="font-display text-body font-semibold leading-tight tracking-tight">
              Import card transactions
            </h2>
            <p className="mt-1 text-micro text-ink-dim">
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
              className={`flex flex-col items-center justify-center rounded border border-dashed px-4 py-10 text-center transition-colors ${
                dragging ? 'border-machine bg-machine-wash' : 'border-rule-strong'
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
              <Upload className="mb-2 h-6 w-6 text-ink-faint" />
              <p className="text-small text-ink-dim">Drop the CSV here, or</p>
              <Button
                type="button"
                size="sm"
                className="mt-2"
                onClick={() => fileRef.current?.click()}
              >
                Choose file
              </Button>
              {readError && <p className="mt-3 text-micro text-signal">{readError}</p>}
            </div>
          )}

          {parsed?.error && (
            <div className="rounded border border-signal-edge border-l-bar border-l-signal bg-signal-wash p-3">
              <p className="text-small font-medium text-signal">{fileName}</p>
              <p className="mt-1 text-micro text-signal">{parsed.error}</p>
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
              <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-rule bg-surface p-3 text-small">
                <div className="min-w-0">
                  <p className="truncate font-medium">{parsed.cardLabel || fileName}</p>
                  <p className="fx-figure text-micro text-ink-dim">
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
                <label className="block">
                  <span className="fx-label mb-2 block">Credit card</span>
                  <OptionSelect
                    value={card}
                    options={state.cardPaymentMethods}
                    onChange={setCard}
                    ariaLabel="Credit card"
                    className="h-9 w-full"
                  />
                </label>
                <label className="block">
                  <span className="fx-label mb-2 block">Category for imported rows</span>
                  <OptionSelect
                    value={category}
                    options={state.categories}
                    onChange={setCategory}
                    ariaLabel="Category for imported rows"
                    className="h-9 w-full"
                  />
                </label>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {(Object.keys(STATUS_LABEL) as ImportRowStatus[])
                  .filter((s) => (counts?.[s] ?? 0) > 0)
                  .map((s) => (
                    <span key={s} className={STATUS_CLASS[s]}>
                      {counts?.[s]} {STATUS_LABEL[s].toLowerCase()}
                    </span>
                  ))}
              </div>

              <div className="mt-3 max-h-72 overflow-y-auto rounded border border-rule">
                <table className="w-full text-small">
                  <thead className="sticky top-0 bg-popover">
                    <tr className="border-b border-rule-strong text-left">
                      <th className="fx-label px-2 py-2">Date</th>
                      <th className="fx-label px-2 py-2">Description</th>
                      <th className="fx-label px-2 py-2 text-right">Amount</th>
                      <th className="fx-label px-2 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plan.rows.map((row, i) => (
                      <tr
                        key={`${row.importKey ?? 'x'}-${i}`}
                        className={`border-t border-rule ${row.status === 'new' ? '' : 'text-ink-dim'}`}
                      >
                        <td className="fx-figure whitespace-nowrap px-2 py-1.5">
                          {row.transaction.date || row.transaction.rawDate || '—'}
                        </td>
                        <td className="px-2 py-1.5">{row.transaction.description || '—'}</td>
                        <td className="fx-figure whitespace-nowrap px-2 py-1.5 text-right">
                          {formatCurrency(row.transaction.debit || row.transaction.credit)}
                        </td>
                        <td className="px-2 py-1.5">
                          <span
                            className={`${STATUS_CLASS[row.status]} px-1.5 py-0.5`}
                            title={row.reason}
                          >
                            {STATUS_LABEL[row.status]}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {plan.rows.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-2 py-4 text-center text-ink-faint">
                          No transactions found in this file.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {(counts?.['outside-cycle'] ?? 0) > 0 && (
                <p className="mt-3 border-l-bar border-l-human pl-3 text-micro text-ink-dim">
                  {counts?.['outside-cycle']} transaction
                  {counts?.['outside-cycle'] === 1 ? ' falls' : 's fall'} outside the current{' '}
                  {state.cycleStart} → {state.cycleEnd} cycle and will not be imported. Switch to
                  that cycle and import the same file again to pick them up.
                </p>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-rule px-4 py-3">
          <p className="fx-figure text-micro text-ink-dim" aria-live="polite">
            {plan
              ? newCount > 0
                ? `${newCount} new transaction${newCount === 1 ? '' : 's'} • ${formatCurrency(plan.newTotal)}`
                : 'Nothing new to import.'
              : 'No file selected.'}
          </p>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" onClick={onClose}>
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
