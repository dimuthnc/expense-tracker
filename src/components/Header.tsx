import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ImportExportBar } from './ImportExportBar';
import { ThemeToggle } from './ThemeToggle';
import { UserProfile } from './UserProfile';

interface HeaderProps {
  title: string;
  /** Mono marker above the title. Say *where* the reader is, not what the title says. */
  eyebrow?: ReactNode;
  showImportExport?: boolean;
  docsLink?: boolean;
  backLink?: boolean;
}

export function Header({
  title,
  eyebrow,
  showImportExport = true,
  docsLink = true,
  backLink = false,
}: HeaderProps) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-x-8 gap-y-5 border-b border-rule pb-6">
      <div className="min-w-0 flex-1">
        {eyebrow && <p className="fx-eyebrow mb-2">{eyebrow}</p>}
        <h1 className="fx-title">{title}</h1>
      </div>
      <div className="fx-cluster">
        {showImportExport && <ImportExportBar />}
        {docsLink && (
          <Button size="sm" variant="outline" asChild>
            <Link to="/docs" title="Open documentation">
              Docs
            </Link>
          </Button>
        )}
        {backLink && (
          <Button size="sm" variant="outline" asChild>
            <Link to="/" title="Back to app">
              Back to app
            </Link>
          </Button>
        )}
        <ThemeToggle />
        <UserProfile />
      </div>
    </header>
  );
}
