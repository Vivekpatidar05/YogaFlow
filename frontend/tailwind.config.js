/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f0f7ec', 100: '#d8ecbf', 200: '#b5d98a',
          300: '#8dc455', 400: '#6aaf2c', 500: '#4a8c1c',
          600: '#3a7016', 700: '#2c5512', 800: '#1e3b0d',
          900: '#112208',
        },
        terra: {
          50:  '#fdf3ee', 100: '#f9ddd0', 200: '#f2b99d',
          300: '#e8906a', 400: '#d96a3e', 500: '#c4502a',
          600: '#a03d1f', 700: '#7c2d15', 800: '#5a200e',
          900: '#3a1408',
        },
        sage:  { 50: '#f4f7f0', 100: '#e5eddb', 200: '#cddbb9', 300: '#afc390', 400: '#90a96b', 500: '#748f52' },
        cream: '#FAFAF7',
        parchment: '#F5F0E8',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body:    ['"Inter"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        card:       '0 1px 4px rgba(44,95,46,0.08), 0 0 0 1px rgba(44,95,46,0.04)',
        'card-hover':'0 8px 28px rgba(44,95,46,0.14), 0 0 0 1px rgba(44,95,46,0.06)',
        'focus':    '0 0 0 3px rgba(74,140,28,0.2)',
      },
      animation: {
        'fade-up':  'fadeUp 0.5s ease-out forwards',
        'fade-in':  'fadeIn 0.3s ease-out',
        'shimmer':  'shimmer 1.8s linear infinite',
        'spin-slow':'spin 2s linear infinite',
      },
      keyframes: {
        fadeUp:  { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
    },
  },
  plugins: [],
}
