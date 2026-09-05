# Project Instructions (AI Agents & Contributors)

Technical and architectural guide for the **Personal Expense Manager**. It is tool-agnostic: any
AI assistant (Claude Code, Copilot, Cursor, …) or human contributor should read this before making
changes. `README.md` is the user-facing overview; this file is the implementation reference.

> Keep this file in sync with the code. If a change alters routing, auth, the data model, or the
> export schema, update the matching section here in the same PR.

---

## 1. What This Project Is

A single-page **React + TypeScript** expense manager for one person's monthly budget. It tracks
credit card expenses, installments/monthly bills, fixed costs, and cash spending across a
15th→15th billing cycle, and derives live summaries and distribution charts.

Two properties drive most design decisions:

- **No application backend.** All expense data lives in React state for the session. The only
  persistence is manual JSON export/import. There is no database and no API that stores expenses.
- **Authentication is a gate, not a data layer.** Auth0 (Google connection) protects access to the
  deployed site. It does not sync, store, or scope any expense data — signing in as a different
  user shows the same empty in-memory app.

Deployed on Cloudflare Pages: <https://personal-expense-manager.pages.dev/>

---

## 2. Stack

| Concern | Choice |
|---------|--------|
| Framework | React 18 (function components + hooks only) |
| Language | TypeScript 5, `strict: true`, `noUnusedLocals`/`noUnusedParameters` on |
| Build | Vite 8 (`@vitejs/plugin-react`) |
| Routing | react-router-dom 7 (`BrowserRouter`) |
| Styling | factory-ui design system (`theme/tokens.css` + `theme/components.css`, see `theme/README.md`) with Tailwind CSS 3 bridged onto its tokens |
| UI primitives | shadcn/ui components vendored in `src/components/ui/` (Radix under the hood) |
| Charts | Recharts (`PieChart`) |
| Icons | lucide-react |
| Auth | `@auth0/auth0-react` (SPA, PKCE) + `jose` for edge JWT verification |
| Hosting | Cloudflare Pages + Pages Functions |
| Tests | **None yet.** See §13. |

Path alias: `@/*` → `src/*` (declared in both `vite.config.ts` and `tsconfig.app.json` — update
both if it changes).

### Commands

```bash
npm install
npm run dev      # Vite dev server, http://localhost:5173
npm run build    # tsc -b (type-check) + vite build → dist/
npm run preview  # serve the built bundle
```

There is no linter, formatter, or test runner configured. `npm run build` is the only automated
check — run it before declaring work done, since `tsc -b` catches unused vars and type errors that
`npm run dev` tolerates.

---

## 3. Repository Layout

```
index.html                     Vite entry + SEO/OG meta tags
src/main.tsx                   React root
src/App.tsx                    Providers + route table
src/auth/
  Auth0ProviderWithNavigate    Auth0Provider config (Google connection, audience, scopes)
  AuthCookieSync               Mirrors the access token into the edge cookie
src/components/
  Header, ThemeToggle, UserProfile, ImportExportBar
  CycleSelector, ConfigSection, ConfigList, OptionSelect, AmountInput
  SectionHeader, SectionMarker, StatusBar
  FinancialSummary, SummaryTables, ExpenseCharts, TopTransactions
  ImportCardCsvDialog          Card statement CSV import (hand-rolled modal, no Radix dialog dep)
  ProtectedRoute
  tables/                      ExpensesTable, InstallmentsTable, FixedCostsTable, CashExpensesTable
  ui/                          shadcn primitives (vendored, restyled onto factory-ui tokens)
theme/                         factory-ui design system: tokens.css, components.css, README.md,
                               index.html (living reference — open it in a browser)
src/hooks/                     useTheme, useAltAShortcut, useFxTokens
src/lib/                       authCookie, cycle, format, io, palette, utils (pure helpers)
  cardCsv.ts                   Bank CSV tokenizer + DBS/POSB statement parser
  importPlan.ts                Dedup fingerprints and the new/duplicate/skipped classification
src/pages/                     Home, Docs, Login, Callback
src/state/                     types, reducer, AppContext, selectors
src/index.css                  Tailwind layers + the bridge from shadcn names onto fx tokens
functions/_middleware.js       Cloudflare edge auth gate (runs first)
functions/[[path]].js          Cloudflare canonical Link header injection
public/_redirects              SPA fallback: /* → /index.html 200
public/screenshots/            Images used by README, Docs page, and OG tags
.env.example / .dev.vars.example  Required environment variables
```

---

## 4. Authentication

### Flow

1. `ProtectedRoute` wraps `/`, `/docs`, and the `*` fallback. Anonymous users are redirected to
   `/login` with `state.returnTo` set to the requested path.
2. `Login` renders a single "Login with Google" button calling
   `loginWithRedirect({ appState: { returnTo } })`.
3. `Auth0ProviderWithNavigate` pins `connection: 'google-oauth2'`, so Auth0 skips its own account
   picker and goes straight to Google. It requests `openid profile email expenses:read
   expenses:write` against `VITE_AUTH0_AUDIENCE`, uses refresh tokens, and keeps tokens in
   **memory** (`cacheLocation: 'memory'`) rather than localStorage.
4. Auth0 redirects to `/callback`. The provider performs the code exchange; `onRedirectCallback`
   navigates to `returnTo`. `Callback` only renders a spinner or the error card.
5. `AuthCookieSync` (mounted above the router content) writes the access token to the
   `expense_auth` cookie and clears it on logout or token failure.
6. `UserProfile` shows the Google avatar/name and logs out via
   `logout({ logoutParams: { returnTo: origin + '/login' } })`, clearing the cookie first.

### Edge enforcement (`functions/_middleware.js`)

Runs before every request on Cloudflare Pages. It verifies the `expense_auth` cookie as an RS256
JWT against the tenant JWKS (issuer `https://${AUTH0_DOMAIN}/`, audience `AUTH0_AUDIENCE`) and
302-redirects unauthenticated HTML navigations to `/login`. Details that matter when changing it:

- Only **HTML navigations** are gated: `GET` requests whose last path segment has no `.` in it.
  Hashed bundles and images pass through untouched.
- `/login` and `/callback` are in `PUBLIC_PATHS` and always pass.
- It **fails open** when `AUTH0_DOMAIN`/`AUTH0_AUDIENCE` are unset (e.g. an unconfigured preview),
  logging a warning. The SPA route guard is still in force, so a misconfiguration degrades rather
  than bricking the deployment.
- The JWKS set is module-scoped so keys are reused across requests in an isolate.

### The cookie contract

`expense_auth` is written by the SPA in `src/lib/authCookie.ts`: `Path=/`, `SameSite=Strict`,
`Max-Age` 24 h, `Secure` only on HTTPS. It is deliberately **not** HttpOnly — the SPA owns the
token and must be able to set and clear it, which means a `HttpOnly` flag would break logout and
refresh. Treat this as a session gate for a personal deployment, not as a hardened auth boundary;
the real protection is that the JWT is signature-verified at the edge.

If you rename the cookie, change it in `src/lib/authCookie.ts` **and** `functions/_middleware.js`.

### Environment variables

Browser (`.env.local`, copy from `.env.example`) — these are baked into the bundle at build time
and are public by design:

```
VITE_AUTH0_DOMAIN, VITE_AUTH0_CLIENT_ID, VITE_AUTH0_AUDIENCE
```

Pages Functions runtime (`.dev.vars` for `npx wrangler pages dev dist`, or the Cloudflare
dashboard for deploys):

```
AUTH0_DOMAIN, AUTH0_AUDIENCE
```

Both `.env.local` and `.dev.vars` are gitignored. Never commit real tenant values.

Auth0 dashboard expectations: Allowed Callback URL `<origin>/callback`, Allowed Logout URL
`<origin>/login`, Allowed Web Origins `<origin>`, refresh token rotation enabled, and an API whose
identifier equals the audience with `expenses:read`/`expenses:write` scopes.

---

## 5. Routing

| Path | Component | Guard |
|------|-----------|-------|
| `/login` | `Login` | public |
| `/callback` | `Callback` | public |
| `/` | `Home` | `ProtectedRoute` |
| `/docs` | `Docs` | `ProtectedRoute` |
| `*` | `Home` | `ProtectedRoute` |

Provider order in `App.tsx` is load-bearing: `BrowserRouter` → `Auth0ProviderWithNavigate`
(needs `useNavigate`) → `AuthCookieSync` + `AppProvider` → `Routes`.

Because these are client-side routes, `public/_redirects` must keep the SPA fallback or a direct
hit on `/docs` 404s.

---

## 6. State Management

`useReducer` + two contexts in `src/state/`:

- `AppContext.tsx` — `AppProvider`, `useAppState()`, `useAppDispatch()`. State and dispatch are
  separate contexts so dispatch-only consumers don't re-render on every keystroke.
- `types.ts` — `AppState`, row interfaces, `DataModel`, `ThemeName`.
- `reducer.ts` — all mutations, defaults (`DEFAULT_CATEGORIES`, `DEFAULT_CARD_PAYMENTS`,
  `DEFAULT_CASH_PAYMENTS`), and `createInitialState()`.
- `selectors.ts` — every derived value. Nothing computed is stored in state.

Actions: `ADD_ROW`, `DUPLICATE_LAST_EXPENSE`, `DELETE_ROW`, `UPDATE_EXPENSE`, `UPDATE_INSTALLMENT`,
`UPDATE_FIXED`, `UPDATE_CASH`, `ADD_CONFIG`, `REMOVE_CONFIG`, `SET_CYCLE`, `SHIFT_CYCLE`,
`SET_INCOME`, `SET_SAVINGS`, `IMPORT_EXPENSES`, `LOAD`.

Conventions:

- Update actions take a `patch: Partial<Omit<Row, 'id'>>`, so a component sends only the field it
  changed.
- `ADD_ROW` on `expenses` carries the last row's category and card into the new blank row (falling
  back to the first configured option when the list is empty or the value was since removed).
  `DUPLICATE_LAST_EXPENSE` copies the whole last row — description and amount included — and resets
  `validated` to `false`.
- IDs come from `state.nextIds` (monotonic per table) and are UI keys only — they are never
  exported.
- `expectedIncome` / `expectedSavings` are stored as **strings** so the input can be empty; parse
  with `parseFloat(...) || 0` at the point of use.
- `LOAD` resets IDs from 1, falls back to current config lists when the imported list is empty, and
  seeds one blank row per table so the UI is never an empty grid.
- `IMPORT_EXPENSES` **appends** rows (it is not a `LOAD`) and drops the table's lone seeded blank
  row so an import doesn't leave an empty row above the transactions. Rows the user has started
  typing are never removed.

### Selectors

`sumExpenses`, `sumInstallmentMonthly`, `sumInstallmentRemaining`, `sumFixedCosts`,
`sumCashExpenses`, `totalsByCategory`, `totalsByPayment`, `topTransactions`, `computeSummary`,
`toDataModel`.

`computeSummary` returns the whole `FinancialSummary` shape:

```
remainingBudget  = expectedIncome − cardTotal − monthlyInstallments − fixedCosts − expectedSavings
remainingPerDay  = remainingBudget / daysRemaining, or null when the cycle is not active
projectedSavings = the user-entered expectedSavings
```

Note the asymmetry, which is intentional: **cash expenses are reported but excluded from
`remainingBudget`**, which models card/fixed obligations against income. Don't "fix" this without
the maintainer's agreement.

`totalsByPayment` aggregates card expenses **and** installment monthly amounts; `totalsByCategory`
covers card expenses only (cash expenses carry a category but are not merged in).

---

## 7. Domain Logic

### Billing cycle (`src/lib/cycle.ts`)

- `computeCycleContaining(date)` — on or after the 15th, the cycle is this month's 15th → next
  month's 15th; before the 15th it is last month's 15th → this month's 15th.
- `shiftCycle(start, end, delta)` — moves both endpoints by ±N months, re-anchoring to the 15th.
- `daysBetweenExclusive(start, end, today?)` — `totalDays` is inclusive (`end − start + 1`);
  `daysElapsed` counts the current day once it is inside the cycle; `daysRemaining` is the
  non-negative remainder. Invalid or reversed dates return all zeros rather than throwing.
- `formatYMD` — the canonical `YYYY-MM-DD` form used everywhere in state and exports.

Cycle dates are stored as plain `YYYY-MM-DD` strings and parsed as **local** time. When adding date
code, keep using this convention; don't introduce `Date` objects into state or UTC parsing, which
would shift cycle boundaries by a day in some timezones.

### Card statement CSV import

`ImportCardCsvDialog` (opened from the "Import CSV" button on the Credit Card Expenses header)
reads the **unbilled transactions** CSV that DBS/POSB internet banking exports and appends the
transactions the table does not already hold. Two pure modules do the work:

- `src/lib/cardCsv.ts` — `parseCsv` (RFC 4180 tokenizer) and `parseCardCsv`, which finds the
  `Transaction Date` header rather than assuming a fixed preamble, reads the card label and
  "as at" date from the preamble, and converts `"15 Aug 2026"` to a local `YYYY-MM-DD` **built
  from parts**, never via `new Date(string)`, for the same timezone reason as the cycle dates.
- `src/lib/importPlan.ts` — `buildImportPlan` classifies every line as `new`, `duplicate`,
  `outside-cycle`, `credit`, or `invalid`, and `toExpenseRows` turns the `new` ones into expense
  rows. Nothing is written until the user confirms in the dialog.

**Deduplication.** An unbilled export is cumulative — the file pulled on the 29th repeats
everything from the file pulled on the 22nd — and the bank issues no transaction id. Each charge
is therefore fingerprinted from the fields that are stable once a charge exists:

```
card identity | transaction date | description | amount | occurrence number
```

hashed to `dbs1:<16 hex>` and stored as `Expense.importKey`. Points that are load-bearing:

- The **occurrence number** is what makes two genuinely identical charges (same shop, same
  amount, same day — the sample file has a pair) import as two rows while a re-import of that
  same pair adds nothing. It is assigned over every charge in the file **before** any filtering,
  so a row's fingerprint never depends on the cycle in force or on where the export was cut off.
- **Card identity** is the preamble label, which carries the masked card number, so dedup holds
  even if the user picks a different payment-method name on a later import.
- Posting date and `Transaction Status` are deliberately **excluded**: a charge that moves from
  Pending to Settled must keep the same fingerprint. The consequence is that a charge whose
  amount changes on settlement (tips, fuel holds) reads as a new transaction — see §14.
- `importKey` is exported and restored by `LOAD`, so dedup survives a JSON round trip. Rows typed
  by hand have no key and are never matched against an import.

**Cycle validation.** Transactions outside `cycleStart … cycleEnd` are listed but not imported;
the user switches cycle and imports the same file again to pick them up. Credit lines (refunds,
card payments) are reported and skipped rather than imported as negatives, since no total in the
app models a negative expense.

### Legacy config options

Removing a category or payment method does **not** rewrite existing rows. `OptionSelect` detects a
value missing from `options` and appends it as an extra italicised `"<value> (legacy)"` item, so
historical rows keep rendering and remain selectable until the user changes them. Any new select
over a configurable list should go through `OptionSelect` for this reason.

### The `validated` flag

`Expense`, `Installment`, and `FixedCost` carry `validated: boolean` (checkbox column, "have I
confirmed this against the statement?"). `CashExpense` deliberately does **not**. The flag is
exported and re-imported (`Boolean(...)`-coerced) but never affects any total.

### Top 10 transactions

`topTransactions(state, 10)` merges card expenses and installments (cash and fixed costs are
excluded), drops fully blank rows, sorts by amount descending, and tags each with its source.
Installments carry a `"<n> mo left"` meta line.

### Charts

`ExpenseCharts` renders two Recharts donuts (by category, by payment/card) driven by
`generatePalette(count, base)` from `src/lib/palette.ts` — one accent (`--fx-machine`) stepped
through opacity, so a distribution reads as a single ramp rather than a rainbow. Slices are sorted
by value so the ramp doubles as magnitude. Recharts sets SVG presentation attributes, which can't
resolve `var()`, so `useFxTokens` hands the chart the *computed* token values and re-reads them
when the theme flips. Animation is off
(`isAnimationActive={false}`); a zero total renders a "No data" ring instead of an empty chart.
The legend beneath each donut carries the accessible text, and the chart wrapper has
`role="img"` + `aria-label`.

---

## 8. Import / Export

`ImportExportBar` (in the header, hidden on the Docs page) exports `toDataModel(state)` as
pretty-printed JSON via `downloadBlob`, named `expense_export_<YYYY-MM-DD-HHmm>.json`. Import reads
a file with `readFileAsText`, `JSON.parse`s it, and dispatches `LOAD`; a parse failure is a plain
`alert('Invalid JSON file.')`.

**JSON is the only supported format for backup/restore, and the only format that is exported.**
The removed general-purpose CSV export stays removed; JSON already covers backup/restore. The one
CSV path in the app is the **one-way card statement import** described in §7, which solves a
different problem (getting a bank's transaction list in) and never writes CSV.

```jsonc
{
  "cycleStart": "YYYY-MM-DD",
  "cycleEnd": "YYYY-MM-DD",
  "expectedIncome": 0,
  "expectedSavings": 0,
  "categories": ["Grocery", "..."],
  "cardPaymentMethods": ["HSBC", "..."],
  "cashPaymentMethods": ["Cash", "..."],
  "expenses":     [{ "description": "", "amount": 0, "category": "", "payment": "", "validated": false,
                     "importKey": "dbs1:…" /* optional; only on rows added by the CSV import */ }],
  "installments": [{ "description": "", "amount": 0, "remainingMonths": 0, "card": "", "validated": false }],
  "fixedCosts":   [{ "description": "", "amount": 0, "validated": false }],
  "cashExpenses": [{ "description": "", "amount": 0, "paymentMethod": "", "category": "" }]
}
```

`toDataModel` filters out rows that are entirely blank, so an export never round-trips the seeded
placeholder rows. There is currently **no `schemaVersion` field**; if the schema ever changes
incompatibly, add one and branch in the `LOAD` case rather than silently reinterpreting old files.

Rules for schema changes: add optional fields with defaults applied in `LOAD`, never rename or
repurpose an existing key, and update this section plus the README schema block together.

---

## 9. UI, Theming, Accessibility

### Theming

The visual system is **factory-ui**, vendored under `theme/` (read `theme/README.md` first — its
rules are short and binding). `src/main.tsx` imports `theme/tokens.css` and `theme/components.css`
before `src/index.css`; `tailwind.config.ts` maps every Tailwind colour, font, size and radius onto
an `--fx-*` token, and `src/index.css` holds the few app-level aliases (`--app-popover`,
`.fx-label`, `.fx-figure`, `.bg-footer`). Never type a hex or pixel value in a component: if a
token is missing, add it to `theme/tokens.css`.

Accent meanings are fixed and the app leans on them: **amber** (`human`) for anything the user
decides — income, savings target, cycle dates, config lists, the Validated tick; **teal**
(`machine`) for anything derived — every total, the remaining budget, charts, primary buttons;
**blue** (`thought`) for asides and the single serif-italic phrase per page; **coral** (`signal`)
for section markers (`SectionMarker`, eyebrows) and the over-budget / legacy-value warnings.
Choosing an accent because it looks nice in a spot breaks the system.

Light and dark **only** — dark is the default because the tokens are dark-first. `THEME_NAMES` in
`src/state/types.ts` is the source of truth. `useTheme` persists the choice in
`localStorage['et_theme']`, toggles the `.dark` class **and** the `data-fx-theme="light"`
attribute on `<html>` (the latter is what `tokens.css` keys the light palette on), and syncs
across tabs via the `storage` event. An inline script in `index.html` applies the stored theme
before first paint; keep it in step with `useTheme`.

Fonts (Sora, Inter, JetBrains Mono, Instrument Serif) load from Google Fonts in `index.html`; the
tokens declare system fallbacks so nothing depends on them arriving.

### Components

- `src/components/ui/` started as shadcn output (config in `components.json`) but has been
  restyled onto factory-ui: buttons are mono/uppercase/hard-edged with accent washes, inputs are
  transparent with hairline rules, table heads are `.fx-label`. If you regenerate a primitive with
  `npx shadcn@latest add`, re-apply that treatment. Note `ui/checkbox.tsx` is a plain styled
  `<input type="checkbox">`, not the Radix one — it takes `onChange`, not `onCheckedChange`.
- `cn()` in `src/lib/utils.ts` uses `extendTailwindMerge` so the custom sizes (`text-title`,
  `text-display`, …) aren't mistaken for colours and dropped. Register new custom `text-*` or
  `font-*` names there too.
- `FinancialSummary` is hand-laid-out: one loud figure (remaining budget), two supporting figures,
  two amber input panels, four quiet ledger totals. Keep that hierarchy — "one loud thing per
  screen" is a rule of the design system, not a preference.
- The four tables under `components/tables/` follow one shape: `SectionHeader` (with a "↓ bottom"
  anchor link) → bordered `Table` with a totals `TableFooter` → an "Add …" button. Copy that
  structure for any new table.
- `AmountInput` keeps a local string while typing and commits a parsed number on every change, so
  partial input like `"1."` doesn't get clobbered. Use it for all money and count fields.

### Accessibility expectations

Icon-only buttons need `aria-label` (delete rows, config removal, theme toggle). Charts need
`role="img"` + `aria-label` plus the textual legend. Loading spinners carry labels such as
"Checking session". Keep native controls and document tab order — don't add custom focus traps.

### Keyboard

`useAltAShortcut` binds **Alt + A** at the document level to add a credit card expense row, and
no-ops while focus is in an `INPUT`/`SELECT`/`TEXTAREA`. Gate any new shortcut the same way.

---

## 10. Cloudflare Pages

Build command `npm run build`, output directory `dist`. Two functions, both auto-discovered:

| File | Role |
|------|------|
| `functions/_middleware.js` | Auth gate; runs before route functions on every request |
| `functions/[[path]].js` | Awaits `context.next()`, then adds `Link: <url>; rel="canonical"` to HTML responses, stripping `utm_*`, `gclid`, `fbclid` |

The canonical header is computed from the request origin so forks and preview deployments stay
SEO-correct without hard-coding a domain.

Local edge testing needs a build first: `npm run build && npx wrangler pages dev dist` with
`.dev.vars` populated. `npm run dev` alone does **not** execute the functions, so the middleware
gate is invisible in dev — only the SPA `ProtectedRoute` applies there.

---

## 11. Coding Conventions

- Function components with hooks; no classes, no HOCs.
- Named exports (`export function Foo`) — the codebase has no default exports.
- Import via the `@/` alias, not long relative chains.
- Keep `src/lib/` pure: no React imports, no DOM state, easy to test later.
- Derive in selectors and render from that; don't cache computed values in state or `useMemo`
  unless a profile shows a real cost.
- Tailwind utilities inline; use `cn()` from `@/lib/utils` for conditional classes. Reach for the
  token-backed names (`text-ink-dim`, `border-rule-strong`, `bg-surface`, `text-machine`,
  `border-l-human`, `.fx-label`, `.fx-figure`) or the library classes (`fx-eyebrow`, `fx-tag`,
  `fx-panel`, `fx-statusbar`) rather than raw palette colours. Tailwind's `/opacity` modifier
  does not work on these colours — use the `*-wash` / `*-edge` tokens instead.
- Handle failure gracefully — skip bad rows, coerce with `|| 0`, fail open at the edge — instead of
  throwing into the user's face.
- Comments explain *why* (see `_middleware.js` and `authCookie.ts` for the intended density). Don't
  narrate what the code plainly does.

---

## 12. Contracts Not To Break

1. **Export JSON keys** in §8 — external backups depend on them.
2. **Cookie name `expense_auth`** — shared between `src/lib/authCookie.ts` and
   `functions/_middleware.js`.
3. **Routes** `/login` and `/callback` — registered in Auth0 and hard-coded in `PUBLIC_PATHS`.
4. **Theme names** `light` / `dark` and the `et_theme` storage key — cross-tab sync relies on them.
5. **`public/_redirects` SPA fallback** — deep links break without it.
6. **The `@/` path alias** — mirrored in `vite.config.ts` and `tsconfig.app.json`.
7. **Legacy-option behavior** in `OptionSelect` — removing a config value must not silently
   rewrite historical rows.
8. **Seeded blank rows** after `LOAD` — the UI assumes at least one row per table.
9. **The `importKey` fingerprint recipe** in §7, including the `dbs1:` prefix. Changing what goes
   into the hash makes every previously imported row unrecognisable, so the next import of an
   overlapping statement duplicates everything. If it must change, bump the prefix (`dbs2:`) and
   decide explicitly what happens to rows carrying the old one.

---

## 13. Testing

There is no test setup today. If you add one, Vitest + React Testing Library fits the stack with
the least friction, and the highest-value targets are the pure logic:

1. `computeCycleContaining` across the 14th/15th boundary and December→January.
2. `daysBetweenExclusive` for before/inside/after the cycle and for invalid input.
3. `reducer` `LOAD`: ID reset, empty-list fallback, blank-row seeding.
4. `computeSummary` arithmetic, including negative `remainingBudget` and the `null` per-day case.
5. JSON export → import round-trip equality ignoring IDs.
6. `buildImportPlan`: re-importing an overlapping statement adds nothing; two identical charges on
   one day import as two rows; out-of-cycle, credit, and malformed lines are classified, not
   imported; dedup still holds after an export → import round trip.

Keep test tooling in `devDependencies` only; it must not reach the shipped bundle.

---

## 14. Known Limitations

- No persistence between reloads — closing the tab loses everything not exported.
- Auth identifies the user but data is not per-user, synced, or stored server-side.
- Deleting a row is immediate and irreversible; there is no undo.
- No sorting, filtering, or search on the tables.
- Single implicit currency: amounts are formatted with `toLocaleString`, with no currency symbol
  or conversion.
- Installments do not auto-decrement `remainingMonths` when the cycle shifts.
- CSV import understands the DBS/POSB unbilled export only; other banks' layouts are rejected with
  a message rather than guessed at.
- A charge whose **amount changes between Pending and Settled** (tips, fuel holds) imports a
  second time as a new row, because the amount is part of the fingerprint. Delete the stale row by
  hand. Dropping the amount from the fingerprint would fix this but would break repeated identical
  charges, which are the commoner case.
- Deleting an imported row and re-importing the same statement brings it back — the fingerprint
  records what was imported, not what was deliberately removed.
- No service worker, so there is no true offline mode.
- Tokens live in memory, so a hard refresh triggers a silent refresh-token round trip.

---

## 15. Working On This Codebase

Adding a feature, in the usual order:

1. If it touches data: extend `src/state/types.ts`, then the reducer (including the `LOAD` case
   with a default for the new field), then `toDataModel`, then §8 here and the README schema.
2. Put derived values in `selectors.ts` — never compute totals inside a component.
3. Build the UI from existing primitives (`ui/`, `AmountInput`, `OptionSelect`, `SectionHeader`)
   and mount it in `src/pages/Home.tsx`.
4. Check both themes and a narrow viewport.
5. Run `npm run build` — `tsc -b` is strict about unused variables and will fail the build.
6. If the UI changed materially, refresh `public/screenshots/` and the `Docs` page, which
   documents the app for end users.

Touching auth is the one genuinely risky area: verify the SPA guard **and** the edge middleware,
test a full logged-out → Google → `returnTo` round trip, and confirm logout clears the cookie.
