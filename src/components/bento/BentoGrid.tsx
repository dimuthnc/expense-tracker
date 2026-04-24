import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface BentoItem {
  key: string;
  title: string;
  meta?: string;
  description?: string;
  icon?: ReactNode;
  status?: string;
  statusTone?: 'default' | 'success' | 'warning' | 'danger';
  tags?: string[];
  colSpan?: 1 | 2;
  hasPersistentHover?: boolean;
  children?: ReactNode;
}

interface BentoGridProps {
  items: BentoItem[];
  className?: string;
}

const toneClasses: Record<NonNullable<BentoItem['statusTone']>, string> = {
  default: 'bg-secondary text-secondary-foreground',
  success: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  warning: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  danger: 'bg-destructive/15 text-destructive',
};

export function BentoGrid({ items, className }: BentoGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3',
        className,
      )}
    >
      {items.map((item) => (
        <div
          key={item.key}
          className={cn(
            'group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border/60 bg-card p-4 shadow-sm transition-all duration-300',
            'hover:-translate-y-0.5 hover:shadow-md hover:border-primary/40',
            item.colSpan === 2 && 'sm:col-span-2',
            item.hasPersistentHover && '-translate-y-0.5 shadow-md border-primary/40',
          )}
        >
          <div
            aria-hidden
            className={cn(
              'pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300',
              'group-hover:opacity-100',
              item.hasPersistentHover && 'opacity-100',
            )}
            style={{
              backgroundImage:
                'radial-gradient(circle at top right, hsl(var(--primary)/0.10), transparent 60%)',
            }}
          />

          <div className="relative flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              {item.icon && (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {item.icon}
                </div>
              )}
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {item.title}
                </div>
                {item.meta && (
                  <div className="text-[0.65rem] text-muted-foreground/80">{item.meta}</div>
                )}
              </div>
            </div>
            {item.status && (
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[0.65rem] font-medium',
                  toneClasses[item.statusTone ?? 'default'],
                )}
              >
                {item.status}
              </span>
            )}
          </div>

          <div className="relative mt-3">
            {item.children}
            {item.description && (
              <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
            )}
            {item.tags && item.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-border/60 bg-background/80 px-1.5 py-0.5 text-[0.65rem] text-muted-foreground"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
