# Expense Tracker (Client-Side Only)

A simple, purely client-side web page to track credit card expenses for a chosen billing cycle and manage ongoing installments / monthly bills, fixed costs, and cash expenses. Users can add expense rows and see live summaries by category and payment method, track installment totals, manage fixed recurring costs, and record cash / non-card spending.

## Features

- Date pickers to select billing cycle (from / to)
- Dynamic expenses table with auto-incrementing Expense ID
  - Footer total for all expense amounts
- Expense Fields: Description, Amount, Category (dropdown), Payment Method/Card (dropdown)
- Installations & Monthly Bills table:
  - Auto ID
  - Description, Monthly Amount, Remaining Months, Card, Computed Total Remaining (Amount * Remaining Months)
  - Footer totals for Monthly Amount and Total Remaining
- Fixed Costs table:
  - Auto ID
  - Description & Amount
  - Footer total for all fixed cost amounts
- Cash Expenses table:
  - Auto ID
  - Description, Amount, Payment Method (Cash, Paylah, Bank Transfer), Category (same options as card expenses)
  - Footer total for all cash expense amounts
- Summary panel with live metrics:
  1. Total Credit Card Bill (current card expenses total)
  2. Total Card Bill + Installments (1 + monthly installments amount)
  3. Days Remaining in Cycle (inclusive length minus elapsed days; current day excluded from remaining)
  4. Projected Cycle Spend: (CardTotal / DaysElapsed * TotalDays) + MonthlyInstallments (fallback to CardTotal + MonthlyInstallments if cycle not started)
  5. Total Bill Projection Including Fixed Costs: (Projected Cycle Spend + Fixed Costs)
  6. Total Installment Cost (monthly installments total)
  7. Monthly Expected Income (user input)
  8. Total Fixed Costs (fixed costs total)
  9. Expected Savings: Expected Income - Total Bill Projection
- Import / Export (JSON & CSV) of cycle, expenses, installments, fixed costs, cash expenses (excluding internal IDs)
- Add unlimited rows to any table
- Live recalculated summaries:
  - Totals by Category (card expenses only currently)
  - Totals by Payment Method / Card (card expenses only currently)
- Responsive minimalist styling

## Tech Stack

- HTML
- CSS (no framework)
- Vanilla JavaScript (no dependencies)

## How to Use

1. Open `index.html` directly in your browser (double-click or drag into a tab).
2. (Optional) Set the cycle From/To dates.
3. Expenses:
   - Click "Add Expense" to insert new rows.
   - Fill Description, Amount, select Category & Payment Method.
   - Footer total updates automatically.
4. Installations & Monthly Bills:
   - Click "Add Item" to add a new installment/bill.
   - Enter a monthly Amount and Remaining Months; Total Remaining auto-calculates.
   - Footer totals update automatically.
5. Fixed Costs:
   - Click "Add Fixed Cost" to add a row.
   - Enter Amount; footer total updates instantly.
6. Cash Expenses:
   - Click "Add Cash Expense" to add a row.
   - Enter Description, Amount, select Payment Method (Cash / Paylah / Bank Transfer) and Category.
   - Footer total updates automatically.
7. Summary Panel:
   - Enter your Monthly Expected Income to see real-time Expected Savings.
   - Adjust dates to recalculate projection based on elapsed days.
8. Import / Export:
   - Use the header buttons: Export JSON / Export CSV / Import...
   - Import accepts a previously exported `.json` or `.csv` file (see formats below).
9. Add more rows anytime; calculations are instant.

## Import / Export Formats

### JSON Format

File name pattern: `expense_export_<timestamp>.json`

Schema:
```json
{
  "cycleStart": "YYYY-MM-DD",
  "cycleEnd": "YYYY-MM-DD",
  "expenses": [
    { "description": "string", "amount": number, "category": "string", "payment": "string" }
  ],
  "installments": [
    { "description": "string", "amount": number, "remainingMonths": number, "card": "string" }
  ],
  "fixedCosts": [
    { "description": "string", "amount": number }
  ],
  "cashExpenses": [
    { "description": "string", "amount": number, "paymentMethod": "string", "category": "string" }
  ]
}
```
Notes:
- Internal row IDs are not stored; they are regenerated sequentially on import.
- Amount fields are stored as raw numbers.

### CSV Format

Multi-section text file with section headers prefixed by `#`. Blank line separates sections. First line after a section header is that section's column header row. Example:

```
# Cycle
cycleStart,cycleEnd
2025-10-01,2025-10-31

# Expenses
description,amount,category,payment
Lunch,12.50,Outside Food,HSBC
Groceries,45.90,Grocery,DBS

# Installments
description,amount,remainingMonths,card
Phone Plan,30.00,6,HSBC

# FixedCosts
description,amount
Rent,1200
Internet,45

# CashExpenses
description,amount,paymentMethod,category
Market Veg,18.25,Cash,Grocery
```

Parsing Rules:
- Lines starting with `#` begin a new section.
- First non-empty line after a section header is treated as that section's header and skipped.
- Commas inside quoted fields and escaped quotes (`""`) are supported.
- Amount / numeric values parsed with `parseFloat` / `parseInt`.

### Import Behavior

- Existing table rows are cleared before population.
- Cycle dates set if provided.
- All totals, summaries, and projections recomputed automatically after import.
- Missing sections or empty arrays are safe (treated as empty lists).

### Validation & Errors

- Invalid JSON triggers a simple alert.
- CSV parser is forgiving; malformed lines that do not match expected column counts are skipped.

## Future Ideas

- Persist data with `localStorage`
- Export to CSV (all tables) (DONE)
- Delete / reorder rows
- Validation & currency selection
- Per-cycle saving & loading
- Track paid months decrementing Remaining Months automatically
- Color coding nearing completion installments
- Aggregate dashboard net monthly obligations (expenses + monthly installments + fixed costs + cash)
- Include cash expenses in category & payment summaries or display a combined summary
- Import validation report / error highlighting
- Download template button

## Project Structure

```plaintext
index.html
css/
  styles.css
js/
  app.js
```

## License

MIT
