import * as React from 'react';
import { cn } from '@/lib/utils';

export type CheckboxProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>;

/** Ticking a box is a human judgement, so the checked state is amber. */
const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        'peer relative inline-flex h-4 w-4 shrink-0 cursor-pointer appearance-none items-center justify-center rounded-sm border border-rule-strong bg-transparent transition-colors duration-fast ease-fx',
        'hover:border-human-edge',
        'checked:border-human checked:bg-human',
        // Tick drawn as a rotated border so it needs no font glyph.
        'checked:after:absolute checked:after:left-[4px] checked:after:top-[1px] checked:after:h-[8px] checked:after:w-[5px] checked:after:rotate-45 checked:after:border-b-2 checked:after:border-r-2 checked:after:border-bg-deep',
        "checked:after:content-['']",
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };
