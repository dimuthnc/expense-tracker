import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

/**
 * Tailwind is a thin bridge onto the factory-ui tokens in theme/tokens.css.
 * Colours are plain CSS variables (not HSL channels), so the `/opacity`
 * modifier is unavailable — use the `*-wash` and `*-edge` tokens instead.
 */
const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // shadcn semantic names, mapped onto factory-ui
        border: 'var(--fx-rule)',
        input: 'var(--fx-rule-strong)',
        ring: 'var(--fx-machine)',
        background: 'var(--fx-bg)',
        foreground: 'var(--fx-ink)',
        primary: {
          DEFAULT: 'var(--fx-machine)',
          foreground: 'var(--fx-bg-deep)',
        },
        secondary: {
          DEFAULT: 'var(--fx-surface-raised)',
          foreground: 'var(--fx-ink)',
        },
        destructive: {
          DEFAULT: 'var(--fx-signal)',
          foreground: 'var(--fx-bg-deep)',
        },
        muted: {
          DEFAULT: 'var(--fx-surface)',
          foreground: 'var(--fx-ink-dim)',
        },
        accent: {
          DEFAULT: 'var(--fx-surface-raised)',
          foreground: 'var(--fx-ink)',
        },
        card: {
          DEFAULT: 'var(--fx-surface)',
          foreground: 'var(--fx-ink)',
        },
        popover: {
          DEFAULT: 'var(--app-popover)',
          foreground: 'var(--fx-ink)',
        },

        // factory-ui tokens, exposed directly
        bg: { DEFAULT: 'var(--fx-bg)', deep: 'var(--fx-bg-deep)' },
        surface: { DEFAULT: 'var(--fx-surface)', raised: 'var(--fx-surface-raised)' },
        rule: { DEFAULT: 'var(--fx-rule)', strong: 'var(--fx-rule-strong)' },
        ink: { DEFAULT: 'var(--fx-ink)', dim: 'var(--fx-ink-dim)', faint: 'var(--fx-ink-faint)' },
        human: {
          DEFAULT: 'var(--fx-human)',
          wash: 'var(--fx-human-wash)',
          edge: 'var(--fx-human-edge)',
        },
        machine: {
          DEFAULT: 'var(--fx-machine)',
          wash: 'var(--fx-machine-wash)',
          edge: 'var(--fx-machine-edge)',
        },
        thought: {
          DEFAULT: 'var(--fx-thought)',
          wash: 'var(--fx-thought-wash)',
          edge: 'var(--fx-thought-edge)',
        },
        signal: {
          DEFAULT: 'var(--fx-signal)',
          wash: 'var(--fx-signal-wash)',
          edge: 'var(--fx-signal-edge)',
        },
      },
      fontFamily: {
        sans: 'var(--fx-font-body)',
        display: 'var(--fx-font-display)',
        mono: 'var(--fx-font-mono)',
        quote: 'var(--fx-font-quote)',
      },
      fontSize: {
        micro: ['var(--fx-text-micro)', { lineHeight: '1.3' }],
        small: ['var(--fx-text-small)', { lineHeight: '1.45' }],
        body: ['var(--fx-text-body)', { lineHeight: 'var(--fx-leading-body)' }],
        lead: ['var(--fx-text-lead)', { lineHeight: '1.5' }],
        title: ['var(--fx-text-title)', { lineHeight: '1.18' }],
        display: ['var(--fx-text-display)', { lineHeight: 'var(--fx-leading-tight)' }],
        figure: ['var(--fx-text-figure)', { lineHeight: '1' }],
      },
      letterSpacing: {
        label: 'var(--fx-track-label)',
        tight: 'var(--fx-track-tight)',
      },
      borderRadius: {
        // Radius is small and nearly uniform in this system.
        sm: 'var(--fx-radius-sm)',
        DEFAULT: 'var(--fx-radius)',
        md: 'var(--fx-radius)',
        lg: 'var(--fx-radius)',
        xl: 'var(--fx-radius)',
        '2xl': 'var(--fx-radius)',
        pill: 'var(--fx-radius-pill)',
      },
      borderWidth: {
        bar: 'var(--fx-bar)',
      },
      transitionTimingFunction: {
        fx: 'var(--fx-ease)',
      },
      transitionDuration: {
        fast: '140ms',
        slow: '420ms',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [animate],
};

export default config;
