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
        'grad-panel': 'var(--grad-panel)',
        'grad-card': 'var(--grad-card)',
        'grad-barra': 'var(--grad-barra)',
        'grad-boton': 'var(--grad-boton)',
        'grad-activo': 'var(--grad-activo)',
        'grad-menu': 'var(--grad-menu)',
        'grad-menu-activo': 'var(--grad-menu-activo)',
        'grad-campo': 'var(--grad-campo)',
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
        soft: 'var(--sh-soft)',
        lift: 'var(--sh-lift)',
        boton: 'var(--sh-boton)',
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
        // Entrada de las piezas del panel: suben unos píxeles mientras
        // aparecen. Es corta a propósito; una animación larga en algo que se
        // abre veinte veces al día cansa.
        entrar: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // Brillo que cruza una superficie. Se usa solo en el saludo.
        brillo: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        // El cajon de edicion entra deslizando desde el borde derecho. Se
        // mueve poco y rapido: lo que importa es entender de donde sale, no
        // mirar la animacion.
        'entrada-lateral': {
          '0%': { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        deriva: {
          '0%': { transform: 'translate(0, 0) rotate(0deg)' },
          '50%': { transform: 'translate(10px, -14px) rotate(6deg)' },
          '100%': { transform: 'translate(0, 0) rotate(0deg)' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite alternate',
        entrar: 'entrar 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
        brillo: 'brillo 9s ease-in-out infinite',
        deriva: 'deriva 14s ease-in-out infinite',
        'entrada-lateral': 'entrada-lateral 0.28s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
} satisfies Config
