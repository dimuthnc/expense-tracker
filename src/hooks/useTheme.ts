import { useCallback, useEffect, useState } from 'react';
import { THEME_NAMES, type ThemeName } from '@/state/types';

const STORAGE_KEY = 'et_theme';

function readStored(): ThemeName {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v && (THEME_NAMES as string[]).includes(v)) return v as ThemeName;
  } catch {
    /* ignore */
  }
  return 'light';
}

function applyThemeClass(theme: ThemeName) {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeName>(() => readStored());

  useEffect(() => {
    applyThemeClass(theme);
  }, [theme]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      const next =
        e.newValue && (THEME_NAMES as string[]).includes(e.newValue)
          ? (e.newValue as ThemeName)
          : 'light';
      setThemeState(next);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setTheme = useCallback((t: ThemeName) => {
    setThemeState(t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  return { theme, setTheme, toggleTheme };
}
