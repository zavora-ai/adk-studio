/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Theme-aware colors using CSS variables
        studio: {
          bg: 'var(--bg-primary)',
          panel: 'var(--surface-panel)',
          card: 'var(--surface-card)',
          accent: 'var(--accent-primary)',
          highlight: '#e94560',
          border: 'var(--border-default)',
        },
        // Text colors
        'theme-primary': 'var(--text-primary)',
        'theme-secondary': 'var(--text-secondary)',
        'theme-muted': 'var(--text-muted)',
      },
      backgroundColor: {
        'theme-primary': 'var(--bg-primary)',
        'theme-secondary': 'var(--bg-secondary)',
        'theme-canvas': 'var(--bg-canvas)',
        'theme-card': 'var(--surface-card)',
        'theme-panel': 'var(--surface-panel)',
      },
      borderColor: {
        'theme-default': 'var(--border-default)',
        'theme-focus': 'var(--border-focus)',
      },
      textColor: {
        'theme-primary': 'var(--text-primary)',
        'theme-secondary': 'var(--text-secondary)',
        'theme-muted': 'var(--text-muted)',
      },
    },
  },
  plugins: [],
};
