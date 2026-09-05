import * as React from 'react';
import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-9 w-full rounded-sm border border-rule-strong bg-transparent px-3 py-1 text-small text-ink transition-colors duration-fast ease-fx',
          'placeholder:text-ink-faint hover:border-ink-faint focus:border-machine',
          'file:border-0 file:bg-transparent file:text-small file:font-medium',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };
