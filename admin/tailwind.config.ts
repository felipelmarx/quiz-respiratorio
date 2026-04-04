import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50:  '#F0F4F8',
          100: '#D9E2EC',
          200: '#BCCCDC',
          300: '#9FB3C8',
          400: '#7B8FA8',
          500: '#547396',
          600: '#3E5A7A',
          700: '#243B55',
          800: '#162845',
          900: '#0A192F',
          950: '#06101F',
        },
        gold: {
          50:  '#FBF8F1',
          100: '#F2EBD9',
          200: '#E8DBC0',
          300: '#DCCAA3',
          400: '#D1B988',
          500: '#C6A868',
          600: '#B09255',
          700: '#957A42',
          800: '#7A6335',
          900: '#5F4D2A',
          950: '#3D311B',
        },
      },
      fontFamily: {
        display: ["'Playfair Display'", 'Georgia', "'Times New Roman'", 'serif'],
        body: ["'Lato'", '-apple-system', 'BlinkMacSystemFont', "'Segoe UI'", 'Roboto', 'sans-serif'],
        mono: ["'JetBrains Mono'", "'Fira Code'", 'Consolas', 'monospace'],
      },
      fontSize: {
        'h1': ['2.25rem', { lineHeight: '1.2', fontWeight: '700' }],
        'h2': ['1.75rem', { lineHeight: '1.25', fontWeight: '700' }],
        'h3': ['1.375rem', { lineHeight: '1.3', fontWeight: '600' }],
        'h4': ['1.125rem', { lineHeight: '1.35', fontWeight: '600' }],
        'body-lg': ['1.125rem', { lineHeight: '1.75', fontWeight: '400' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
        'caption': ['0.75rem', { lineHeight: '1.5', fontWeight: '400' }],
        'overline': ['0.8125rem', { lineHeight: '1.4', fontWeight: '700', letterSpacing: '0.1em' }],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 10px 30px rgba(0, 0, 0, 0.08)',
        'gold-glow': '0 5px 15px rgba(198, 168, 104, 0.4)',
      },
      borderRadius: {
        'card': '12px',
      },
      width: {
        'sidebar': '256px',
        'sidebar-collapsed': '64px',
      },
      spacing: {
        'sidebar': '256px',
        'sidebar-collapsed': '64px',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-left': {
          '0%': { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'pulse-gold': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(198, 168, 104, 0.6)' },
          '50%': { boxShadow: '0 0 0 6px rgba(198, 168, 104, 0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-in-left': 'slide-in-left 0.2s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'pulse-gold': 'pulse-gold 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
