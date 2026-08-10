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
| Routing | react-router-dom 6 (`BrowserRouter`) |
| Styling | Tailwind CSS 3 + CSS custom properties (shadcn token scheme) |
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
  CycleSelector, ConfigSection, ConfigList, OptionSelect, AmountInput, SectionHeader
  FinancialSummary, SummaryTables, ExpenseCharts, TopTransactions
  ProtectedRoute
  tables/                      ExpensesTable, InstallmentsTable, FixedCostsTable, CashExpensesTable
  ui/                          shadcn primitives (vendored — regenerate, don't hand-restyle)
  bento/BentoGrid.tsx          Vendored Kokonut bento grid used by FinancialSummary
src/hooks/                     useTheme, useAltAShortcut
src/lib/                       authCookie, cycle, format, io, palette, utils (pure helpers)
src/pages/                     Home, Docs, Login, Callback
src/state/                     types, reducer, AppContext, selectors
src/index.css                  Tailwind layers + light/dark design tokens
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

Actions: `ADD_ROW`, `DELETE_ROW`, `UPDATE_EXPENSE`, `UPDATE_INSTALLMENT`, `UPDATE_FIXED`,
`UPDATE_CASH`, `ADD_CONFIG`, `REMOVE_CONFIG`, `SET_CYCLE`, `SHIFT_CYCLE`, `SET_INCOME`,
`SET_SAVINGS`, `LOAD`.

Conventions:

- Update actions take a `patch: Partial<Omit<Row, 'id'>>`, so a component sends only the field it
  changed.
- IDs come from `state.nextIds` (monotonic per table) and are UI keys only — they are never
  exported.
- `expectedIncome` / `expectedSavings` are stored as **strings** so the input can be empty; parse
  with `parseFloat(...) || 0` at the point of use.
- `LOAD` resets IDs from 1, falls back to current config lists when the imported list is empty, and
  seeds one blank row per table so the UI is never an empty grid.

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
`generatePalette(count, seedHue)` from `src/lib/palette.ts` — evenly spaced HSL hues, seeded 330
for category and 210 for payment so the two charts stay visually distinct. Animation is off
(`isAnimationActive={false}`); a zero total renders a "No data" ring instead of an empty chart.
The legend beneath each donut carries the accessible text, and the chart wrapper has
`role="img"` + `aria-label`.

---

## 8. Import / Export

`ImportExportBar` (in the header, hidden on the Docs page) exports `toDataModel(state)` as
pretty-printed JSON via `downloadBlob`, named `expense_export_<YYYY-MM-DD-HHmm>.json`. Import reads
a file with `readFileAsText`, `JSON.parse`s it, and dispatches `LOAD`; a parse failure is a plain
`alert('Invalid JSON file.')`.

**JSON is the only supported format — CSV import/export was removed.** Don't reintroduce it
without a reason; JSON already covers backup/restore.

```jsonc
{
  "cycleStart": "YYYY-MM-DD",
  "cycleEnd": "YYYY-MM-DD",
  "expectedIncome": 0,
  "expectedSavings": 0,
  "categories": ["Grocery", "..."],
  "cardPaymentMethods": ["HSBC", "..."],
  "cashPaymentMethods": ["Cash", "..."],
  "expenses":     [{ "description": "", "amount": 0, "category": "", "payment": "", "validated": false }],
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

Light and dark **only** — the old light/dark/dracula/vscode/pink set was dropped in the React
rewrite. `THEME_NAMES` in `src/state/types.ts` is the source of truth. `useTheme` persists the
choice in `localStorage['et_theme']`, toggles the `.dark` class on `<html>`, and syncs across tabs
via the `storage` event. Colors are HSL custom properties in `src/index.css` under `:root` and
`.dark`; add tokens there, not as hard-coded Tailwind colors, so both themes stay covered.

### Components

- `src/components/ui/` is vendored shadcn output (config in `components.json`, base color `slate`).
  Prefer `npx shadcn@latest add <component>` over writing primitives by hand. Note `ui/checkbox.tsx`
  is a plain styled `<input type="checkbox">`, not the Radix one — it takes `onChange`, not
  `onCheckedChange`.
- `src/components/bento/BentoGrid.tsx` is vendored Kokonut, used only by `FinancialSummary`.
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
  semantic tokens (`bg-card`, `text-muted-foreground`, `surface-alt`, `bg-footer`) rather than raw
  palette colors.
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

---

## 13. Testing

There is no test setup today. If you add one, Vitest + React Testing Library fits the stack with
the least friction, and the highest-value targets are the pure logic:

1. `computeCycleContaining` across the 14th/15th boundary and December→January.
2. `daysBetweenExclusive` for before/inside/after the cycle and for invalid input.
3. `reducer` `LOAD`: ID reset, empty-list fallback, blank-row seeding.
4. `computeSummary` arithmetic, including negative `remainingBudget` and the `null` per-day case.
5. JSON export → import round-trip equality ignoring IDs.

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
