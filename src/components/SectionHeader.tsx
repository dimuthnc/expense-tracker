import type { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  anchor: string;
  children?: ReactNode;
}

export function SectionHeader({ title, anchor, children }: SectionHeaderProps) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        {title}
        <a
          href={`#${anchor}`}
          className="rounded border border-border bg-muted px-1.5 py-0.5 text-[0.6rem] text-muted-foreground hover:bg-primary hover:text-primary-foreground"
          title="Scroll to bottom of table"
        >
          ↓ bottom
        </a>
      </h2>
      {children}
    </div>
  );
}
