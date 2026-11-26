/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: { 950: '#0A1330', 900: '#0E1A3A', 800: '#15244D', 700: '#1E3166', 600: '#2B4287' },
        paper: 'rgb(var(--color-paper) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        line: 'rgb(var(--color-line) / <alpha-value>)',
        ink: {
          DEFAULT: 'rgb(var(--color-ink) / <alpha-value>)',
          soft: 'rgb(var(--color-ink-soft) / <alpha-value>)',
          faint: 'rgb(var(--color-ink-faint) / <alpha-value>)',
        },
        signal: {
          DEFAULT: 'rgb(var(--color-signal) / <alpha-value>)',
          soft: 'rgb(var(--color-signal-soft) / <alpha-value>)',
          deep: 'rgb(var(--color-signal-deep) / <alpha-value>)',
        },
        saffron: {
          DEFAULT: 'rgb(var(--color-saffron) / <alpha-value>)',
          soft: 'rgb(var(--color-saffron-soft) / <alpha-value>)',
        },
        jade: {
          DEFAULT: 'rgb(var(--color-jade) / <alpha-value>)',
          soft: 'rgb(var(--color-jade-soft) / <alpha-value>)',
        },
        rose: {
          DEFAULT: 'rgb(var(--color-rose) / <alpha-value>)',
          soft: 'rgb(var(--color-rose-soft) / <alpha-value>)',
        },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Figtree', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        panel: 'var(--shadow-panel)',
        pop: 'var(--shadow-pop)',
      },
    },
  },
  plugins: [],
};
