import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ImportExportBar } from './ImportExportBar';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  title: string;
  showImportExport?: boolean;
  docsLink?: boolean;
  backLink?: boolean;
}

export function Header({ title, showImportExport = true, docsLink = true, backLink = false }: HeaderProps) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <h1 className="m-0 flex-1 text-xl font-semibold leading-tight">{title}</h1>
      <div className="flex flex-wrap items-center gap-2">
        {showImportExport && <ImportExportBar />}
        <ThemeToggle />
        {docsLink && (
          <Button size="sm" variant="secondary" asChild>
            <Link to="/docs" title="Open documentation">
              Documentation
            </Link>
          </Button>
        )}
        {backLink && (
          <Button size="sm" variant="secondary" asChild>
            <Link to="/" title="Back to app">
              Back to App
            </Link>
          </Button>
        )}
      </div>
    </header>
  );
}
