import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * factory-ui buttons are mono, tracked, uppercase, hard-edged. Colour carries
 * meaning: `default` is teal (an action the machine performs for you),
 * `destructive` is coral (a warning), and everything else stays quiet.
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm border font-mono uppercase tracking-[0.08em] transition-colors duration-fast ease-fx disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'border-machine-edge bg-machine-wash text-machine hover:border-machine hover:bg-machine-edge',
        destructive:
          'border-signal-edge bg-signal-wash text-signal hover:border-signal hover:bg-signal-edge',
        outline:
          'border-rule-strong bg-transparent text-ink-dim hover:border-ink-faint hover:bg-surface hover:text-ink',
        secondary:
          'border-rule-strong bg-transparent text-ink-dim hover:border-ink-faint hover:bg-surface hover:text-ink',
        ghost:
          'border-transparent bg-transparent normal-case tracking-normal font-sans text-ink-dim hover:bg-surface hover:text-ink',
        link: 'border-0 normal-case tracking-normal font-sans text-machine underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 text-small',
        sm: 'h-8 px-3 text-micro',
        lg: 'h-10 px-6 text-small',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
