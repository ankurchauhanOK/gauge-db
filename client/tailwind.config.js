/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ground: '#F7F7F5',
        surface: '#FFFFFF',
        'border-light': '#F0F0EE',
        border: '#E7E7E7',
        'text-primary': '#111111',
        'text-secondary': '#6B7280',
        status: {
          pass: '#16A34A',
          fail: '#DC2626',
          warning: '#F59E0B',
          info: '#2563EB',
          offline: '#737373',
        },
      },
      fontFamily: {
        heading: ['Montserrat', 'system-ui', 'sans-serif'],
        body: ['Manrope', 'system-ui', 'sans-serif'],
        mono: ['SF Mono', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      fontSize: {
        'hero': ['4rem', { lineHeight: '1.05', fontWeight: '700' }],
        'hero-lg': ['4.5rem', { lineHeight: '1.02', fontWeight: '700' }],
        'display': ['3rem', { lineHeight: '1.1', fontWeight: '600' }],
        'title': ['2.25rem', { lineHeight: '1.15', fontWeight: '600' }],
        'section': ['1.5rem', { lineHeight: '1.2', fontWeight: '600' }],
        'card-title': ['1.125rem', { lineHeight: '1.3', fontWeight: '600' }],
        'body': ['0.875rem', { lineHeight: '1.5' }],
        'small': ['0.75rem', { lineHeight: '1.5' }],
        'tiny': ['0.6875rem', { lineHeight: '1.4' }],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'soft': '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)',
        'card': '0 4px 12px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)',
        'card-hover': '0 8px 24px rgba(0,0,0,0.06), 0 2px 6px rgba(0,0,0,0.04)',
        'elevated': '0 12px 40px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)',
      },
      transitionDuration: {
        'apple': '200ms',
      },
      transitionTimingFunction: {
        'apple': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem',
      },
    },
  },
  plugins: [],
};
