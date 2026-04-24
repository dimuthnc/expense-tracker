import { useEffect } from 'react';
import { useAppDispatch } from '@/state/AppContext';

export function useAltAShortcut() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      if (e.key !== 'a' && e.key !== 'A') return;
      const tag = (document.activeElement?.tagName || '').toUpperCase();
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(tag)) return;
      e.preventDefault();
      dispatch({ type: 'ADD_ROW', table: 'expenses' });
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [dispatch]);
}
