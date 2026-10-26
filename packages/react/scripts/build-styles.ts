/**
 * Writes dist/styles.css from the stylesheets next to the components.
 *
 * Usage: node scripts/build-styles.ts
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

import { assembleStyles } from './styles.ts';

const root = join(import.meta.dirname, '..');
const src = join(root, 'src');
const sheets = readdirSync(src, { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.css'))
  .map((entry) => {
    const path = join(entry.parentPath, entry.name);
    return { path: relative(src, path).split('\\').join('/'), css: readFileSync(path, 'utf8') };
  });

const output = join(root, 'dist', 'styles.css');
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, assembleStyles(sheets));
console.log(`✓ Wrote dist/styles.css from ${String(sheets.length)} stylesheet(s)`);
