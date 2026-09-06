import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        brand: {
          900: 'rgb(var(--brand-900-rgb) / <alpha-value>)',
          700: 'rgb(var(--brand-700-rgb) / <alpha-value>)',
          500: 'rgb(var(--brand-500-rgb) / <alpha-value>)',
          300: 'rgb(var(--brand-300-rgb) / <alpha-value>)',
          100: 'rgb(var(--brand-100-rgb) / <alpha-value>)',
          50: 'rgb(var(--brand-50-rgb) / <alpha-value>)',
        },
        peri: {
          500: 'rgb(var(--peri-500-rgb) / <alpha-value>)',
        },
        blush: {
          300: 'rgb(var(--blush-300-rgb) / <alpha-value>)',
          100: 'rgb(var(--blush-100-rgb) / <alpha-value>)',
        },
        ink: 'rgb(var(--ink-rgb) / <alpha-value>)',
        muted: 'rgb(var(--muted-rgb) / <alpha-value>)',
        line: 'rgb(var(--line-rgb) / <alpha-value>)',
        wa: 'rgb(var(--wa-rgb) / <alpha-value>)',
        surface: 'rgb(var(--surface-rgb) / <alpha-value>)',
      },
      fontFamily: {
        display: 'var(--font-display)',
        script: 'var(--font-script)',
        body: 'var(--font-body)',
      },
      backgroundImage: {
        'grad-hero': 'var(--grad-hero)',
        'grad-cta': 'var(--grad-cta)',
      },
      borderRadius: {
        sm: 'var(--r-sm)',
        md: 'var(--r-md)',
        lg: 'var(--r-lg)',
        full: 'var(--r-full)',
      },
      boxShadow: {
        card: 'var(--sh-card)',
        hover: 'var(--sh-hover)',
        fab: 'var(--sh-fab)',
      },
      maxWidth: {
        container: '1280px',
        prose: '62ch',
      },
      spacing: {
        4.5: '18px',
      },
      keyframes: {
        float: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite alternate',
      },
    },
  },
  plugins: [],
} satisfies Config
