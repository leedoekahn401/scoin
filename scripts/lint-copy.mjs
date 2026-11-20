// Flags files whose Vietnamese text was mangled by a wrong encoding round-trip
// (e.g. "Ä‘" for "đ"), plus quick design-rule violations from CONVENTIONS.md.
//   node scripts/lint-copy.mjs apps/pos
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const roots = process.argv.slice(2);
const MOJIBAKE = /Ã[\u0080-\u00ff]|Ä[‘\u0080-\u00ff]|Æ°|á»|áº|â€|Â·|ß╗|ßº|╞í/;
const RULES = [
  [/#[0-9a-fA-F]{3,8}\b(?![^"]*\.svg)/, 'raw hex colour'],
  [/\brounded-(xl|2xl|3xl)\b/, 'non-token radius'],
  [/(^|[\s"'`])!?shadow-(sm|md|lg|xl|2xl)\b/, 'non-token shadow'],
  [
    /\b(bg|text|border)-(red|blue|green|yellow|gray|slate|zinc|neutral|stone|amber|emerald|sky|indigo|orange)-\d{2,3}\b/,
    'palette colour instead of token',
  ],
  [/\buppercase\b/, 'uppercase styling'],
  [/\bbg-gradient-/, 'gradient'],
  [/\bborder-[48]\b/, 'thick border'],
  [/backdrop-blur/, 'backdrop blur'],
  [/<(div|span|button|a|img|td|th|p|li|svg)\b[^>]*\btitle=/, 'title tooltip'],
  [/\{\s*(error|err|e)\.message\s*\}/, 'raw error.message shown'],
  [/: any\b|as any\b/, 'any'],
  [/eslint-disable|@ts-ignore|@ts-expect-error/, 'suppression'],
];

let problems = 0;
function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.next') continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (/\.tsx?$/.test(name)) check(path);
  }
}
function check(path) {
  readFileSync(path, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      if (MOJIBAKE.test(line)) report(path, i, 'mojibake', line);
      for (const [re, label] of RULES) {
        if (!re.test(line)) continue;
        const allowedThemeColor =
          label === 'raw hex colour' &&
          path.replace(/\\/g, '/').endsWith('apps/parent/src/app/layout.tsx') &&
          line.includes('themeColor:');
        if (allowedThemeColor) continue;
        report(path, i, label, line);
      }
    });
}
function report(path, i, label, line) {
  problems++;
  console.log(`${path}:${i + 1}  [${label}]  ${line.trim().slice(0, 110)}`);
}
for (const r of roots) walk(r);
console.log(problems ? `\n${problems} finding(s)` : 'clean');
process.exit(problems ? 1 : 0);
