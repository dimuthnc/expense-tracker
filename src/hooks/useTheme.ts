import { useCallback, useEffect, useState } from 'react';
import { THEME_NAMES, type ThemeName } from '@/state/types';

const STORAGE_KEY = 'et_theme';

// factory-ui is dark-first: tokens.css defines the dark palette on :root and
// the light palette behind html[data-fx-theme="light"]. Dark is therefore the
// default when nothing is stored.
const DEFAULT_THEME: ThemeName = 'dark';

function readStored(): ThemeName {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v && (THEME_NAMES as string[]).includes(v)) return v as ThemeName;
  } catch {
    /* ignore */
  }
  return DEFAULT_THEME;
}

// Keep in sync with the inline pre-paint script in index.html.
function applyThemeClass(theme: ThemeName) {
  const root = document.documentElement;
  const isDark = theme === 'dark';
  root.classList.toggle('dark', isDark);
  if (isDark) {
    root.removeAttribute('data-fx-theme');
  } else {
    root.setAttribute('data-fx-theme', 'light');
  }
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
          : DEFAULT_THEME;
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
