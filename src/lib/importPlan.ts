/**
 * Turns a parsed card CSV into a reviewable import plan.
 *
 * The hard part is that an unbilled export is cumulative: the file pulled on the 29th repeats
 * every transaction from the file pulled on the 22nd. The bank gives no transaction id, so each
 * line is fingerprinted from the fields that never change once a charge exists — card, date,
 * merchant, amount — plus an occurrence number that keeps genuinely repeated charges (same shop,
 * same amount, same day) distinct from re-imports of one charge. The fingerprint is stored on the
 * row as `importKey`, so a later import can skip what is already in the table.
 */

import type { CardTransaction, ParsedCardCsv } from './cardCsv';
import type { Expense } from '@/state/types';

export type ImportRowStatus = 'new' | 'duplicate' | 'outside-cycle' | 'credit' | 'invalid';

export interface ImportRow {
  transaction: CardTransaction;
  status: ImportRowStatus;
  /** Present for rows that carry a usable fingerprint (`new` and `duplicate`). */
  importKey?: string;
  /** Human-readable explanation for everything that is not `new`. */
  reason?: string;
}

export interface ImportPlan {
  rows: ImportRow[];
  counts: Record<ImportRowStatus, number>;
  /** Rows that will actually be added, in file order. */
  newRows: ImportRow[];
  newTotal: number;
}

export interface ImportPlanInput {
  parsed: ParsedCardCsv;
  /** Payment method the rows will be filed under, from `state.cardPaymentMethods`. */
  card: string;
  cycleStart: string;
  cycleEnd: string;
  existingKeys: Set<string>;
}

/**
 * FNV-1a, run twice with different offset bases and concatenated, giving a 64-bit-wide hex
 * digest. Plenty for a few hundred statement lines and short enough to keep exported JSON
 * readable. Not a security hash — nothing here is adversarial.
 */
function fingerprint(input: string): string {
  const hash = (offset: number) => {
    let h = offset;
    for (let i = 0; i < input.length; i++) {
      h ^= input.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h.toString(16).padStart(8, '0');
  };
  return hash(0x811c9dc5) + hash(0x7fffffff);
}

/**
 * Identity of the card itself. The label from the CSV preamble carries the masked card number,
 * so it survives the user picking a different payment-method name on a later import; the chosen
 * name is only a fallback for files without a preamble.
 */
function cardIdentity(parsed: ParsedCardCsv, card: string): string {
  return (parsed.cardLabel || card).trim().toLowerCase();
}

/** Everything a repeat export reproduces byte-for-byte for the same charge. */
function baseKey(cardId: string, t: CardTransaction): string {
  return [cardId, t.date, t.description.trim().toLowerCase(), t.debit.toFixed(2)].join('|');
}

export function buildImportKey(
  parsed: ParsedCardCsv,
  card: string,
  t: CardTransaction,
  occurrence: number,
): string {
  return `dbs1:${fingerprint(`${baseKey(cardIdentity(parsed, card), t)}|#${occurrence}`)}`;
}

export function buildImportPlan({
  parsed,
  card,
  cycleStart,
  cycleEnd,
  existingKeys,
}: ImportPlanInput): ImportPlan {
  const cardId = cardIdentity(parsed, card);
  const seen = new Map<string, number>();

  const rows: ImportRow[] = parsed.transactions.map((t) => {
    if (!t.date) {
      return {
        transaction: t,
        status: 'invalid',
        reason: `Unreadable transaction date "${t.rawDate}"`,
      };
    }
    if (t.debit <= 0) {
      return {
        transaction: t,
        status: t.credit > 0 ? 'credit' : 'invalid',
        reason:
          t.credit > 0
            ? 'Refund or card payment — add it by hand if you track it'
            : 'No debit amount on this line',
      };
    }

    // Occurrence numbering runs over every charge in the file, before any filtering, so a row's
    // fingerprint does not depend on the cycle in force or on where the export was cut off.
    const base = baseKey(cardId, t);
    const occurrence = (seen.get(base) ?? 0) + 1;
    seen.set(base, occurrence);
    const importKey = buildImportKey(parsed, card, t, occurrence);

    if (existingKeys.has(importKey)) {
      return {
        transaction: t,
        status: 'duplicate',
        importKey,
        reason: 'Already imported',
      };
    }
    if (t.date < cycleStart || t.date > cycleEnd) {
      return {
        transaction: t,
        status: 'outside-cycle',
        importKey,
        reason: `Outside the ${cycleStart} → ${cycleEnd} cycle`,
      };
    }
    return { transaction: t, status: 'new', importKey };
  });

  const counts: Record<ImportRowStatus, number> = {
    new: 0,
    duplicate: 0,
    'outside-cycle': 0,
    credit: 0,
    invalid: 0,
  };
  rows.forEach((r) => (counts[r.status] += 1));

  const newRows = rows.filter((r) => r.status === 'new');
  return {
    rows,
    counts,
    newRows,
    newTotal: newRows.reduce((s, r) => s + r.transaction.debit, 0),
  };
}

export function toExpenseRows(
  plan: ImportPlan,
  card: string,
  category: string,
): Omit<Expense, 'id'>[] {
  return plan.newRows.map((r) => ({
    description: r.transaction.description,
    amount: r.transaction.debit,
    category,
    payment: card,
    validated: false,
    importKey: r.importKey,
  }));
}

export function collectImportKeys(expenses: Expense[]): Set<string> {
  const keys = new Set<string>();
  expenses.forEach((e) => {
    if (e.importKey) keys.add(e.importKey);
  });
  return keys;
}
