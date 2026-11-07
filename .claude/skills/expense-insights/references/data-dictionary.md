# Data dictionary

Export format as written by `toDataModel` in `src/state/selectors.ts`. Keep this in step with AGENTS.md §8.

## Top level

| Field | Type | Meaning |
|-------|------|---------|
| `cycleStart`, `cycleEnd` | `YYYY-MM-DD` | Dates of the cycle, which is one salary's budget. The app defaults to the 15th to the 15th, but both are editable, so a file can differ |
| `expectedIncome` | number | Typed-in income for the cycle; currency is implicit |
| `expectedSavings` | number | Target while open; may be overwritten at close (see SKILL.md) |
| `categories` | string[] | Options configured when exported. Rows can hold values no longer listed |
| `cardPaymentMethods` | string[] | Configured cards |
| `cashPaymentMethods` | string[] | Configured non-card methods |

There is no `schemaVersion`, no export timestamp inside the file, and no row dates. The export time is
in the filename `expense_export_YYYY-MM-DD-HHmm.json`.

## Row tables

| Table | Fields | Meaning |
|-------|--------|---------|
| `expenses` | `description`, `amount`, `category`, `payment`, `validated`, optional `importKey` | One-off card spending in the cycle. `amount` may be negative |
| `installments` | `description`, `amount`, `remainingMonths`, `card`, `validated` | Monthly charges on a card. `amount` is the monthly charge, not the total. `remainingMonths` 0 means open-ended. An `amount` of 0 means the line was paused that cycle |
| `fixedCosts` | `description`, `amount`, `validated` | Monthly non-card outflows |
| `cashExpenses` | `description`, `amount`, `paymentMethod`, `category` | Itemised non-card spending. Has no `validated` |

- `validated`: the user ticked it after checking against a statement. It affects no total. A cycle at or
  near 100% has been reconciled, but a low value doesn't prove it wasn't, as ticking was not always done.
- `importKey`: present (`dbs1:...`) on rows from the bank CSV import. Those rows carry raw bank merchant
  text, sometimes hand-renamed afterwards. The import skips credit lines, so imported cycles can be
  missing refunds.
- Row IDs are not exported. There are no stable identifiers across files, so an installment is tracked
  by its `description`, which may be reworded.

## App formulas

```
cardTotal        = sum(expenses.amount)
installments     = sum(installments.amount)
fixed            = sum(fixedCosts.amount)
remainingBudget  = expectedIncome - cardTotal - installments - fixed - expectedSavings
remainingPerDay  = remainingBudget / daysRemaining, only while the cycle is active
```

Cash expenses are deliberately excluded from `remainingBudget`. In the app, totals by category cover card
expenses only; totals by card cover card expenses plus installments. `totalDays` in the app is inclusive
(`end - start + 1`).

## Loader fields

| Field | Definition |
|-------|-----------|
| `card_net` | Sum of `expenses` including negatives |
| `card_gross`, `credits` | Positive rows only, and negative rows only. `card_net = card_gross + credits` |
| `total_outflow` | `card_net + installments + fixed`. Excludes `cash_logged` |
| `net_saved` | `income - total_outflow` |
| `pass_through` | Rows matching the profile's `Pass-through items`: bought for others and repaid |
| `own_outflow`, `net_saved_own` | `total_outflow` and `net_saved` with pass-through rows removed |
| `own_amount` | A category's `amount` with pass-through rows removed |
| `app_remaining` | The app's `remainingBudget`. Near 0 on a closed cycle means savings were back-filled |
| `days` | `cycle_end - cycle_start`, used for `card_net_per_day`, a secondary measure that is meaningless if the dates are irregular. Not the app's inclusive count, which counts the shared boundary day twice across consecutive cycles |
| `state` | `open` if exported before `cycle_end`. A closed cycle can still be missing late postings if exported soon after it ended |
| `total` (`cards_by_cycle.csv`) | A card's expenses plus installments for the cycle; the figure to compare with its amount due |
| `rollup` | Mapping from the profile's table; falls back to the raw category |

Snapshot choice per cycle: `final.json` first, then the newest timestamp, with `old*.json` last. Files
without a timestamp in the name use the file's modified time.
