import { useEffect } from 'react';
import { Header } from '@/components/Header';
import { Card } from '@/components/ui/card';

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="my-5">
      <h2 className="mb-2 mt-1 text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Figure({ src, alt, caption }: { src: string; alt: string; caption: string }) {
  return (
    <figure className="my-3 rounded-lg border bg-card p-3 shadow-sm">
      <img src={src} alt={alt} className="block w-full rounded-md border border-border" />
      <figcaption className="mt-2 text-xs text-muted-foreground">{caption}</figcaption>
    </figure>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-border border-b-2 bg-card px-1.5 py-0.5 font-mono text-xs">
      {children}
    </kbd>
  );
}

export function Docs() {
  useEffect(() => {
    document.title = 'Documentation • Personal Expense Manager';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        'content',
        'Beginner-friendly guide to using the Personal Expense Manager: setup, adding expenses, installments, fixed costs, cash expenses, summaries, and import/export.',
      );
    }
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-8">
      <Header title="Documentation" showImportExport={false} docsLink={false} backLink />
      <main className="mx-auto max-w-4xl">
        <nav className="surface-alt mb-4 rounded-lg p-3" aria-label="On this page">
          <strong className="text-sm">Quick links</strong>
          <ul className="mt-2 list-disc pl-5 text-sm">
            <li>
              <a href="#howToUse" className="hover:underline">
                How to use
              </a>
            </li>
            <li>
              <a href="#setup" className="hover:underline">
                Set up your billing cycle
              </a>
            </li>
            <li>
              <a href="#credit" className="hover:underline">
                Add credit card expenses
              </a>
            </li>
            <li>
              <a href="#installments" className="hover:underline">
                Track installments &amp; monthly bills
              </a>
            </li>
            <li>
              <a href="#fixed" className="hover:underline">
                Add fixed monthly costs
              </a>
            </li>
            <li>
              <a href="#cash" className="hover:underline">
                Track cash expenses
              </a>
            </li>
            <li>
              <a href="#summary" className="hover:underline">
                Read the summary
              </a>
            </li>
            <li>
              <a href="#importExport" className="hover:underline">
                Import &amp; Export (CSV/JSON)
              </a>
            </li>
            <li>
              <a href="#themes" className="hover:underline">
                Themes
              </a>
            </li>
            <li>
              <a href="#tips" className="hover:underline">
                Tips &amp; shortcuts
              </a>
            </li>
            <li>
              <a href="#privacy" className="hover:underline">
                Privacy
              </a>
            </li>
            <li>
              <a href="#troubleshooting" className="hover:underline">
                Troubleshooting
              </a>
            </li>
          </ul>
        </nav>

        <Section id="howToUse" title="How to use">
          <p className="text-sm">
            This tool helps you keep track of everyday spending, card bills, monthly subscriptions
            or installments, and cash expenses. It automatically totals amounts and shows a simple
            monthly budget picture.
          </p>
          <Card className="my-3 surface-alt p-3 text-sm">
            Nothing is saved online. Your data stays in the page while it&rsquo;s open. To keep a
            copy, use Export and save a file to your computer.
          </Card>
          <Figure
            src="/screenshots/preview.png"
            alt="Overview of the Personal Expense Manager interface"
            caption="Overview of the main dashboard (placeholder)"
          />
        </Section>

        <Section id="setup" title="1) Set up your billing cycle">
          <ol className="list-decimal space-y-1 pl-5 text-sm">
            <li>
              At the top of the app, set &ldquo;Cycle From&rdquo; and &ldquo;Cycle To.&rdquo; By
              default, it uses 15th &rarr; 15th for the current month.
            </li>
            <li>Use the small arrows to move to the previous or next cycle.</li>
          </ol>
          <p className="mt-2 text-xs text-muted-foreground">
            Why this matters: your &ldquo;Days Remaining in Cycle&rdquo; and budget hints use these
            dates.
          </p>
          <Figure
            src="/screenshots/billing-cycle.png"
            alt="Billing cycle date controls and previous/next buttons"
            caption="Billing cycle controls (placeholder)"
          />
        </Section>

        <Section id="credit" title="2) Add credit card expenses">
          <ol className="list-decimal space-y-1 pl-5 text-sm">
            <li>Click &ldquo;Add Expense.&rdquo;</li>
            <li>Type a short description and the amount.</li>
            <li>Choose a Category and the Card you used.</li>
          </ol>
          <p className="mt-2 text-sm">
            The table footer shows the total of your card expenses. The summary tables and charts
            update automatically.
          </p>
          <Figure
            src="/screenshots/credit-expenses.png"
            alt="Credit card expenses table with fields for description, amount, category, and card"
            caption="Credit card expenses table (placeholder)"
          />
        </Section>

        <Section id="installments" title="3) Track installments & monthly bills">
          <ol className="list-decimal space-y-1 pl-5 text-sm">
            <li>Click &ldquo;Add Item&rdquo; in the Installments section.</li>
            <li>Enter the monthly amount, remaining months, and which card it&rsquo;s on.</li>
            <li>The &ldquo;Total Remaining&rdquo; column multiplies amount &times; months.</li>
          </ol>
          <Figure
            src="/screenshots/installments.png"
            alt="Installments table showing monthly amount, remaining months, and total remaining"
            caption="Installments and monthly bills (placeholder)"
          />
        </Section>

        <Section id="fixed" title="4) Add fixed monthly costs">
          <ol className="list-decimal space-y-1 pl-5 text-sm">
            <li>Click &ldquo;Add Fixed Cost.&rdquo;</li>
            <li>Enter a description (e.g., Rent, Internet) and the monthly amount.</li>
          </ol>
          <Figure
            src="/screenshots/fixed-costs.png"
            alt="Fixed costs table with description and amount"
            caption="Fixed monthly costs (placeholder)"
          />
        </Section>

        <Section id="cash" title="5) Track cash expenses">
          <ol className="list-decimal space-y-1 pl-5 text-sm">
            <li>Click &ldquo;Add Cash Expense.&rdquo;</li>
            <li>Enter the description, amount, payment method, and category.</li>
          </ol>
          <Figure
            src="/screenshots/cash-expenses.png"
            alt="Cash expenses table"
            caption="Cash expenses (placeholder)"
          />
        </Section>

        <Section id="summary" title="6) Read the summary">
          <ul className="list-disc space-y-1 pl-5 text-sm">
            <li>
              <strong>Total Credit Card Bill</strong> &ndash; sum of card expenses.
            </li>
            <li>
              <strong>Total Installment Cost (Monthly)</strong> &ndash; sum of all monthly
              installment amounts.
            </li>
            <li>
              <strong>Total Fixed Costs</strong> &ndash; sum of fixed monthly obligations.
            </li>
            <li>
              <strong>Total Cash Expenses</strong> &ndash; sum of cash/transfer spending.
            </li>
            <li>
              <strong>Monthly Expected Income</strong> &ndash; type your income for the cycle.
            </li>
            <li>
              <strong>Expected Savings</strong> &ndash; enter the savings you want to set aside.
            </li>
            <li>
              <strong>Remaining Budget</strong> &ndash; Income minus Card + Installments + Fixed +
              Expected Savings.
            </li>
            <li>
              <strong>Remaining Budget Per Day</strong> &ndash; Remaining Budget &divide; days left.
            </li>
            <li>
              <strong>Days Remaining in Cycle</strong> &ndash; based on your cycle dates.
            </li>
          </ul>
          <Figure
            src="/screenshots/summary.png"
            alt="Summary section showing totals and remaining budget"
            caption="Summary panel (placeholder)"
          />
        </Section>

        <Section id="importExport" title="7) Import & Export (CSV/JSON)">
          <p className="text-sm">Use the buttons in the page header:</p>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            <li>
              <strong>Export JSON</strong> &ndash; full data with lists and inputs. Best for
              backups and later re-import.
            </li>
            <li>
              <strong>Export CSV</strong> &ndash; readable spreadsheet format with sections.
            </li>
            <li>
              <strong>Import&hellip;</strong> &ndash; load a previous JSON or CSV export to restore
              your data.
            </li>
          </ul>
          <Card className="my-3 surface-alt p-3 text-sm">
            Tip: Export when you&rsquo;re done for the day. Next time, import that file to continue.
          </Card>
        </Section>

        <Section id="themes" title="8) Themes">
          <p className="text-sm">
            Switch themes using the dropdown at the top right. Your choice is remembered and shared
            between pages.
          </p>
        </Section>

        <Section id="tips" title="9) Tips & shortcuts">
          <ul className="list-disc space-y-1 pl-5 text-sm">
            <li>
              <Kbd>Alt</Kbd> + <Kbd>A</Kbd> adds a new credit card expense row (when not typing).
            </li>
            <li>Click the small &ldquo;&darr; bottom&rdquo; link below a table header to jump.</li>
            <li>
              Use the Configuration block to add or remove Categories and Payment Methods. Removed
              items still appear as &ldquo;(legacy)&rdquo; in old rows.
            </li>
          </ul>
        </Section>

        <Section id="privacy" title="10) Privacy">
          <p className="text-sm">
            This is a client-side tool. It doesn&rsquo;t send your data anywhere. Your work exists
            in the page while it&rsquo;s open. Export a file to save it for later.
          </p>
        </Section>

        <Section id="troubleshooting" title="11) Troubleshooting">
          <ul className="list-disc space-y-1 pl-5 text-sm">
            <li>
              <strong>I lost my data</strong> &ndash; If you didn&rsquo;t export, the page
              doesn&rsquo;t keep your data after closing or refreshing.
            </li>
            <li>
              <strong>My totals look wrong</strong> &ndash; Check for empty amounts or typos.
            </li>
            <li>
              <strong>Import failed</strong> &ndash; Make sure you exported from this tool.
            </li>
          </ul>
        </Section>

        <div className="my-4 h-px bg-border" />
        <p className="text-xs text-muted-foreground">
          Need improvements? Open an issue or contribute a pull request on the project repository.
        </p>
      </main>
    </div>
  );
}
