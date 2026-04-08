/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        night: {
          50:  '#f0f0f0',
          100: '#d0d0d0',
          200: '#a0a0a0',
          300: '#707070',
          400: '#505050',
          500: '#333333',
          600: '#222222',
          700: '#1a1a1a',
          800: '#141414',
          900: '#0e0e0e',
          950: '#080808',
        },
        gold: {
          50:  '#fdf8ec',
          100: '#f9edca',
          200: '#f2d98e',
          300: '#e8c355',
          400: '#d9a82c',
          500: '#c9a84c',
          600: '#b08a28',
          700: '#8c6d1f',
          800: '#6e5318',
          900: '#4e3b0f',
        },
        jade: {
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
        }
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body:    ['"Inter"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'fade-up':   'fadeUp 0.5s ease-out forwards',
        'fade-in':   'fadeIn 0.3s ease-out forwards',
        'shimmer':   'shimmer 1.6s linear infinite',
        'pulse-gold':'pulseGold 2s ease-in-out infinite',
      },
      keyframes: {
        fadeUp:    { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        shimmer:   { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        pulseGold: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.5' } },
      },
      backgroundImage: {
        'gold-shimmer': 'linear-gradient(90deg, #c9a84c 0%, #e8c97a 50%, #c9a84c 100%)',
      },
      boxShadow: {
        'gold-sm':  '0 0 0 1px rgba(201,168,76,0.3)',
        'gold':     '0 0 0 2px rgba(201,168,76,0.4)',
        'gold-lg':  '0 8px 32px rgba(201,168,76,0.15)',
        'card':     '0 1px 3px rgba(0,0,0,0.5)',
        'card-hover':'0 4px 24px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [],
}
