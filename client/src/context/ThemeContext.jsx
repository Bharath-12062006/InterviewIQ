import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getSettings, saveSettings } from '../data/mock';

const ThemeContext = createContext(null);
const THEME_STORAGE_KEY = 'interviewiq_theme';

function readInitialTheme() {
  try {
    const direct = localStorage.getItem(THEME_STORAGE_KEY);
    if (direct === 'dark' || direct === 'light') return direct;
    const settings = getSettings();
    if (settings?.theme === 'dark' || settings?.theme === 'light') return settings.theme;
  } catch {}
  return 'light';
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readInitialTheme);

  const applyTheme = useCallback((nextTheme) => {
    const resolved = nextTheme === 'dark' ? 'dark' : 'light';
    setThemeState(resolved);

    try {
      document.documentElement.classList.toggle('dark', resolved === 'dark');
      localStorage.setItem(THEME_STORAGE_KEY, resolved);
      const currentSettings = getSettings();
      if (currentSettings.theme !== resolved) {
        saveSettings({ ...currentSettings, theme: resolved });
      }
      window.dispatchEvent(new CustomEvent('theme-changed', { detail: resolved }));
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === THEME_STORAGE_KEY && (e.newValue === 'dark' || e.newValue === 'light')) {
        setThemeState(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const toggleTheme = useCallback(() => {
    applyTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, applyTheme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === 'dark',
        setTheme: applyTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
