import type { Config } from 'tailwindcss';
import preset from '@schoolcoin/ui/tailwind.preset';

const config: Config = {
  presets: [preset],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', '../../packages/ui/src/**/*.tsx'],
};

export default config;
