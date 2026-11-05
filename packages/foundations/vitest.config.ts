import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { playwright } from '@vitest/browser-playwright';
import { compile } from 'tailwindcss';
import { defineConfig } from 'vitest/config';
import type { BrowserCommand } from 'vitest/node';

import type { StylesheetName, TailwindOrder } from './src/stylesheets.browser.ts';

const dist = join(import.meta.dirname, 'dist');

/** A built stylesheet of the package, as a page would load it. */
const readStylesheet: BrowserCommand<[StylesheetName]> = async (_context, name) =>
  readFile(join(dist, name), 'utf8');

async function loadStylesheet(id: string, base: string) {
  const path =
    id === 'tailwindcss'
      ? fileURLToPath(import.meta.resolve('tailwindcss/index.css'))
      : resolve(base, id);
  return { path, base: dirname(path), content: await readFile(path, 'utf8') };
}

/**
 * Compiles tailwind.css with Tailwind, as a consumer's build does, imported after Tailwind as the
 * guide says, or with tokens.css imported before Tailwind by mistake.
 */
const compileTailwind: BrowserCommand<[TailwindOrder, readonly string[]]> = async (
  _context,
  order,
  candidates,
) => {
  const input = [
    order === 'tokens-first' ? '@import "./tokens.css";' : '',
    '@import "tailwindcss";',
    '@import "./tailwind.css";',
  ].join('\n');
  const compiler = await compile(input, { base: dist, loadStylesheet });
  return compiler.build([...candidates]);
};

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'foundations',
          include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
          exclude: ['src/**/*.browser.test.ts'],
          environment: 'node',
        },
      },
      {
        // The built stylesheets in Chromium: what wins in the cascade, with and without Tailwind.
        test: {
          name: 'foundations-stylesheets',
          include: ['src/**/*.browser.test.ts'],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: 'chromium' }],
            commands: { readStylesheet, compileTailwind },
          },
        },
      },
    ],
  },
});
