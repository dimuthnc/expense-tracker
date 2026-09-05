import { useEffect, useState } from 'react';

function readTokens(names: readonly string[]): string[] {
  if (typeof document === 'undefined') return names.map(() => '');
  const style = getComputedStyle(document.documentElement);
  return names.map((n) => style.getPropertyValue(n).trim());
}

/**
 * Resolves factory-ui CSS custom properties (e.g. `--fx-machine`) to their
 * current computed values, and re-resolves when the theme flips. Needed only
 * where CSS can't reach — SVG presentation attributes in Recharts don't
 * resolve `var()`, so chart fills have to be handed concrete colours.
 */
export function useFxTokens(names: readonly string[]): string[] {
  const key = names.join('|');
  const [values, setValues] = useState(() => readTokens(names));

  useEffect(() => {
    setValues(readTokens(names));
    const observer = new MutationObserver(() => setValues(readTokens(names)));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-fx-theme'],
    });
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return values;
}
