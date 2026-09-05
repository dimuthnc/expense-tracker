import { useEffect, type ReactNode } from 'react';
import { Header } from '@/components/Header';

const STEPS = [
  { id: 'setup', title: 'Set up your billing cycle' },
  { id: 'credit', title: 'Add credit card expenses' },
  { id: 'installments', title: 'Track installments & monthly bills' },
  { id: 'fixed', title: 'Add fixed monthly costs' },
  { id: 'cash', title: 'Track cash expenses' },
  { id: 'summary', title: 'Read the summary' },
  { id: 'importCsv', title: 'Import your card statement (CSV)' },
  { id: 'importExport', title: 'Import & export (JSON)' },
  { id: 'themes', title: 'Themes' },
  { id: 'tips', title: 'Tips & shortcuts' },
  { id: 'privacy', title: 'Privacy' },
  { id: 'troubleshooting', title: 'Troubleshooting' },
] as const;

/** Numbered because the guide really is a sequence: the steps mirror the page top to bottom. */
function Step({ index, children }: { index: number; children: ReactNode }) {
  const step = STEPS[index];
  return (
    <section id={step.id} className="fx-panel scroll-mt-6">
      <div className="fx-panel__head">
        <span className="fx-panel__badge">{index + 1}</span>
        <h2 className="m-0 font-display text-body font-semibold leading-tight tracking-tight">
          {step.title}
        </h2>
        <span className="fx-panel__count">
          {index + 1} / {STEPS.length}
        </span>
      </div>
      <div className="max-w-[62ch] space-y-3 text-small text-ink-dim [&_li]:pl-1 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_p]:m-0 [&_strong]:font-semibold [&_strong]:text-ink [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}

/** An aside. Blue, because it comments on the step rather than being part of it. */
function Aside({ children }: { children: ReactNode }) {
  return (
    <p className="border-l-bar border-l-thought pl-4 text-small text-ink-dim">{children}</p>
  );
}

function Figure({ src, alt, caption }: { src: string; alt: string; caption: string }) {
  return (
    <figure className="m-0 mt-4 max-w-none">
      <img src={src} alt={alt} className="block w-full rounded-sm border border-rule-strong" />
      <figcaption className="fx-label mt-2 normal-case tracking-[0.08em]">{caption}</figcaption>
    </figure>
  );
}

function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="fx-tag px-1.5 py-0.5 text-ink">{children}</kbd>;
}

export function Docs() {
  useEffect(() => {
    document.title = 'Documentation • Personal Expense Manager';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        'content',
        'Beginner-friendly guide to using the Personal Expense Manager: setup, adding expenses, importing a card statement CSV, installments, fixed costs, cash expenses, summaries, and import/export.',
      );
    }
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8">
      <Header
        title="Documentation"
        eyebrow={
          <>
            Reference
            <span className="fx-dot" aria-hidden="true" />
            User guide
          </>
        }
        showImportExport={false}
        docsLink={false}
        backLink
      />

      <main className="mx-auto max-w-4xl">
        <p className="fx-lead">
          This tool keeps everyday spending, card bills, subscriptions and cash in one place and
          totals them against <em className="font-quote not-italic text-thought [font-style:italic]">one billing cycle</em>.
          Nothing is saved online: your data stays in the page while it is open. Export a file to
          keep a copy.
        </p>

        <nav className="mt-8 border-l-bar border-l-thought pl-5" aria-label="On this page">
          <p className="fx-label m-0 mb-3">On this page</p>
          <ol className="m-0 grid list-none gap-x-8 gap-y-1.5 p-0 sm:grid-cols-2">
            {STEPS.map((s, i) => (
              <li key={s.id} className="flex items-baseline gap-3 text-small">
                <span className="fx-figure font-mono text-micro text-ink-faint">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <a href={`#${s.id}`} className="fx-link">
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <Figure
          src="/screenshots/preview.png"
          alt="Overview of the Personal Expense Manager interface"
          caption="Overview of the main dashboard"
        />

        <div className="fx-stack mt-10">
          <Step index={0}>
            <ol>
              <li>
                At the top of the app, set &ldquo;Cycle from&rdquo; and &ldquo;Cycle to.&rdquo; By
                default it uses the 15th to the 15th around today.
              </li>
              <li>Use the arrows to move to the previous or next cycle.</li>
            </ol>
            <Aside>
              &ldquo;Days remaining&rdquo; and the per-day budget are calculated from these dates.
            </Aside>
            <Figure
              src="/screenshots/billing-cycle.png"
              alt="Billing cycle date controls and previous/next buttons"
              caption="Billing cycle controls"
            />
          </Step>

          <Step index={1}>
            <ol>
              <li>Click &ldquo;Add expense.&rdquo;</li>
              <li>Type a short description and the amount.</li>
              <li>Choose a category and the card you used.</li>
            </ol>
            <p>
              New rows start with the category and card of the row above, so a run of expenses on
              the same card needs no re-picking. For expenses that repeat almost exactly, click
              &ldquo;Add duplicate row&rdquo; instead. It copies the last row in full (description
              and amount too, unticking Validated) so you only edit what differs.
            </p>
            <p>
              The table footer shows the total of your card expenses. The summary tables and charts
              update automatically.
            </p>
            <Figure
              src="/screenshots/credit-expenses.png"
              alt="Credit card expenses table with fields for description, amount, category, and card"
              caption="Credit card expenses table"
            />
          </Step>

          <Step index={2}>
            <ol>
              <li>Click &ldquo;Add item&rdquo; in the installments section.</li>
              <li>Enter the monthly amount, months left, and which card it is on.</li>
              <li>&ldquo;Total remaining&rdquo; multiplies amount by months.</li>
            </ol>
            <Figure
              src="/screenshots/installments.png"
              alt="Installments table showing monthly amount, remaining months, and total remaining"
              caption="Installments and monthly bills"
            />
          </Step>

          <Step index={3}>
            <ol>
              <li>Click &ldquo;Add fixed cost.&rdquo;</li>
              <li>Enter a description (rent, internet) and the monthly amount.</li>
            </ol>
            <Figure
              src="/screenshots/fixed-costs.png"
              alt="Fixed costs table with description and amount"
              caption="Fixed monthly costs"
            />
          </Step>

          <Step index={4}>
            <ol>
              <li>Click &ldquo;Add cash expense.&rdquo;</li>
              <li>Enter the description, amount, payment method, and category.</li>
            </ol>
            <Figure src="/screenshots/cash-expenses.png" alt="Cash expenses table" caption="Cash expenses" />
          </Step>

          <Step index={5}>
            <p>
              Amber figures are ones you decide. Teal figures are worked out for you. Coral means
              you are over budget.
            </p>
            <ul>
              <li>
                <strong>Remaining budget</strong>: income minus card, installments, fixed costs and
                the savings target. The one big number on the page.
              </li>
              <li>
                <strong>Per day</strong>: remaining budget divided by the days left in the cycle.
              </li>
              <li>
                <strong>Days remaining</strong>: from your cycle dates, excluding today.
              </li>
              <li>
                <strong>Expected income</strong> and <strong>savings target</strong>: type your
                own figures for the cycle. Projected savings is shown beneath the target.
              </li>
              <li>
                <strong>Card bill, installments, fixed costs, cash</strong>: the totals of each
                ledger.
              </li>
            </ul>
            <Figure
              src="/screenshots/summary.png"
              alt="Summary section showing totals and remaining budget"
              caption="Summary panel"
            />
          </Step>

          <Step index={6}>
            <p>
              Instead of typing every transaction, you can import the{' '}
              <strong>unbilled transactions</strong> CSV that DBS/POSB internet banking exports.
              Click <strong>Import CSV</strong> below the Credit card expenses table, choose the
              file, confirm which card and category the transactions belong to, then review the
              list and click Import.
            </p>
            <Aside>
              Importing twice is safe. An unbilled export always repeats the earlier transactions:
              the file you download on the 29th contains everything from the one you downloaded on
              the 22nd. The app remembers which statement lines it has already taken, so a second
              import adds only what is new. Two separate charges at the same shop for the same
              amount on the same day still come in as two rows.
            </Aside>
            <p>The preview also tells you what it is leaving out:</p>
            <ul>
              <li>
                <strong>Already imported</strong>: nothing to do.
              </li>
              <li>
                <strong>Outside cycle</strong>: the transaction is dated outside your current
                billing cycle. Switch to that cycle and import the same file again to add it.
              </li>
              <li>
                <strong>Refund / payment</strong>: credits are not imported; add them by hand if
                you track them.
              </li>
              <li>
                <strong>Skipped</strong>: a line the app could not read.
              </li>
            </ul>
            <p>
              Imported rows arrive unvalidated, so you can tick them off against your statement as
              usual, and you can edit the description, amount, or category afterwards like any
              other row.
            </p>
          </Step>

          <Step index={7}>
            <p>Use the buttons in the page header:</p>
            <ul>
              <li>
                <strong>Export JSON</strong>: full data with lists and inputs. Best for backups and
                later re-import.
              </li>
              <li>
                <strong>Import</strong>: load a previous JSON export to restore your data.
              </li>
            </ul>
            <Aside>
              Export when you are done for the day. Next time, import that file to continue.
            </Aside>
          </Step>

          <Step index={8}>
            <p>
              The app is dark by default. Use the sun / moon button in the header to switch to the
              light theme. Your choice is remembered and shared between pages and tabs.
            </p>
          </Step>

          <Step index={9}>
            <ul>
              <li>
                <Kbd>Alt</Kbd> + <Kbd>A</Kbd> adds a new credit card expense row when you are not
                typing in a field.
              </li>
              <li>Click the small &ldquo;↓ bottom&rdquo; link beside a table title to jump.</li>
              <li>
                Use the setup block to add or remove categories and payment methods. Removed items
                still appear as &ldquo;(legacy)&rdquo; in old rows.
              </li>
            </ul>
          </Step>

          <Step index={10}>
            <p>
              This is a client-side tool. It does not send your data anywhere. Your work exists in
              the page while it is open. Export a file to save it for later.
            </p>
          </Step>

          <Step index={11}>
            <ul>
              <li>
                <strong>I lost my data</strong>: if you did not export, the page does not keep your
                data after closing or refreshing.
              </li>
              <li>
                <strong>My totals look wrong</strong>: check for empty amounts or typos.
              </li>
              <li>
                <strong>Import failed</strong>: make sure you exported from this tool.
              </li>
            </ul>
          </Step>
        </div>

        <footer className="fx-statusbar mt-16">
          <span>Need improvements?</span>
          <span className="fx-dot" aria-hidden="true" />
          <span>Open an issue or a pull request on the project repository</span>
        </footer>
      </main>
    </div>
  );
}
