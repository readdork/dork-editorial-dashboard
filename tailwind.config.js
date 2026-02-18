/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        dork: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        editor: {
          bg: 'rgb(var(--color-bg))',
          text: 'rgb(var(--color-text))',
          primary: 'rgb(var(--color-primary))',
          secondary: 'rgb(var(--color-secondary))',
          accent: 'rgb(var(--color-accent))',
          success: 'rgb(var(--color-success))',
          warning: 'rgb(var(--color-warning))',
          error: 'rgb(var(--color-error))',
        }
      },
      animation: {
        'fade-in': 'fadeIn 500ms ease-out',
        'slide-up': 'slideUp 500ms ease-out',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      boxShadow: {
        'glow': '0 0 25px -5px rgba(2, 132, 199, 0.15)',
        'glow-lg': '0 0 35px -7px rgba(2, 132, 199, 0.2)',
      },
    },
  },
  plugins: [],
}
