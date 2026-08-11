/** @type {import('tailwindcss').Config} */

// System CJK faces, appended to every family so 中文 falls back deliberately
// instead of landing on whatever the browser picks.
const CJK = ['"PingFang SC"', '"Hiragino Sans GB"', '"Microsoft YaHei"', '"Noto Sans CJK SC"']

export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // Variable width axis; see .font-expanded / .font-wide in index.css
        display: ['Archivo', ...CJK, 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"IBM Plex Sans"', ...CJK, 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', ...CJK, 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      // Every color resolves through a token in index.css so the light and
      // dark sheets stay in sync. Don't use /opacity modifiers on these.
      colors: {
        paper: 'var(--c-paper)',
        surface: 'var(--c-surface)',
        ink: 'var(--c-ink)',
        'ink-2': 'var(--c-ink-2)',
        'ink-3': 'var(--c-ink-3)',
        rule: 'var(--c-rule)',
        'rule-strong': 'var(--c-rule-strong)',
        accent: 'var(--c-accent)',
        // The accent as an ink. Use this whenever the accent has to set text;
        // `accent` itself is for marks, rules, and fills only.
        'accent-ink': 'var(--c-accent-ink)',
        'accent-wash': 'var(--c-accent-wash)',
      },
      letterSpacing: {
        // Tracking is size-specific. This pairs with the 11px .label — the
        // labels grew a step, so the tracking comes down to hold the set width.
        label: '0.1em',
        display: '-0.03em',
      },
      maxWidth: {
        sheet: '78rem',
        measure: '34rem',
      },
    },
  },
  plugins: [],
}
