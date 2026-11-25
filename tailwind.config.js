/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
      },
      boxShadow: {
        glow: 'var(--shadow-glow)',
        'spatial-depth': 'var(--shadow-spatial-depth)',
      },
      backgroundImage: {
        'radial-vignette':
          'radial-gradient(circle at 50% 35%, rgba(var(--color-primary-rgb), 0.14) 0%, rgba(15, 23, 42, 0.4) 55%, rgba(2, 6, 23, 0.92) 100%)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out forwards',
      },
    },
  },
  plugins: [],
};
