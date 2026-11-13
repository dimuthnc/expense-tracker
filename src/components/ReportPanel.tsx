import { useState } from 'react';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { downloadBlob, printHtml } from '@/lib/io';
import {
  buildReportHtml,
  cycleStatus,
  makeReportBasename,
  type ReportFormat,
} from '@/lib/report';
import { cn } from '@/lib/utils';
import { useAppState } from '@/state/AppContext';
import { computeSummary } from '@/state/selectors';
import type { ThemeName } from '@/state/types';

const FORMATS: { value: ReportFormat; label: string; hint: string }[] = [
  { value: 'html', label: 'HTML', hint: 'Downloads a single self-contained file.' },
  {
    value: 'pdf',
    label: 'PDF',
    hint: 'Opens the print dialog; choose “Save as PDF” as the destination.',
  },
];

// Read at click time rather than through useTheme: that hook keeps its own
// state per caller, while <html> is what the user is actually looking at.
function currentTheme(): ThemeName {
  return document.documentElement.getAttribute('data-fx-theme') === 'light' ? 'light' : 'dark';
}

/**
 * Closes the page: once a cycle is done, turn it into a report. The panel is
 * teal because the report is derived; the format choice is amber because it
 * is the one thing here the user decides.
 */
export function ReportPanel() {
  const state = useAppState();
  const [format, setFormat] = useState<ReportFormat>('pdf');
  const status = cycleStatus(state.cycleStart, state.cycleEnd);
  const { daysRemaining } = computeSummary(state);
  const selected = FORMATS.find((f) => f.value === format) ?? FORMATS[0];

  const onGenerate = () => {
    const html = buildReportHtml(state, { theme: currentTheme() });
    const name = makeReportBasename(state);
    if (format === 'html') {
      downloadBlob(`${name}.html`, 'text/html;charset=utf-8', html);
    } else {
      printHtml(html, name);
    }
  };

  return (
    <section className="mb-8" aria-labelledby="report-heading">
      <h2
        id="report-heading"
        className="mb-3 mt-0 font-display text-lead font-semibold leading-tight tracking-tight"
      >
        Cycle report
      </h2>
      <Card className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5 border-l-bar border-l-machine p-5 pl-6">
        <div className="max-w-[62ch]">
          <div className="flex flex-wrap items-center gap-3">
            <span className={cn('fx-tag', status.closed && 'fx-tag--machine')}>{status.label}</span>
            <span className="fx-label fx-figure text-ink-faint">
              {state.cycleStart || '…'} → {state.cycleEnd || '…'}
            </span>
          </div>
          <p className="m-0 mt-3 text-small text-ink-dim">
            Income, savings, totals and distributions, followed by every transaction in the four
            ledgers, in the theme you are using now.
            {!status.closed && daysRemaining > 0 && (
              <>
                {' '}
                This cycle still has {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} to run,
                so a report made today is a snapshot rather than the final statement.
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
          <fieldset className="m-0 min-w-0 border-0 p-0">
            <legend className="fx-label mb-2 p-0">Format</legend>
            <div className="flex gap-2">
              {FORMATS.map((f) => (
                <label
                  key={f.value}
                  className={cn(
                    'fx-tag cursor-pointer has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-1 has-[:focus-visible]:outline-machine',
                    format === f.value && 'fx-tag--human',
                  )}
                >
                  <input
                    type="radio"
                    name="reportFormat"
                    value={f.value}
                    checked={format === f.value}
                    onChange={() => setFormat(f.value)}
                    className="sr-only"
                  />
                  {f.label}
                </label>
              ))}
            </div>
          </fieldset>
          <Button type="button" onClick={onGenerate}>
            <FileText className="h-3.5 w-3.5" />
            Generate report
          </Button>
        </div>

        <p className="m-0 basis-full text-micro text-ink-faint" aria-live="polite">
          {selected.hint}
        </p>
      </Card>
    </section>
  );
}
