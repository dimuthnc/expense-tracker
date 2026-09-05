import type { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  anchor: string;
  /** Short mono counter for the head row, e.g. "12 rows". */
  meta?: string;
  children?: ReactNode;
}

export function SectionHeader({ title, anchor, meta, children }: SectionHeaderProps) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 className="m-0 font-display text-lead font-semibold leading-tight tracking-tight">
          {title}
        </h2>
        {meta && <span className="fx-label fx-figure text-ink-faint">{meta}</span>}
        <a
          href={`#${anchor}`}
          className="fx-link fx-label text-machine"
          title="Scroll to bottom of table"
        >
          ↓ bottom
        </a>
      </div>
      {children}
    </div>
  );
}
