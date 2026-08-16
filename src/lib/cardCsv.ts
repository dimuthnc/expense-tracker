/**
 * Parser for the "unbilled transactions" CSV that DBS/POSB internet banking exports.
 *
 * The file is not a plain table: five preamble lines carry the card label and statement date,
 * then a header row, then the transactions. Everything here is tolerant by design — a line the
 * bank formats unexpectedly is reported as a skipped row rather than failing the whole import.
 */

export interface CardTransaction {
  /** Position in the file, used to keep repeated identical charges in a stable order. */
  index: number;
  /** Transaction date as local `YYYY-MM-DD`, or '' when the cell could not be parsed. */
  date: string;
  /** Raw date cell, kept for error messages when `date` is ''. */
  rawDate: string;
  description: string;
  status: string;
  /** Positive charge amount. 0 for credit (refund/payment) lines. */
  debit: number;
  credit: number;
}

export interface ParsedCardCsv {
  /** Card label from the preamble, e.g. "DBS/POSB MasterCard Platinum 5520-…". */
  cardLabel: string;
  /** "Transactions as at" date, as printed by the bank. */
  statementDate: string;
  transactions: CardTransaction[];
  /** Set when the file could not be recognised at all; `transactions` is then empty. */
  error?: string;
}

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

/** Minimal RFC 4180 tokenizer: handles quoted cells, escaped `""`, and CR/LF inside quotes. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      quoted = true;
    } else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\r') {
      // swallow; the \n that follows ends the row
    } else if (ch === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

/** `"15 Aug 2026"` → `"2026-08-15"`. Built from parts so the date never shifts by timezone. */
export function parseStatementDate(input: string): string {
  const m = input.trim().match(/^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})$/);
  if (!m) return '';
  const month = MONTHS[m[2].slice(0, 3).toLowerCase()];
  if (!month) return '';
  const day = Number(m[1]);
  if (day < 1 || day > 31) return '';
  return `${m[3]}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseAmount(input: string): number {
  const cleaned = input.replace(/[,\s]/g, '');
  if (!cleaned) return 0;
  const n = Number(cleaned);
  return Number.isFinite(n) ? Math.abs(n) : 0;
}

function cell(row: string[], i: number): string {
  return (row[i] ?? '').trim();
}

function labelledValue(rows: string[][], label: string): string {
  const found = rows.find((r) => cell(r, 0).toLowerCase().startsWith(label.toLowerCase()));
  return found ? cell(found, 1) : '';
}

export function parseCardCsv(text: string): ParsedCardCsv {
  const rows = parseCsv(text).filter((r) => r.some((c) => c.trim() !== ''));
  const empty: ParsedCardCsv = { cardLabel: '', statementDate: '', transactions: [] };

  if (rows.length === 0) return { ...empty, error: 'The file is empty.' };

  // Locate the transaction header rather than assuming a fixed preamble length — the bank
  // adds or drops summary lines (credit limit, cash advance limit) between card products.
  const headerIndex = rows.findIndex((r) => cell(r, 0).toLowerCase() === 'transaction date');
  if (headerIndex === -1) {
    return {
      ...empty,
      error:
        'No "Transaction Date" header found. Export the unbilled transactions as CSV from DBS/POSB internet banking and import that file unchanged.',
    };
  }

  const header = rows[headerIndex].map((c) => c.trim().toLowerCase());
  const col = (name: string, fallback: number) => {
    const i = header.indexOf(name);
    return i === -1 ? fallback : i;
  };
  const dateCol = col('transaction date', 0);
  const descCol = col('transaction description', 2);
  const statusCol = col('transaction status', 5);
  const debitCol = col('debit amount', 6);
  const creditCol = col('credit amount', 7);

  const transactions: CardTransaction[] = [];
  for (let i = headerIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    const rawDate = cell(row, dateCol);
    const description = cell(row, descCol).replace(/\s+/g, ' ');
    const debit = parseAmount(cell(row, debitCol));
    const credit = parseAmount(cell(row, creditCol));
    // Trailing totals or footers carry neither a description nor an amount.
    if (!rawDate && !description && !debit && !credit) continue;
    transactions.push({
      index: transactions.length,
      date: parseStatementDate(rawDate),
      rawDate,
      description,
      status: cell(row, statusCol),
      debit,
      credit,
    });
  }

  return {
    cardLabel: labelledValue(rows, 'Card Transaction Details For'),
    statementDate: labelledValue(rows, 'Transactions as at'),
    transactions,
  };
}
