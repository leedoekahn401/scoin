// Shared Tailwind preset. Apps extend this so colors and type stay consistent.
/** @type {import('tailwindcss').Config} */
const preset = {
  content: [],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef8f3',
          100: '#d5efe1',
          500: '#1f9d63',
          600: '#178151',
          700: '#126641',
        },
      },
    },
  },
};

export default preset;
