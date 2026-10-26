/**
 * Completes Stencil's build into a package that Node.js and TypeScript resolve as ES modules:
 *
 * - the root module defines every component. Stencil writes one module per component, each
 *   defining its own tag, and a root that only re-exports its helpers;
 * - relative imports in the declarations name the `.js` file that Node.js resolves. Stencil writes
 *   them without an extension, or with the `.ts` of the source;
 * - the declaration of each component loads the declarations of its source, where the component
 *   adds members that Stencil does not type, such as the form API, to the type of its element.
 *
 * Usage: node scripts/finish-build.ts
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const dist = join(import.meta.dirname, '..', 'dist');

interface Manifest {
  readonly modules: readonly {
    readonly path: string;
    readonly declarations: readonly { readonly name: string; readonly tagName?: string }[];
  }[];
}

const manifest = JSON.parse(readFileSync(join(dist, 'custom-elements.json'), 'utf8')) as Manifest;
const components = manifest.modules
  .flatMap((module) =>
    module.declarations.flatMap(({ name, tagName }) =>
      tagName === undefined ? [] : [{ name, tagName, source: module.path }],
    ),
  )
  .sort((a, b) => (a.tagName < b.tagName ? -1 : 1));

// The root names each class: every module of a component also exports its own
// defineCustomElement, which a star export would make ambiguous.
const root = `${components
  .map(({ name, tagName }) => `export { ${name} } from './components/${tagName}.js';`)
  .join('\n')}\n`;
writeFileSync(join(dist, 'index.js'), root);
writeFileSync(join(dist, 'index.d.ts'), root);

// dist/components/ui-button.d.ts loads dist/types/button/button.d.ts, from src/button/button.tsx.
for (const { tagName, source } of components) {
  const types = source.replace(/^src\//, '../types/').replace(/\.tsx?$/, '.js');
  const file = join(dist, 'components', `${tagName}.d.ts`);
  const text = readFileSync(file, 'utf8');
  const load = `import '${types}';\n`;
  if (!text.startsWith(load)) {
    writeFileSync(file, `${load}${text}`);
  }
}

const RELATIVE = /(from\s+|import\s*\(\s*)(["'])(\.{1,2}\/[^"']+?)\2/g;

/** The specifier with the extension of the declaration it names, or unchanged. */
function withExtension(file: string, specifier: string): string {
  if (/\.(js|mjs|json)$/.test(specifier)) {
    return specifier;
  }
  if (specifier.endsWith('.ts')) {
    return `${specifier.slice(0, -'.ts'.length)}.js`;
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
  `✓ Wrote dist/index.js with ${String(components.length)} components and completed ${String(rewritten)} declaration files`,
);
