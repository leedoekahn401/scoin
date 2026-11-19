// Shared Tailwind preset (shadcn/ui tokens). Apps extend it so colours and type stay consistent.
// Tokens are CSS variables (HSL) injected as base styles, so apps need no extra CSS file.
import animate from 'tailwindcss-animate';
import plugin from 'tailwindcss/plugin';

const tokens = plugin(({ addBase }) => {
  addBase({
    ':root': {
      '--background': '0 0% 100%',
      '--foreground': '222 47% 11%',
      '--card': '0 0% 100%',
      '--card-foreground': '222 47% 11%',
      '--popover': '0 0% 100%',
      '--popover-foreground': '222 47% 11%',
      // Brand green; WCAG AA on white for text-sized use (NFR-USE-04).
      '--primary': '152 68% 28%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '210 40% 96%',
      '--secondary-foreground': '222 47% 11%',
      '--muted': '210 40% 96%',
      '--muted-foreground': '215 16% 40%',
      '--accent': '152 50% 94%',
      '--accent-foreground': '152 68% 20%',
      '--destructive': '0 72% 45%',
      '--destructive-foreground': '0 0% 100%',
      '--success': '152 68% 28%',
      '--warning': '35 92% 40%',
      '--border': '214 32% 88%',
      '--input': '214 32% 80%',
      '--ring': '152 68% 28%',
      '--radius': '0.5rem',
    },
    body: {
      '@apply bg-background text-foreground antialiased': {},
    },
  });
});

/** @type {import('tailwindcss').Config} */
const preset = {
  content: [],
  theme: {
    container: { center: true, padding: '1rem' },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        success: 'hsl(var(--success))',
        warning: 'hsl(var(--warning))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      // NFR-USE-03: kiosk and POS touch targets at least 48 × 48 px.
      minHeight: { touch: '48px' },
      minWidth: { touch: '48px' },
    },
  },
  plugins: [tokens, animate],
};

export default preset;
