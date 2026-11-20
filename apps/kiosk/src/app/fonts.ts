import { Be_Vietnam_Pro, Bricolage_Grotesque, Geist_Mono } from 'next/font/google';

/**
 * Display: Bricolage Grotesque (ronansat's headline face). Body: Be Vietnam
 * Pro, a geometric sans drawn for Vietnamese diacritics, standing in for DM
 * Sans which has no Vietnamese subset. Mono: Geist Mono for codes.
 */
export const displayFont = Bricolage_Grotesque({
  variable: '--font-display-face',
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
});

export const bodyFont = Be_Vietnam_Pro({
  variable: '--font-body',
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const monoFont = Geist_Mono({
  variable: '--font-mono-face',
  subsets: ['latin'],
  display: 'swap',
  preload: false,
});

export const fontVariables = `${displayFont.variable} ${bodyFont.variable} ${monoFont.variable}`;
