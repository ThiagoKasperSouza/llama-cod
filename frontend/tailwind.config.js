/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.ts'],
  theme: {
    extend: {
      colors: {
        emerald: { 400: '#34d399', 600: '#059669' },
        slate: { 950: '#020617', 900: '#0f172a', 800: '#1e293b', 700: '#334155' },
        amber: { 400: '#fbbf24', 300: '#fcd34d', 200: '#fde68a' },
      },
    },
  },
  plugins: [],
};
