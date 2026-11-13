import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['"Plus Jakarta Sans"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      colors: { sidebar: '#0B4F4A', ink: '#173B3A', muted: '#64748B', mint: '#99F6E4' },
      boxShadow: { card: '0 1px 2px rgba(23,59,58,0.04), 0 4px 16px rgba(23,59,58,0.06)' },
    },
  },
  plugins: [daisyui],
  daisyui: {
    logs: false,
    themes: [
      {
        'sweety-health': {
          primary: '#0D9488',
          'primary-content': '#FFFFFF',
          secondary: '#14B8A6',
          'secondary-content': '#FFFFFF',
          accent: '#99F6E4',
          'accent-content': '#173B3A',
          neutral: '#173B3A',
          'neutral-content': '#FFFFFF',
          'base-100': '#FFFFFF',
          'base-200': '#F6FAF9',
          'base-300': '#DDEAE8',
          'base-content': '#173B3A',
          info: '#0EA5E9',
          success: '#16A34A',
          warning: '#F59E0B',
          error: '#DC2626',
          '--rounded-box': '1rem',
          '--rounded-btn': '0.65rem',
          '--rounded-badge': '0.6rem',
          '--btn-focus-scale': '0.98',
        },
      },
    ],
  },
};
