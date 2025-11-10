# COPILOT INSTRUCTIONS

This file is a deep technical and architectural guide for the Personal Expense Manager project. It is designed for AI assistants (and human contributors) to quickly understand structure, intent, constraints, and safe extension patterns. Treat it as the canonical reference for reasoning about the codebase.

---
## 0. High-Level Summary
A zero-backend, static, client-side expense tracking dashboard implemented with plain HTML/CSS/JavaScript. It allows users to:
- Track credit card expenses, installments/monthly bills, fixed costs, cash expenses.
- Configure lists of categories and payment methods dynamically.
- View real-time summaries, projections, and pie charts of distribution by category/payment method.
- Import/export data via JSON or a custom multi-section CSV format.
- Use a monthly "billing cycle" concept (15th → 15th) with cycle shifting.
- Switch among five themes (light, dark, dracula, vscode, pink) with cross-page synchronization.
- All data lives in-memory; persistence is manual (export files). No remote calls.

---
## 1. Repository Structure
```
index.html          Main application interface
docs.html           End-user documentation page
README.md           Public project overview (user-focused)
COPILOT.md          (This file) Internal technical guide
css/styles.css      All styling + theme tokens
js/app.js           Core application logic (state, UI, charts, import/export)
js/docs.js          Documentation page theme sync helper
functions/[[path]].js Cloudflare Pages Function for canonical Link header injection
screenshots/        Static image assets used in docs & meta tags
```
No build system. Open `index.html` directly or host via any static server/CDN.

---
## 2. Runtime Model & Data Flow
All state is implicit in DOM + a few top-level arrays:
- CATEGORY_OPTIONS: string[] of categories
- PAYMENT_OPTIONS: string[] of card payment methods
- CASH_PAYMENT_OPTIONS: string[] of non-card payment methods
- Tables hold row data in uncontrolled inputs/selects; recalculation functions read DOM and aggregate results.

Data extraction pipeline:
1. User manipulates rows (add/remove/edit directly). Each row has auto-incremented ID for UI only.
2. Summaries recompute through `collectExpenseData()` and related collectors.
3. Summary panel metrics use aggregated totals + user inputs (`expectedIncome`, `expectedSavingsInput`) and computed days remaining from cycle dates.
4. Charts derive dataset arrays (by category / by payment) -> draw on `<canvas>` using a simple custom pie chart renderer.
5. Export functions build an object via `getDataModel()` then serialize to JSON or structured CSV sections.
6. Import functions parse and rebuild DOM tables, injecting legacy options when removed values are still present.

---
## 3. Billing Cycle Logic
Defined as start/end anchored on the 15th of month. `computeCycleContaining(date)` picks the cycle such that:
- If current day >= 15: cycleStart = current month 15; cycleEnd = next month 15.
- Else: cycleStart = previous month 15; cycleEnd = current month 15.
  Days remaining calculation (`daysBetweenExclusive`) returns:
- totalDays: inclusive (end - start + 1)
- daysElapsed: includes current day if >= start
- daysRemaining = totalDays - daysElapsed (current day excluded from remainder budget per design)
  Cycle shifting via `shiftCycle(deltaMonths)` moves both start and end by ± delta months preserving 15th anchor.

---
## 4. Summary Metrics Semantics
Fields (DOM IDs):
- sumCardBill: total credit card expenses this cycle
- sumInstallmentMonthly: sum of monthly installment amounts (NOT total remaining)
- sumFixedCosts: sum of fixed cost amounts
- sumCashExpenses: total non-card expenses
- expectedIncome (input): user-provided income/budget base
- expectedSavingsInput (input): user target savings for period
- sumExpectedSavings: displays expectedSavingsInput value (treated as "Projected Savings")
- sumRemainingBudget: expectedIncome − (card + installments + fixed + expectedSavings)
- sumRemainingPerDay: remainingBudget / daysRemaining (if cycle active) else "Not Applicable"
- sumDaysRemaining: daysRemaining value

Remaining budget negative triggers `.negative` CSS class for highlighting.

---
## 5. Import / Export Formats
### JSON
Full structured object including configurable lists:
```jsonc
{
  "cycleStart": "YYYY-MM-DD",
  "cycleEnd": "YYYY-MM-DD",
  "expectedIncome": number,
  "expectedSavings": number,
  "categories": string[],
  "cardPaymentMethods": string[],
  "cashPaymentMethods": string[],
  "expenses": [{ description, amount, category, payment }],
  "installments": [{ description, amount, remainingMonths, card }],
  "fixedCosts": [{ description, amount }],
  "cashExpenses": [{ description, amount, paymentMethod, category }]
}
```
IDs are not persisted; they are regenerated on import.

### CSV Multi-Section
Ordered labeled sections separated by blank lines. First non-comment line after a `# SectionName` header is the column header; subsequent lines are data until next section.
Sections processed: Cycle, Categories, CardPaymentMethods, CashPaymentMethods, Expenses, Installments, FixedCosts, CashExpenses.
Robustness notes:
- Parser is custom (`splitCsv`) with support for quoted fields and escaped quotes.
- Lines with insufficient columns are skipped silently.
- Section order matters only insofar as later replacements of lists use earlier imported arrays before populating rows.

### Import Behavior
- Clears existing tables (`clearAllTables`) then repopulates.
- Applies lists first so row selects can validate/append legacy items.
- Ensures each table has at least one starter row if empty for UX.
- Rebuilds summaries and charts after population.

---
## 6. Legacy Option Handling
When a category or payment method is removed, existing rows that used it retain the value appended as an option with text `value (legacy)` and class `legacy-option`—implemented via `populateSelectOptions()`.
This ensures historical row integrity while discouraging further use (user can change manually).

---
## 7. Pie Chart Rendering
Functions:
- `updateExpenseCharts(byCategory, byPayment)` picks palette + triggers draw if dataset changed.
- `buildDataKey(obj)` creates a deterministic signature string to avoid redundant redraws.
- `generatePalette(n, seedHue)` issues HSL colors spaced by hue.
- `drawPie(ctx, dataPairs, palette)` draws slices and punches a donut hole.
- `updateLegend(listEl, dataPairs, palette)` builds list items with color swatches, amount, and percent.
  No external chart library—pure Canvas 2D for portability and low overhead.

---
## 8. Event & Mutation Model
- Mutation functions (`add*Row`, row delete buttons) directly modify DOM and then trigger full recomputations.
- `postRowMutation(type)` centralizes recalculation after deletions.
- Keyboard shortcut: Alt + A (global listener) adds a credit expense row unless typing in an input/select/textarea.
- Theme selection triggers DOM class toggling; persisted in `localStorage` under key `et_theme` and synchronized across tabs via the `storage` event.

---
## 9. Theming System
Themes implemented with body classes overriding CSS custom properties:
- light (default from `:root` vars)
- theme-dark
- theme-dracula
- theme-vscode
- theme-pink
  `applyTheme(theme)` removes all known theme classes then adds the correct one. Shared logic exists in both `app.js` and `docs.js`.
  New theme addition: add variable block in CSS + extend validation arrays in JS theme init & storage listeners.

---
## 10. Cloudflare Pages Function (`functions/[[path]].js`)
Purpose: Insert a dynamic canonical Link header for any HTML response without hard-coding a domain. Steps:
1. Await `context.next()` (fetch static asset).
2. If `content-type` is HTML, sanitize query params (remove `utm_*`, `gclid`, `fbclid`).
3. Reconstruct canonical URL and set/append a `Link: <url>; rel="canonical"` header.
   Keeps forks SEO-clean while avoiding manual `<link rel="canonical">` editing.

---
## 11. Coding Style Guidelines (Follow for Extensions)
- Pure ES5/ES6 browser APIs—no bundler, no transpilation.
- Avoid introducing frameworks unless absolutely required; prefer minimal helpers.
- Keep functions small and single-purpose. Mutate DOM directly; do not maintain parallel JS object graphs besides top-level arrays.
- Recompute derived data rather than caching unless performance becomes an issue.
- Use `const`/`let`; avoid globals outside IIFEs.
- Error handling: favor graceful skips (e.g., skipped CSV lines) over hard failures.
- Accessibility: always provide `aria-label` for interactive icon-only controls.

---
## 12. Potential Extension Points & Safe Patterns
| Area | Strategy | Complexity |
|------|----------|-----------|
| Persistence (LocalStorage) | Serialize `getDataModel()` on activity debounced | Low |
| Service Worker | Cache static assets + offline HTML shell | Medium |
| Installment Auto-Progress | On cycle shift, decrement remainingMonths if > 0 | Low |
| Validation Layer | Mark invalid amount fields with class + tooltip | Low |
| Sorting/Filtering | Wrap table row collections and re-insert sorted | Medium |
| Multi-Currency | Add currency select + conversion table; store base currency | High |
| Tests | Add Jest or web-test-runner with DOM simulation | Medium |
| Chart Animations | Introduce incremental angle easing | Low |

Guardrails: preserve import/export format compatibility when adding fields—append new optional fields rather than reordering existing columns.

---
## 13. Performance Notes
- Designed for personal scale (hundreds of rows). O(N) DOM traversal on updates is acceptable.
- Conditional chart redraw prevents needless canvas work.
- No layout thrashing loops—most functions batch updates within a single event tick.
- If scaling further, consider: `requestIdleCallback` for heavy recompute and virtualization for expense lists.

---
## 14. Error & Edge Case Handling Inventory
| Function | Edge Cases Mitigated |
|----------|----------------------|
| `populateSelectOptions` | Preserves removed values as legacy options |
| `daysBetweenExclusive` | Invalid dates → zeros; ensures start<=end |
| `splitCsv` | Supports quoted commas & escaped quotes |
| Import (CSV) | Missing sections allowed; short lines skipped |
| Import (JSON) | Try/catch with alert on parse failure |
| `updateSummary` | Handles missing or unset inputs gracefully (defaults 0) |
| Pie Charts | Empty datasets draw placeholder "No data" ring |

---
## 15. Security & Privacy Considerations
- All logic runs client-side; no network fetches besides static assets.
- Exports may contain sensitive financial data; recommend advising users to store safely.
- Avoid introducing third-party trackers or fonts unless privacy posture is reevaluated.
- Canonical function strips tracking query params from canonical representation only—does not alter responses or analytics.

---
## 16. Accessibility Checklist (Current State)
- Inputs and selects have textual labels or placeholders + accessible context.
- Destructive actions (delete rows) use icon buttons with `aria-label`.
- Charts have `<canvas>` with `aria-label` and visual legend with text for screen readers.
  Areas to improve:
- Provide role and live region for summary budget changes (e.g., `aria-live="polite"`).
- Ensure color contrast of Pink theme meets WCAG AA (might need darkening).

---
## 17. Testing Strategy (Recommended Additions)
Minimal smoke tests could target:
1. Cycle computation across boundary (14th vs 15th).
2. Import/export round-trip equality (JSON).
3. CSV parser quoting edge cases.
4. Remaining budget negative styling toggle.
   Suggested setup:
- Introduce `tests/` folder with plain JS using JSDOM (if allowed) or manual HTML fixture injection.
- Provide `npm init -y` and dependency `jsdom` only; keep optional.

---
## 18. Deployment Notes & Variants
Current host: Cloudflare Pages (no build step). Alternate hosting requires only copying static assets.
If removing Cloudflare function environment, either:
- Accept no canonical header logic, OR
- Add explicit `<link rel="canonical">` tag into HTML.
  Fork guidelines: keep screenshots updated and alt text meaningful; adjust meta description if changing feature scope.

---
## 19. Safe Refactoring Guidelines
Before refactors:
- Maintain IDs and class names used by JS selectors (querySelector by ID heavily used).
- If changing table column order, update all index-based `row.children[n]` references consistently.
- Consider refactoring repeated row-building code into factory functions only if abstraction reduces duplication without obfuscating logic.
- Do NOT rename export/import field names without versioning the format.

Introduce a `DATA_VERSION` constant if schema evolves; include in JSON export for future migrations.

---
## 20. Known Limitations (Technical)
- All numeric parsing uses `parseFloat` / `parseInt` with minimal validation (no locale-specific formatting beyond display).
- IDs reset to 1 on import, which may confuse users comparing exported sets manually.
- Installments do not auto-decrement monthly.
- No multi-tab live shared state aside from theme.
- No undo for deletions.

---
## 21. Potential Bug Vectors & Mitigations
| Vector | Risk | Mitigation Suggestion |
|--------|------|------------------------|
| Column index drift | High | Centralize indices in constants or use data attributes |
| Large CSV import | Memory moderate | Stream parsing not needed yet; fine for personal data |
| Negative remaining budget per-day calc division by zero | Low | Guard already (daysRemaining > 0) |
| Theme storage unavailable (private mode) | Low | Try/catch used around localStorage |

---
## 22. Extension Example: Adding LocalStorage Persistence (Pattern)
1. Add debounce utility:
```js
function debounce(fn, ms){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; }
```
2. After each `updateSummaries()` call, invoke debounced persistence:
```js
const persist = debounce(()=>{ try { localStorage.setItem('et_state', JSON.stringify(getDataModel())); } catch{} }, 500);
```
3. On init, load and call `populateFromData(JSON.parse(localStorage.getItem('et_state')))`. Validate shape before using.
4. Provide a manual "Clear Session" button to wipe.

Ensure not to break existing import/export.

---
## 23. Service Worker Concept (Offline-First)
Install a basic service worker to cache:
- `/index.html`, `/docs.html`
- `/css/styles.css`
- `/js/app.js`, `/js/docs.js`
- `/screenshots/*`
  Cache strategy: Cache First for static assets, Network First for HTML. Provide a version constant to manage updates.

---
## 24. Future Data Schema Versioning Proposal
Introduce JSON export field:
```json
{
  "schemaVersion": 1
}
```
Upgrade path examples:
- v2 adds `currency` field; fallback defaults to `"USD"` when missing.
- v3 moves installments to separate monthlyPlan object; migration merges for backward compatibility.

---
## 25. Security Hardening Ideas (If Ever Needed)
- Content Security Policy meta tag to restrict inline scripts (would need JS externalization of inline event attributes—currently none inline besides script tags).
- Integrity hashes for CSS/JS if hosted externally.
- Strict MIME type checking on export download (already using explicit Blob types).

---
## 26. Operational Monitoring (Optional)
If deployed publicly and usage telemetry desired without tracking personal data:
- Add lightweight anonymous event counters (e.g., number of rows, export events) via POST to a privacy-preserving endpoint. OUT OF SCOPE currently by design.

---
## 27. Code Walkthrough (Function Groups)
| Group | Core Functions | Purpose |
|-------|----------------|---------|
| Select Management | `createSelect`, `populateSelectOptions`, `refreshAllSelects` | Maintain dynamic dropdown options + legacy markers |
| Config Lists | `renderConfigLists`, `addUnique`, `removeItem` | UI for adding/removing categories/payment methods |
| Expense Rows | `addExpenseRow`, `collectExpenseData`, `updateExpenseTotal` | CRUD and aggregation for credit card expenses |
| Installments | `addInstallmentRow`, `recalcInstallmentRowTotals`, `updateInstallmentsFooterTotals` | Monthly + remaining totals |
| Fixed Costs | `addFixedCostRow`, `updateFixedCostsTotal` | Aggregate fixed recurring costs |
| Cash Expenses | `addCashExpenseRow`, `updateCashExpensesTotal` | Non-card expense tracking |
| Charts | `updateExpenseCharts`, `drawPie`, `generatePalette`, `updateLegend`, `buildDataKey` | Visual distribution representations |
| Summary | `updateSummary`, `daysBetweenExclusive`, `parseNumberFromEl` | Derived financial metrics |
| Cycle | `computeCycleContaining`, `setCycle`, `shiftCycle`, `initDefaultCycleIfEmpty` | Date range management |
| Theming | `applyTheme`, `initTheme` (+ storage event listener) | Theme persistence and cross-tab sync |
| Import/Export | `getDataModel`, `exportJSON`, `exportCSV`, `importJSONText`, `importCSVText`, `splitCsv`, `populateFromData` | Data portability |
| Row Actions | `buildRowActions`, `postRowMutation`, `clearAllTables` | Delete + recalculation handling |
| Misc | `downloadBlob`, `csvEscape` | Utility for downloads |

---
## 28. CSS Overview & Tokens
`styles.css` defines design tokens per theme via custom properties:
- Semantic buckets: `--bg`, `--surface`, `--surface-alt`, `--border`, `--text`, `--accent`, `--danger`, etc.
- Tables, chips, modal (legacy warning styles are partially retained though modal feature removed).
  Refactoring tip: Extract tokens into separate CSS files if theming system grows (e.g., `themes/light.css`, etc.).

---
## 29. Removed / Deprecated Features
- Undo bar + modal confirmation (CSS remnants still partially present; comments note removal).
  Clean-up task: Remove unused modal/undo-related CSS blocks if not planning reinstatement.

---
## 30. Housekeeping & Maintenance Checklist
Perform monthly (or pre-release) review:
1. Validate import/export round-trip compatibility.
2. Confirm new themes still meet contrast minimums.
3. Lint for orphaned CSS (modal, undo) if not reused.
4. Test billing cycle shift at year boundary (Dec→Jan).
5. Spot-check CSV quoting with embedded commas + quotes.
6. Ensure canonical header still set (inspect response headers in DevTools Network panel).
7. Verify Alt + A shortcut not broken by new inputs.

---
## 31. Contribution Guidelines (For Future PRs)
- Keep PRs focused: one enhancement or fix.
- Update README + screenshots if UI changes materially.
- Update COPILOT.md for architectural impacts (schema changes, new major function groups).
- Include before/after reasoning in PR description.

---
## 32. Quick Risk Assessment Before Adding Dependencies
Ask:
1. Does dependency justify added bundle weight? (All inline currently ~ small.)
2. Can the feature be done in <50 LOC vanilla? Prefer vanilla first.
3. Does dependency require a build step? Avoid unless transformative.
4. Is there a security maintenance burden (e.g., outdated transitive packages)?

If adding one (e.g., for testing), segregate it: do not include in production served files; use dev-only tooling.

---
## 33. FAQ for AI Assistance
Q: How do I add a new summary metric?
A: Add a DOM element (ID) in `index.html` summary grid, compute its value in `updateSummary()`, and ensure supporting aggregation is updated.

Q: How do I avoid breaking imports when adding a new field?
A: Make field optional. Append column to CSV section header; if absent during import set default.

Q: Where should I store reusable utilities if they grow?
A: Create `js/utils/` directory and import via separate `<script>` tags (maintain load order).

Q: How to detect performance issues?
A: Insert `performance.now()` measurement around `updateSummaries()` inside a dev-only flag.

Q: How to add keyboard shortcuts safely?
A: Bind at `document` level; verify not interfering with text entry; gate with modifiers (Alt/Ctrl).

---
## 34. Minimal Integration Test Plan (If Implemented)
Tests (JSDOM or Playwright):
- Instantiate page, add expense rows, set amounts, assert totals.
- Import provided sample JSON and verify DOM reflects expected count & totals.
- Export JSON after modifications; re-import; assert equality of serialized model ignoring IDs.
- Theme change triggers body class + persistent localStorage.

---
## 35. Versioning & Release Tagging (Optional Future)
If adopting releases:
- Use semantic versioning (MAJOR.MINOR.PATCH).
- MAJOR: Change in export schema or breaking HTML IDs.
- MINOR: Additive features (new summary, theme).
- PATCH: Bug fixes, styling adjustments.
  Maintain CHANGELOG beyond README high-level bullet list.

---
## 36. Known Opportunities for Refactor (Non-urgent)
- Replace index-based cell access (`row.children[n]`) with data attributes or named queries to reduce brittle coupling.
- Abstract repeated table row building patterns into a generic factory with a schema descriptor.
- Extract chart logic into a mini module to allow alternative visualizations (bar distribution, line over time if daily tracking added).

---
## 37. Glossary
| Term | Meaning |
|------|---------|
| Legacy Option | Removed category/payment value still present in existing rows |
| Billing Cycle | User-configured date window (15th boundary logic) driving time-based metrics |
| Remaining Budget | Income minus planned/actual outgoing amounts (card + installments + fixed + expected savings) |
| Installment Total Remaining | Amount × remainingMonths, per row |

---
## 38. Do Not Break List (Critical Contracts)
1. Element IDs used by JS: `expenseTable`, `installmentsTable`, `fixedCostsTable`, `cashExpensesTable`, all summary IDs.
2. Export JSON root keys.
3. CSV section headers (including their exact spelling and capitalization after `#`).
4. Theme names: `light`, `dark`, `dracula`, `vscode`, `pink` (storage sync relies on these exact strings).
5. Auto-added initial rows on empty import for UX.

---
## 39. Fast Start for AI Agents
If asked to add feature X:
1. Confirm if X touches data model → update import/export + COPILOT.md schema.
2. Update HTML first (IDs), then implement JS logic inside `updateSummary()` or new helper.
3. Wire event listeners after element references near top of IIFE.
4. Run `updateSummaries()` + `updateSummary()` after any new recalculation points.
5. Maintain legacy behavior for removed options.

---
## 40. Final Notes
This project intentionally optimizes for clarity over abstraction. Prefer readable imperative code. Any introduced complexity should provide clear user value or maintainability benefits.

Keep this file updated; it is your north star for coherent evolution.
