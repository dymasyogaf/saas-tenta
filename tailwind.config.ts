import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{vue,ts}',
    './components/**/*.{vue,ts}',
    './layouts/**/*.{vue,ts}',
    './pages/**/*.{vue,ts}',
    './composables/**/*.ts',
  ],
  theme: {
    extend: {
      colors: {
        orange: {
          50: '#FFF4EB',
          100: '#FFE3CC',
          200: '#FFC79A',
          300: '#FFA66A',
          400: '#FF9447',
          500: '#FF7A1A',
          600: '#F26416',
          700: '#C94E0E',
          800: '#9A3A09',
        },
        ink: {
          50: '#F5F7FA',
          100: '#E5E8EC',
          200: '#D1D5DB',
          300: '#9CA3AF',
          400: '#8B95A3',
          500: '#6B7280',
          600: '#4B5563',
          700: '#2D3D52',
          800: '#1A2A3D',
          900: '#0E1B2A',
        },
        bg: {
          warm: '#F5F7FA',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'sans-serif'],
      },
      boxShadow: {
        sm: '0 1px 2px rgba(31, 26, 23, 0.04), 0 1px 3px rgba(31, 26, 23, 0.06)',
        md: '0 4px 12px rgba(31, 26, 23, 0.06), 0 2px 4px rgba(31, 26, 23, 0.04)',
        lg: '0 12px 32px rgba(255, 107, 26, 0.12), 0 4px 12px rgba(31, 26, 23, 0.06)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography')
  ],
} satisfies Config
