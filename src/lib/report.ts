import { formatYMD } from './cycle';
import { formatCurrency } from './format';
import { rampAlphas } from './palette';
import {
  computeSummary,
  sumInstallmentRemaining,
  toDataModel,
  topTransactions,
  totalsByCategory,
  totalsByPayment,
} from '@/state/selectors';
import type { AppState, ThemeName } from '@/state/types';
import tokensCss from '../../theme/tokens.css?raw';
import reportCss from './report.css?raw';

/**
 * The cycle report: one self-contained HTML document holding everything the
 * Summary section shows plus every transaction in the four ledgers.
 *
 * It is built as a string rather than rendered from the React tree so that the
 * same document serves both formats — saved as-is for HTML, handed to the
 * browser's print pipeline for PDF — and so that it carries no app code, only
 * the theme tokens and its own stylesheet. Every figure comes from the
 * selectors; nothing is recomputed here.
 */

export type ReportFormat = 'html' | 'pdf';

export interface ReportOptions {
  theme: ThemeName;
  /** Injected so the output is deterministic under test. */
  now?: Date;
}

/** Same families the app loads in index.html; the tokens declare fallbacks if it never arrives. */
const FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&family=Instrument+Serif:ital@0;1&display=swap';

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/**
 * Every user-entered string goes through here. Descriptions can come straight
 * out of a bank CSV, and the PDF path loads this document into a same-origin
 * frame, so unescaped markup would be live markup.
 */
function esc(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => ESCAPES[ch]);
}

const DASH = '<span class="rp-faint">—</span>';

function text(value: string): string {
  return value ? esc(value) : DASH;
}

function tick(validated: boolean): string {
  return validated
    ? '<span class="rp-human" aria-label="Validated">✓</span>'
    : '<span class="rp-faint" aria-label="Not validated">—</span>';
}

function money(value: number, className = 'rp-machine'): string {
  return `<td class="rp-r rp-num ${className}">${formatCurrency(value)}</td>`;
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

function stamp(now: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${formatYMD(now)} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export interface CycleStatus {
  label: string;
  closed: boolean;
}

/**
 * Where "now" sits relative to the cycle. Plain string comparison is enough
 * because both sides are local `YYYY-MM-DD`; the end date counts as closed,
 * since that is the day the statement is cut.
 */
export function cycleStatus(cycleStart: string, cycleEnd: string, now: Date = new Date()): CycleStatus {
  if (!cycleStart || !cycleEnd || cycleStart > cycleEnd) {
    return { label: 'Cycle not set', closed: false };
  }
  const today = formatYMD(now);
  if (today >= cycleEnd) return { label: 'Cycle closed', closed: true };
  if (today < cycleStart) return { label: 'Cycle not started', closed: false };
  return { label: 'Cycle in progress', closed: false };
}

/** Shared by the HTML download and, as the document title, the suggested PDF name. */
export function makeReportBasename(state: Pick<AppState, 'cycleStart' | 'cycleEnd'>): string {
  const span =
    state.cycleStart && state.cycleEnd ? `${state.cycleStart}_to_${state.cycleEnd}` : 'undated';
  return `expense_report_${span}`;
}

function tile(label: string, meta: string, value: string): string {
  return `<div class="rp-panel rp-tile">
  <div><div class="rp-label">${label}</div><div class="rp-meta">${meta}</div></div>
  <div class="rp-value">${value}</div>
</div>`;
}

function humanTile(label: string, meta: string, value: number): string {
  return `<div class="rp-panel rp-panel--human rp-tile">
  <div><div class="rp-label">${label}</div><div class="rp-meta">${meta}</div></div>
  <div class="rp-value rp-human">${formatCurrency(value)}</div>
</div>`;
}

/**
 * The report is the cycle looked back on, so the forward-looking figures the
 * live summary leads with — remaining budget, per day, days remaining — are
 * left out, and the savings figure is labelled as what was saved rather than
 * as a target.
 */
function summarySection(state: AppState): string {
  const s = computeSummary(state);

  return `<section class="rp-section">
<h2>Summary</h2>
<div class="rp-grid rp-grid--2">
  ${humanTile('Expected income', 'Take-home or budgeted income for this cycle', parseFloat(state.expectedIncome) || 0)}
  ${humanTile('Saved', 'Set aside this cycle', s.projectedSavings)}
</div>
<div class="rp-grid rp-grid--4">
  ${tile('Card bill', 'Credit card expenses', formatCurrency(s.cardTotal))}
  ${tile('Installments', 'Monthly amounts', formatCurrency(s.monthlyInstallments))}
  ${tile('Fixed costs', 'Recurring obligations', formatCurrency(s.fixedCosts))}
  ${tile('Cash', 'Cash, transfer, wallet', formatCurrency(s.cashExpenses))}
</div>
</section>`;
}

/** Donut drawn as dashed circle strokes: one circle per slice, offset along a path of length 100. */
function donut(shares: number[], alphas: number[]): string {
  const ring = 'cx="60" cy="60" r="40" stroke-width="22"';
  if (shares.length === 0) {
    return `<svg class="rp-donut" viewBox="0 0 120 120" aria-hidden="true"><circle class="rp-donut__empty" ${ring} stroke-dasharray="2 3"/></svg>`;
  }
  const gap = shares.length > 1 ? 0.7 : 0;
  let offset = 0;
  const arcs = shares
    .map((share, i) => {
      const length = Math.max(share * 100 - gap, 0.1);
      const arc = `<circle ${ring} pathLength="100" stroke-opacity="${alphas[i].toFixed(3)}" stroke-dasharray="${length.toFixed(3)} 100" stroke-dashoffset="${(-offset).toFixed(3)}" transform="rotate(-90 60 60)"/>`;
      offset += share * 100;
      return arc;
    })
    .join('');
  return `<svg class="rp-donut" viewBox="0 0 120 120" aria-hidden="true">${arcs}</svg>`;
}

/**
 * One distribution: donut plus the table that carries its numbers. Configured
 * names are listed even at zero (as the app's totals tables do); names that
 * only survive on old rows are listed too, so the column always adds up.
 */
function distribution(title: string, column: string, configured: string[], totals: Record<string, number>): string {
  const names = [...new Set([...configured, ...Object.keys(totals)])];
  const rows = names
    .map((name) => ({ name, value: totals[name] || 0 }))
    .filter((row) => row.name || row.value)
    .sort((a, b) => b.value - a.value);
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  const slices = rows.filter((row) => row.value > 0);
  const alphas = rampAlphas(slices.length);

  const body = rows
    .map((row, i) => {
      const swatch =
        row.value > 0
          ? `<span class="rp-swatch" style="opacity:${alphas[i].toFixed(3)}"></span>`
          : '<span class="rp-swatch" style="visibility:hidden"></span>';
      const share = total > 0 && row.value > 0 ? `${((row.value / total) * 100).toFixed(1)}%` : '—';
      return `<tr><td class="rp-desc"><span class="rp-key">${swatch}<span>${row.name ? esc(row.name) : '(Uncategorized)'}</span></span></td>${money(row.value)}<td class="rp-r rp-num rp-faint">${share}</td></tr>`;
    })
    .join('');

  return `<div class="rp-panel rp-panel--machine">
  <h3>${title}</h3>
  <div class="rp-dist">
    ${donut(total > 0 ? slices.map((row) => row.value / total) : [], alphas)}
    ${
      rows.length === 0
        ? '<p class="rp-empty">Nothing defined yet.</p>'
        : `<table>
      <thead><tr><th>${column}</th><th class="rp-r">Total</th><th class="rp-r">Share</th></tr></thead>
      <tbody>${body}</tbody>
      <tfoot><tr><td class="rp-label">Total</td>${money(total)}<td></td></tr></tfoot>
    </table>`
    }
  </div>
</div>`;
}

function topSection(state: AppState): string {
  const rows = topTransactions(state, 10);
  const body = rows
    .map(
      (row, i) => `<tr>
  <td class="rp-idx">${String(i + 1).padStart(2, '0')}</td>
  <td><span class="rp-tag ${row.source === 'installment' ? 'rp-tag--thought' : ''}">${row.source === 'installment' ? 'Installment' : 'Card'}</span></td>
  <td class="rp-desc">${row.description ? esc(row.description) : '<span class="rp-faint">(no description)</span>'}${row.meta ? `<div class="rp-meta">${esc(row.meta)}</div>` : ''}</td>
  <td>${text(row.category)}</td>
  <td>${text(row.paymentOrCard)}</td>
  <td class="rp-c">${tick(row.validated)}</td>
  ${money(row.amount)}
</tr>`,
    )
    .join('');

  return `<section class="rp-section">
<h2>Top 10 transactions</h2>
<div class="rp-panel rp-panel--machine rp-panel--table">
${
  rows.length === 0
    ? '<p class="rp-empty">No card expenses or installments recorded in this cycle.</p>'
    : `<table>
  <thead><tr><th>#</th><th>Source</th><th>Description</th><th>Category</th><th>Card / method</th><th class="rp-c">Validated</th><th class="rp-r">Amount</th></tr></thead>
  <tbody>${body}</tbody>
</table>`
}
</div>
</section>`;
}

function ledger(title: string, count: number, emptyNote: string, head: string, body: string, foot: string): string {
  return `<section class="rp-section">
<h2>${title}<span class="rp-label rp-num">${plural(count, 'row')}</span></h2>
<div class="rp-panel rp-panel--table">
${
  count === 0
    ? `<p class="rp-empty">${emptyNote}</p>`
    : `<table>
  <thead><tr>${head}</tr></thead>
  <tbody>${body}</tbody>
  <tfoot><tr>${foot}</tr></tfoot>
</table>`
}
</div>
</section>`;
}

function idx(i: number): string {
  return `<td class="rp-idx">${String(i + 1).padStart(2, '0')}</td>`;
}

function ledgerSections(state: AppState): string {
  // toDataModel already applies the "drop fully blank rows" rule, so the report
  // lists exactly what an export would hold.
  const data = toDataModel(state);
  const summary = computeSummary(state);

  const expenses = ledger(
    'Credit card expenses',
    data.expenses.length,
    'No credit card expenses recorded.',
    '<th>#</th><th>Description</th><th>Category</th><th>Card</th><th class="rp-c">Validated</th><th class="rp-r">Amount</th>',
    data.expenses
      .map(
        (e, i) =>
          `<tr>${idx(i)}<td class="rp-desc">${text(e.description)}</td><td>${text(e.category)}</td><td>${text(e.payment)}</td><td class="rp-c">${tick(e.validated)}</td>${money(e.amount || 0)}</tr>`,
      )
      .join(''),
    `<td colspan="5" class="rp-label rp-r">Total</td>${money(summary.cardTotal)}`,
  );

  const installments = ledger(
    'Installments &amp; monthly bills',
    data.installments.length,
    'No installments recorded.',
    '<th>#</th><th>Description</th><th>Card</th><th class="rp-r">Months left</th><th class="rp-r">Total remaining</th><th class="rp-c">Validated</th><th class="rp-r">Monthly</th>',
    data.installments
      .map(
        (inst, i) =>
          `<tr>${idx(i)}<td class="rp-desc">${text(inst.description)}</td><td>${text(inst.card)}</td><td class="rp-r rp-num">${inst.remainingMonths || 0}</td>${money((inst.amount || 0) * (inst.remainingMonths || 0), '')}<td class="rp-c">${tick(inst.validated)}</td>${money(inst.amount || 0)}</tr>`,
      )
      .join(''),
    `<td colspan="4" class="rp-label rp-r">Totals</td>${money(sumInstallmentRemaining(state))}<td></td>${money(summary.monthlyInstallments)}`,
  );

  const fixed = ledger(
    'Fixed monthly costs',
    data.fixedCosts.length,
    'No fixed costs recorded.',
    '<th>#</th><th>Description</th><th class="rp-c">Validated</th><th class="rp-r">Amount</th>',
    data.fixedCosts
      .map(
        (f, i) =>
          `<tr>${idx(i)}<td class="rp-desc">${text(f.description)}</td><td class="rp-c">${tick(f.validated)}</td>${money(f.amount || 0)}</tr>`,
      )
      .join(''),
    `<td colspan="3" class="rp-label rp-r">Total</td>${money(summary.fixedCosts)}`,
  );

  const cash = ledger(
    'Cash expenses',
    data.cashExpenses.length,
    'No cash expenses recorded.',
    '<th>#</th><th>Description</th><th>Category</th><th>Method</th><th class="rp-r">Amount</th>',
    data.cashExpenses
      .map(
        (c, i) =>
          `<tr>${idx(i)}<td class="rp-desc">${text(c.description)}</td><td>${text(c.category)}</td><td>${text(c.paymentMethod)}</td>${money(c.amount || 0)}</tr>`,
      )
      .join(''),
    `<td colspan="4" class="rp-label rp-r">Total</td>${money(summary.cashExpenses)}`,
  );

  return expenses + installments + fixed + cash;
}

function marker(label: string): string {
  return `<div class="rp-marker"><p class="rp-eyebrow">${label}</p><hr></div>`;
}

export function buildReportHtml(state: AppState, options: ReportOptions): string {
  const now = options.now ?? new Date();
  const status = cycleStatus(state.cycleStart, state.cycleEnd, now);
  const summary = computeSummary(state);
  const data = toDataModel(state);
  const rowCount =
    data.expenses.length + data.installments.length + data.fixedCosts.length + data.cashExpenses.length;
  const cycle = `${esc(state.cycleStart || '…')} → ${esc(state.cycleEnd || '…')}`;
  const dot = '<span class="rp-dot" aria-hidden="true"></span>';

  // An open cycle is still a valid report, but the reader should not mistake
  // a mid-cycle snapshot for the final statement.
  const lead = status.closed
    ? `Final figures for the ${plural(summary.totalDays, 'day')} of this billing cycle.`
    : `Snapshot taken with ${plural(summary.daysRemaining, 'day')} of the cycle still to run; figures are to date, not final.`;

  return `<!doctype html>
<html lang="en"${options.theme === 'light' ? ' data-fx-theme="light"' : ''}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${esc(makeReportBasename(state))}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS_HREF}">
<style>
${tokensCss}
${reportCss}
</style>
</head>
<body>
<table class="rp-frame" role="presentation">
<thead class="rp-gutter"><tr><td></td></tr></thead>
<tbody><tr><td>
<main class="rp-shell">
<header>
  <p class="rp-eyebrow">Cycle report${dot}<span class="rp-num">${cycle}</span>${dot}${status.label}</p>
  <h1 class="rp-title">Where the cycle <em>went</em></h1>
  <p class="rp-lead">${lead}</p>
</header>

${marker('Summary')}
${summarySection(state)}
<section class="rp-section">
<h2>Expense distribution</h2>
<div class="rp-grid rp-grid--2">
  ${distribution('By category', 'Category', state.categories, totalsByCategory(state))}
  ${distribution('By payment method / card', 'Card', state.cardPaymentMethods, totalsByPayment(state))}
</div>
</section>
${topSection(state)}

${marker('Transactions')}
${ledgerSections(state)}

<footer class="rp-footer">
  <span>Generated ${stamp(now)}</span>${dot}
  <span class="rp-num">${plural(rowCount, 'row')}</span>
  <span class="rp-footer__end">Personal Expense Manager</span>
</footer>
</main>
</td></tr></tbody>
<tfoot class="rp-gutter"><tr><td></td></tr></tfoot>
</table>
</body>
</html>
`;
}
