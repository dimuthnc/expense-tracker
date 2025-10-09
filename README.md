# Expense Tracker (Client‑Side)

![Status](https://img.shields.io/badge/status-active-success) ![License](https://img.shields.io/badge/license-MIT-blue) ![Build](https://img.shields.io/badge/build-none%20(required)-informational) ![Stack](https://img.shields.io/badge/stack-HTML%20%2F%20CSS%20%2F%20JS-lightgrey) ![Privacy](https://img.shields.io/badge/privacy-offline-green)

Pure HTML / CSS / Vanilla JavaScript · No build step · Private & offline capable.

A zero‑backend, single‑page budgeting tool for tracking card expenses, installments, fixed costs, and cash spending with live projections and fully configurable categories & payment methods.

## 1. Feature Summary

| Area | Included | Notes |
|------|----------|-------|
| Credit Card Expenses | ✅ | Dynamic rows, category + card assignment |
| Installments / Monthly Bills | ✅ | Auto total remaining, monthly roll-up |
| Fixed Costs | ✅ | Monthly obligations added to projection |
| Cash Expenses | ✅ | Separate payment method list |
| Dynamic Configuration | ✅ | Add/remove categories & payment methods (legacy preserved) |
| Billing Cycle (15th→15th) | ✅ | Auto-detected current cycle + prev/next buttons |
| Live Projections | ✅ | Spend projection, bill projection, savings calc |
| Import / Export JSON | ✅ | Full data model + expected income |
| Import / Export CSV | ✅ | Multi-section format with expectedIncome |
| Expected Income Field | ✅ | Drives savings metric; persisted in export |
| Accessibility Basics | ✅ | Native controls, labels, focus outlines |
| Undo / Edit Modes | ❌ (Removed) | Simplified immediate edits & deletes |
| Persistence (Local Storage) | ❌ | Future enhancement idea |
| Auth / Multi-user | ❌ | Intentionally out of scope |

## 2. Quick Reference

Common tasks at a glance:

| Action | How |
|--------|-----|
| Add credit card expense | Click "Add Expense" under Credit Card Expenses |
| Remove any row | Click trash icon in its row |
| Shift billing cycle forward | Up (▲) arrow beside Billing Cycle heading |
| Shift billing cycle backward | Down (▼) arrow beside Billing Cycle heading |
| Add new category/card | Enter name in Configuration block → Add |
| Export data | Use Export JSON or Export CSV buttons (header) |
| Import data | Click Import… and choose previous JSON/CSV export |
| View totals by category | See "Totals by Category" summary table |
| Update expected income | Edit numeric field in Summary panel |
| Projected bill including fixed | See "Total Bill Projection (Incl. Fixed)" metric |
| Save work | Export (no automatic persistence) |

## 3. Overview

This project is a lightweight browser-only expense dashboard. All data lives in the page until you export it (JSON or CSV).

It supports:

* Multiple spending domains (Card Expenses, Installments, Fixed Costs, Cash Expenses)
* Live per-category and per-card summaries
* Monthly projection + fixed cost inclusion + expected savings estimation
* Dynamic configuration of Categories, Card Payment Methods, and Cash Payment Methods at runtime
* Safe retention of removed option values (marked as legacy) in existing rows

No frameworks, no bundlers, no tracking — just open `index.html` and start entering data.

## 4. Quick Start

1. Clone or download the repository.
2. Open `index.html` in any modern browser (Chrome, Edge, Firefox, Safari).
3. (Optional) Set your billing cycle dates at the top.
4. Enter or import data, adjust configuration lists, and review live summaries.
5. Export when you want to persist or share.

## 5. Core Data Areas

| Section | Purpose | Key Fields |
|---------|---------|-----------|
| Credit Card Expenses | One-off or normal card transactions | Description, Amount, Category, Card (Payment Method) |
| Installments & Monthly Bills | Items paid monthly for N remaining months | Description, Monthly Amount, Remaining Months, Card, Computed Total Remaining |
| Fixed Costs | Recurring fixed monthly obligations | Description, Amount |
| Cash Expenses | Non-card spending (cash / transfers / wallets) | Description, Amount, Cash Payment Method, Category |

## 6. Configuration (Dynamic Lists)

Located in the “Configuration” section:

* Categories
* Card Payment Methods
* Cash Payment Methods

### Adding

Type a unique name and press Add (or Enter). All existing dropdowns refresh automatically.

### Removing

Click the “x” next to an entry. Existing rows preserving the removed value retain it as a selectable option labelled with “(legacy)” until you manually change it.

### Legacy Handling

Removed options still in use are appended as trailing options in affected selects with class `legacy-option` so historical data isn’t broken.

## 7. Live Metrics (Summary Panel)

The Summary section displays these live-calculated values:

* Total Credit Card Bill – Sum of all current credit card expense amounts
* Total Card Bill + Installments – Credit card bill + sum of monthly installment amounts
* Days Remaining in Cycle – Inclusive cycle length minus elapsed days (current day excluded from remaining)
* Projected Cycle Spend – If cycle started: `(CardTotal / DaysElapsed * TotalDays) + MonthlyInstallments`; otherwise fallback `CardTotal + MonthlyInstallments`
* Total Bill Projection (Incl. Fixed) – Projected Cycle Spend + Fixed Costs total
* Total Installment Cost (Monthly) – Sum of monthly installment amounts
* Monthly Expected Income – User input field (also exported/imported)
* Total Fixed Costs – Sum of fixed costs
* Expected Savings – `Expected Income - Total Bill Projection`

## 8. Table Footers & Computations

* Card Expenses footer: total of all card amounts
* Installments footer: sum of monthly amounts + sum of computed remaining totals (monthly * remaining months)
* Fixed Costs footer: total amount
* Cash Expenses footer: total amount

Installment row “Total Remaining” updates whenever Amount or Remaining Months changes.

## 9. Interactions

* Add Row buttons create new blank rows (auto ID).
* Trash icon button on each row removes it immediately (no undo).
* Inputs/selects update summaries and projections in real time.
* Billing Cycle auto-sets on first load to the cycle containing today, defined as the 15th of one month through the 15th of the next month.
* Use the small arrow buttons beside the Billing Cycle heading to shift backward (down arrow) or forward (up arrow) by one full cycle (15th→15th). Multiple clicks queue additional month shifts.

## 10. Import & Export

Buttons: Export JSON, Export CSV, Import… (choose a previously exported file).

### JSON Schema

```json
{
  "cycleStart": "YYYY-MM-DD",
  "cycleEnd": "YYYY-MM-DD",
  "expectedIncome": 0,
  "expenses": [ { "description": "", "amount": 0, "category": "", "payment": "" } ],
  "installments": [ { "description": "", "amount": 0, "remainingMonths": 0, "card": "" } ],
  "fixedCosts": [ { "description": "", "amount": 0 } ],
  "cashExpenses": [ { "description": "", "amount": 0, "paymentMethod": "", "category": "" } ]
}
```

Row IDs are regenerated sequentially; only semantic fields persist.

### CSV Multi-Section Format

Sections in order (blank line between): Cycle, Expenses, Installments, FixedCosts, CashExpenses.

```csv
# Cycle
cycleStart,cycleEnd,expectedIncome
2025-10-01,2025-10-31,4500

# Expenses
description,amount,category,payment
Groceries,45.90,Grocery,DBS

# Installments
description,amount,remainingMonths,card
Phone Plan,30.00,6,HSBC

# FixedCosts
description,amount
Rent,1200

# CashExpenses
description,amount,paymentMethod,category
Market Veg,18.25,Cash,Grocery
```

Quoted fields and escaped quotes (`""`) are supported.

### Import Behavior

* Clears existing rows first
* Recomputes all summaries automatically
* Missing sections are treated as empty arrays
* Unknown option values are preserved as legacy entries

### Validation

* Invalid JSON → simple alert
* CSV lines with insufficient columns for a section are skipped silently

## 11. Data Model (In-Memory)

```ts
interface Expense { description: string; amount: number; category: string; payment: string; }
interface Installment { description: string; amount: number; remainingMonths: number; card: string; }
interface FixedCost { description: string; amount: number; }
interface CashExpense { description: string; amount: number; paymentMethod: string; category: string; }
interface ExportModel {
  cycleStart: string;
  cycleEnd: string;
  expenses: Expense[];
  installments: Installment[];
  fixedCosts: FixedCost[];
  cashExpenses: CashExpense[];
}
```

## 12. Performance & Limits

Designed for personal-scale usage (hundreds of rows). All operations are DOM-based; no virtualized rendering.

## 13. Accessibility Notes

* All inputs are native HTML controls
* Tab order follows document flow
* (Potential improvement) Add ARIA labels for summary metrics

## 14. Customization Ideas

| Enhancement | Description |
|-------------|-------------|
| Local Storage Persistence | Auto-save & load last session |
| Combined Category Summary | Merge card + cash categories |
| Currency Support | Multi-currency display & conversion |
| Dark Mode | Themed alternative stylesheet |
| Installment Auto-Progress | Decrement remaining months at cycle rollover |
| Validation Layer | Highlight incomplete/invalid rows |

## 15. Development

No build tools required.

1. Edit files directly (`index.html`, `css/styles.css`, `js/app.js`).
2. Refresh browser.
3. Use browser dev tools to inspect runtime state.

## 16. Known Constraints

* No persistence unless you export
* No multi-user or sync
* Deleting a row is irreversible (no undo)
* No sorting or filtering built-in

## 17. Security & Privacy

* All data stays in your browser tab
* Exports are plain text files you control
* No external network requests

## 18. License

MIT — do whatever you like; attribution appreciated but not required.

## 19. Changelog (High Level)

* Initial: Core tables + summaries
* Added: Installments, Fixed Costs, Cash Expenses
* Added: Projection & expected savings metrics
* Added: JSON / CSV import-export
* Added: Dynamic configuration (categories & payment methods)
* Simplified: Removed edit/save modal & undo (immediate delete only)
* UI: Renamed Expenses table to Credit Card Expenses
* UI: Added Billing Cycle auto-default (15th→15th) with previous/next cycle shift buttons
* UI: Replaced textual Delete with trash icon button
* Data: Added expectedIncome to export/import (JSON + CSV cycle section)

---
Enjoy budgeting! If you extend this (storage, themes, analytics), consider contributing your variant back.
