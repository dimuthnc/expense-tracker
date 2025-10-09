# Expense Tracker (Client‑Side)

Pure HTML / CSS / Vanilla JavaScript · No build step · Private & offline capable.

A zero‑backend, single‑page budgeting tool for tracking card expenses, installments, fixed costs, and cash spending with live projections and fully configurable categories & payment methods.

## 1. Overview

This project is a lightweight browser-only expense dashboard. All data lives in the page until you export it (JSON or CSV).

It supports:

* Multiple spending domains (Card Expenses, Installments, Fixed Costs, Cash Expenses)
* Live per-category and per-card summaries
* Monthly projection + fixed cost inclusion + expected savings estimation
* Dynamic configuration of Categories, Card Payment Methods, and Cash Payment Methods at runtime
* Safe retention of removed option values (marked as legacy) in existing rows

No frameworks, no bundlers, no tracking — just open `index.html` and start entering data.

## 2. Quick Start

1. Clone or download the repository.
2. Open `index.html` in any modern browser (Chrome, Edge, Firefox, Safari).
3. (Optional) Set your billing cycle dates at the top.
4. Enter or import data, adjust configuration lists, and review live summaries.
5. Export when you want to persist or share.

## 3. Core Data Areas

| Section | Purpose | Key Fields |
|---------|---------|-----------|
| Card Expenses | One-off or normal card transactions | Description, Amount, Category, Card (Payment Method) |
| Installments & Monthly Bills | Items paid monthly for N remaining months | Description, Monthly Amount, Remaining Months, Card, Computed Total Remaining |
| Fixed Costs | Recurring fixed monthly obligations | Description, Amount |
| Cash Expenses | Non-card spending (cash / transfers / wallets) | Description, Amount, Cash Payment Method, Category |

## 4. Configuration (Dynamic Lists)

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

## 5. Live Metrics (Summary Panel)

1. Total Credit Card Bill – Sum of all current card expense amounts
2. Total Card Bill + Installments – (1) + sum of monthly installment amounts
3. Days Remaining in Cycle – Inclusive cycle length minus elapsed days (current day excluded from remaining)
4. Projected Cycle Spend – If cycle started: `(CardTotal / DaysElapsed * TotalDays) + MonthlyInstallments`; else fallback `CardTotal + MonthlyInstallments`
5. Total Bill Projection (Incl. Fixed) – Projected Cycle Spend + Fixed Costs total
6. Total Installment Cost (Monthly) – Sum of monthly installment amounts
7. Monthly Expected Income – User input field
8. Total Fixed Costs – Sum of fixed costs
9. Expected Savings – `Expected Income - Total Bill Projection`

## 6. Table Footers & Computations

* Card Expenses footer: total of all card amounts
* Installments footer: sum of monthly amounts + sum of computed remaining totals (monthly * remaining months)
* Fixed Costs footer: total amount
* Cash Expenses footer: total amount

Installment row “Total Remaining” updates whenever Amount or Remaining Months changes.

## 7. Interactions

* Add Row buttons create new blank rows (auto ID).
* Delete button on each row removes it immediately.
* Inputs/selects update summaries and projections in real time.

## 8. Import & Export

Buttons: Export JSON, Export CSV, Import… (choose a previously exported file).

### JSON Schema

```json
{
  "cycleStart": "YYYY-MM-DD",
  "cycleEnd": "YYYY-MM-DD",
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
cycleStart,cycleEnd
2025-10-01,2025-10-31

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

## 9. Data Model (In-Memory)

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

## 10. Performance & Limits

Designed for personal-scale usage (hundreds of rows). All operations are DOM-based; no virtualized rendering.

## 11. Accessibility Notes

* All inputs are native HTML controls
* Tab order follows document flow
* (Potential improvement) Add ARIA labels for summary metrics

## 12. Customization Ideas

| Enhancement | Description |
|-------------|-------------|
| Local Storage Persistence | Auto-save & load last session |
| Combined Category Summary | Merge card + cash categories |
| Currency Support | Multi-currency display & conversion |
| Dark Mode | Themed alternative stylesheet |
| Installment Auto-Progress | Decrement remaining months at cycle rollover |
| Validation Layer | Highlight incomplete/invalid rows |

## 13. Development

No build tools required.

1. Edit files directly (`index.html`, `css/styles.css`, `js/app.js`).
2. Refresh browser.
3. Use browser dev tools to inspect runtime state.

## 14. Known Constraints

* No persistence unless you export
* No multi-user or sync
* Deleting a row is irreversible (no undo)
* No sorting or filtering built-in

## 15. Security & Privacy

* All data stays in your browser tab
* Exports are plain text files you control
* No external network requests

## 16. License

MIT — do whatever you like; attribution appreciated but not required.

## 17. Changelog (High Level)

* Initial: Core tables + summaries
* Added: Installments, Fixed Costs, Cash Expenses
* Added: Projection & expected savings metrics
* Added: JSON / CSV import-export
* Added: Dynamic configuration (categories & payment methods)
* Simplified: Removed edit/save modal & undo (immediate delete only)

---
Enjoy budgeting! If you extend this (storage, themes, analytics), consider contributing your variant back.
