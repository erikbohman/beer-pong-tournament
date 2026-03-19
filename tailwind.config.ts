import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#0a0a0f',
          900: '#111118',
          800: '#1a1a24',
          700: '#242433',
          600: '#2e2e42',
        },
      },
    },
  },
  plugins: [],
} satisfies Config
