import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  listComponentFiles,
  loadCompilerOptions,
  parseComponents,
  renderLlmsTxt,
} from './llms-transformer.ts';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const SUMMARY =
  'React 18+ (light DOM) components of the UI Core Library — a framework-agnostic, ' +
  'business-domain-independent design system driven entirely by CSS custom properties.';

const INTRO = `Import components from \`@mszczygiel-projects/ui-core-react\`. All visual styling
resolves through semantic design tokens from \`@mszczygiel-projects/ui-core-foundations\` —
import its \`tokens.css\` (or \`tailwind.css\`) once in your app, and never override component
internals with hardcoded values. Components adapt automatically to \`data-theme="dark"\` and
\`data-surface\` contexts set on any ancestor element.

This file is generated from JSDoc in the component sources (\`pnpm build\`) — do not edit.`;

const files = listComponentFiles(path.join(packageRoot, 'src'));
const compilerOptions = loadCompilerOptions(path.join(packageRoot, 'tsconfig.json'));
const entries = parseComponents(files, compilerOptions);

if (entries.length === 0) {
  throw new Error('generate-llms: no components found — docgen output is empty.');
}

const packageJson = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));
const output = renderLlmsTxt(packageJson.name, SUMMARY, INTRO, entries);

const outFile = path.join(packageRoot, 'dist', 'llms.txt');
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, output);

console.log(`✓ ${path.relative(packageRoot, outFile)} — ${entries.length} components`);
