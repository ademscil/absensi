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
          'radial-gradient(circle at 50% 15%, rgba(var(--color-primary-rgb), 0.08) 0%, rgba(248, 250, 252, 0.5) 60%, rgba(241, 245, 249, 0.95) 100%)',
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
