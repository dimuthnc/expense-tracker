---
name: expense-insights
description: Interpret and analyse Personal Expense Manager JSON exports (files named expense_export_*.json or final.json holding cycleStart, expenses, installments, fixedCosts, cashExpenses). Use this whenever the user asks about their spending, budget, savings, credit card usage, installments, rent or household costs, wants patterns, trends, comparisons between months or cycles, a forecast, "where is my money going", "can I afford X", or points at their expense files or finance folder, even if they never mention the app or the file format. These files are easy to misread without this skill, because savings, cycle dates and installment fields do not mean what they appear to mean.
---

# Expense insights

Each export is a one-cycle snapshot of a personal budget from the Personal Expense Manager app. The app
is the only thing that "knows" how to read them; this skill carries that knowledge so any agent can
analyse the history instead.

## Workflow

1. **Find the data.** Use the path the user gives. If they name none, ask for the folder.

2. **Read the private profile.** Look for `EXPENSE_PROFILE.md` in the data folder. It holds what the
   files cannot: who people are, what recurring lines really mean, known one-offs, and open questions.
   Where the profile conflicts with this skill's general rules, the profile wins, since it describes
   this household. If there is none, carry on, say which meanings you had to assume, and offer to draft
   one from `references/profile-template.md`.

3. **Run the loader** instead of reading and adding up JSON by hand. A history runs to well over a
   thousand rows across duplicate snapshots, and hand totals drift.

   ```bash
   python3 <skill-dir>/scripts/load_exports.py "<data-folder>"
   ```

   It prints where it wrote its output, by default a new temp directory. Keep output out of git
   repositories: this is personal financial data, and the app's repo is public.

   | Output | Use it for |
   |--------|------------|
   | `data_quality.md` | Read this first. Snapshots chosen, overlaps, open cycles, step changes |
   | `cycles.csv` | One row per cycle: income, outflows, `net_saved`, `net_saved_own`, per-day rate |
   | `categories_by_cycle.csv` | Card spend per category, with the profile's `rollup` and `own_amount` |
   | `cards_by_cycle.csv` | Each card's total per cycle, comparable with its statement |
   | `transactions.csv` | Every row of every kind, for drill-down |
   | `recurring.csv` | Each installment or subscription across its lifetime |
   | `installment_runoff.csv` | Committed monthly installments for the next 12 months |

4. **Read `references/data-dictionary.md`** before quoting any figure you haven't worked with before.
   It defines each field and the app's formulas.

5. **Analyse, then report** as described below.

## The unit of analysis

One cycle is one salary: what that pay had to cover. Compare cycles with each other directly, whatever
their dates. The dates are labels, and they can shift, overlap, or vary in length when pay dates or card
cycles change without making a cycle any less comparable. Date overlaps in `data_quality.md` are for
information only and are no reason to exclude a cycle or discount a comparison.

## Traps

These are the mistakes a capable reader makes on first contact with the files.

- **`expectedSavings` is not reliably what was saved.** While a cycle is open it is a target. Once a
  cycle closes it is often overwritten so the app's remaining budget lands on zero, and it is 0 when
  the cycle overspent. Use `net_saved` (income minus card, installments and fixed), which is correct in
  all of these cases and can be negative.
- **`expectedIncome` is a typed-in figure**, not a record of money received. Reimbursements, bonuses
  and other inflows never appear anywhere in the data.
- **Money spent for other people is not the user's spending.** Purchases made on someone's behalf and
  repaid sit in the data as ordinary rows, and the repayment appears nowhere. The profile's
  `Pass-through items` table marks them. Use `net_saved_own`, `own_outflow` and `own_amount` for
  questions about habits and what things cost. Use `net_saved` and `total_outflow` only for what left
  the cards. A repaid item on an installment still has to be paid, but when it ends it frees up no
  spending money, as the funds were received in advance.
- **A reconciled cycle matches the card statements.** Expenses plus installments for a card
  (`cards_by_cycle.csv`) are meant to tally with that card's amount due, so these totals can be trusted
  and used to reason about upcoming bills. The match is only expected once a cycle is closed and
  checked.
- **Rows that look alike are not evidence of duplicates.** Identical amounts and overlapping cycle dates
  are normal in a ledger checked against statements. Raise a duplicate only if a statement disagrees.
- **Rows have no dates.** Any within-cycle claim (weekday habits, payday effects, first-half vs
  second-half) is unsupported. Row order is data-entry order, in batches per card, not chronology. The
  only exception is rows whose description names a day, such as "13th MRT Cost".
- **`remainingMonths: 0` means open-ended** (a subscription or running bill), not paid off. A non-zero
  value may be a true installment or a renewable annual policy that resets when it reaches the end, so
  check `recurring.csv` before announcing that a commitment ends. The counter is maintained by hand
  and can skip or stall.
- **Snapshots repeat.** Several files can describe one cycle; only the loader's chosen one counts.
  Summing all files double-counts.
- **An open cycle is partial.** Keep it out of averages and trends. It is useful only as a run rate
  against its own elapsed period.
- **Negative amounts are real**: rebates, refunds and points. Keep them in net totals. They can sit in
  a rebate category or in the original spend category, and their absence may mean they weren't logged.
- **Category meaning drifts.** Categories get renamed, split, retired, and used loosely. Trend on the
  profile's `rollup`, and check `data_quality.md` for lifespans. A category that stops is usually a
  bookkeeping change, not a change in behaviour.
- **Costs move between tables.** An item can go from a flat fixed estimate to real card rows, or from
  installments to a lump sum. A jump in one table with a matching fall in another is a reclassification.
  Compare `total_outflow` before calling anything a trend.
- **`cashExpenses` may be empty even though cash is spent.** Non-card spending can be budgeted as one
  fixed line instead, which then hides everything inside it. Don't add `cash_logged` to `total_outflow`
  without checking the profile, as that may double-count such a line.

## Analysing patterns

Separate spending into layers, because they behave differently and mixing them hides the signal:

- **Structural**: rent, tax, allowances, and other fixed lines. They change in steps, so use the current
  level rather than an average across a step.
- **Committed**: installments and subscriptions, with known end dates.
- **Routine variable**: groceries, food, transport, household. Compare per cycle using the median.
- **Lumpy**: trips, annual premiums, devices, medical, fees. A handful of these rows drives most of the
  difference between a good cycle and a bad one, so name them instead of letting them vanish into an
  average.

Questions worth asking of the data: which layer explains the swing in `net_saved`? Is the routine
baseline actually rising, once lumpy rows are set aside? What share of outflow can the user really
influence? Which merchants recur? Descriptions mix hand-typed names with raw bank text such as
`ACME MARKET PTE LTD CITY 065`, so normalise before counting.

## Forecasting

Build forecasts bottom-up from the layers rather than extrapolating a total:

```
next cycle = current structural lines
           + committed installments for that month (installment_runoff.csv)
           + median routine variable spend
           + known lumpy events expected in the window
```

Give low, base and high cases. Base the range on the observed spread of routine spend and on which
lumpy events land. A history under about two years can't establish seasonality, since each annual event
has been seen only once or twice. Present those as "this happened around this time last year", not as a
seasonal pattern. Treat the profile's expected events as inputs and ask about upcoming trips or big
purchases if the forecast depends on them. For longer horizons, show when committed installments end
and what that frees up, while noting which of them are likely to renew.

## Reporting

Lead with the answer, then the evidence. Every report should state:

- **Coverage**: which cycles are included, and which were left out and why.
- **Basis of each claim**: distinguish what the data shows, what you inferred, and what you forecast.
- **Assumptions that move the result**, particularly open questions in the profile. If an unresolved
  meaning materially changes a figure, show it both ways rather than picking one.

Round to whole dollars in prose, and don't imply more precision than a hand-kept ledger supports. If a
chart helps, use one, but tables are usually enough for a dozen cycles. If the user corrects a meaning
or answers an open question, offer to record it in `EXPENSE_PROFILE.md` so the next analysis starts
from it.
