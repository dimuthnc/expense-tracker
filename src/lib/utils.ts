import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// tailwind-merge only knows the stock scale. Without this it reads the
// factory-ui sizes (`text-title`) as colours and drops one of
// `text-title text-machine`, so both must be registered.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['micro', 'small', 'body', 'lead', 'title', 'display', 'figure'] }],
      'font-family': [{ font: ['sans', 'display', 'mono', 'quote'] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
