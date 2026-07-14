/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          50: '#f8f9fb',
          100: '#f0f2f5',
          200: '#e2e5eb',
          300: '#c4c9d3',
          400: '#9ca3b0',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          850: '#1a1f2e',
          900: '#111827',
          950: '#0a0e1a',
        },
        gauge: {
          green: '#22c55e',
          red: '#ef4444',
          amber: '#f59e0b',
          blue: '#3b82f6',
        },
      },
      fontSize: {
        'gauge-xl': ['2.5rem', { lineHeight: '1.2' }],
        'gauge-2xl': ['3.5rem', { lineHeight: '1.1' }],
        'gauge-3xl': ['5rem', { lineHeight: '1' }],
      },
      spacing: {
        'touch': '3rem',
      },
      minHeight: {
        'touch': '3rem',
      },
      minWidth: {
        'touch': '3rem',
      },
    },
  },
  plugins: [],
};
