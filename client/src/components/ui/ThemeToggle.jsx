import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function ThemeToggle({ className = '', showLabel = false }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-semibold text-ink-soft transition-colors hover:bg-paper hover:text-ink ${className}`}
    >
      {isDark ? (
        <>
          <Sun size={15} className="text-saffron" aria-hidden="true" />
          {showLabel && <span>Light</span>}
        </>
      ) : (
        <>
          <Moon size={15} className="text-signal" aria-hidden="true" />
          {showLabel && <span>Dark</span>}
        </>
      )}
    </button>
  );
}
