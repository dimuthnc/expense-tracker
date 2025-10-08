# Expense Tracker (Client-Side Only)

A simple, purely client-side web page to track credit card expenses for a chosen billing cycle and manage ongoing installments / monthly bills. Users can add expense rows and see live summaries by category and payment method, and also track installment totals.

## Features

- Date pickers to select billing cycle (from / to)
- Dynamic expenses table with auto-incrementing Expense ID
- Expense Fields: Description, Amount, Category (dropdown), Payment Method/Card (dropdown)
- Installations & Monthly Bills table:
  - Auto ID
  - Description, Monthly Amount, Remaining Months, Card, Computed Total Remaining (Amount * Remaining Months)
  - Footer totals for Monthly Amount and Total Remaining
- Add unlimited rows to either table
- Live recalculated summaries:
  - Totals by Category
  - Totals by Payment Method / Card
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
   - Summaries update automatically.
4. Installations & Monthly Bills:
   - Click "Add Item" to add a new installment/bill.
   - Enter a monthly Amount and Remaining Months; Total Remaining auto-calculates.
   - Footer totals update automatically for both Monthly Amount and aggregated Total Remaining.
5. Add more rows anytime; calculations are instant.

## Future Ideas

- Persist data with `localStorage`
- Export to CSV
- Delete / reorder rows
- Validation & currency selection
- Per-cycle saving & loading
- Track paid months decrementing Remaining Months automatically
- Color coding nearing completion installments

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
