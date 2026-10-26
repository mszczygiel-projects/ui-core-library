/**
 * Completes Stencil's build into a package that Node.js and TypeScript resolve as ES modules:
 *
 * - the root module defines every component. Stencil writes one module per component, each
 *   defining its own tag, and a root that only re-exports its helpers;
 * - relative imports in the declarations carry their file extension. Stencil writes them without
 *   one, which only a bundler resolves.
 *
 * Usage: node scripts/finish-build.ts
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const dist = join(import.meta.dirname, '..', 'dist');

const modules = readdirSync(join(dist, 'components'))
  .filter((file) => /^ui-.+\.js$/.test(file))
  .sort();
const root = `${modules.map((file) => `export * from './components/${file}';`).join('\n')}\n`;
writeFileSync(join(dist, 'index.js'), root);
writeFileSync(join(dist, 'index.d.ts'), root);

const RELATIVE = /(from\s+|import\s*\(\s*)(["'])(\.{1,2}\/[^"']+?)\2/g;

/** The specifier with the extension of the declaration it names, or unchanged. */
function withExtension(file: string, specifier: string): string {
  if (/\.(js|mjs|json)$/.test(specifier)) {
    return specifier;
  }
  const target = resolve(dirname(file), specifier);
  if (existsSync(`${target}.d.ts`)) {
    return `${specifier}.js`;
  }
  if (existsSync(join(target, 'index.d.ts'))) {
    return `${specifier}/index.js`;
  }
  return specifier;
}

let rewritten = 0;
for (const entry of readdirSync(dist, { recursive: true, encoding: 'utf8' })) {
  if (!entry.endsWith('.d.ts')) {
    continue;
  }
  const file = join(dist, entry);
  const text = readFileSync(file, 'utf8');
  const next = text.replace(
    RELATIVE,
    (_match, lead: string, quote: string, specifier: string) =>
      `${lead}${quote}${withExtension(file, specifier)}${quote}`,
  );
  if (next !== text) {
    writeFileSync(file, next);
    rewritten += 1;
  }
}
console.log(
  `✓ Wrote dist/index.js with ${String(modules.length)} components and completed ${String(rewritten)} declaration files`,
);
