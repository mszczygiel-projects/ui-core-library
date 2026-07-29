import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractComponents, renderLlmsTxt, type CemManifest } from './llms-transformer.ts';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const SUMMARY =
  'Lit web components (Shadow DOM) of the UI Core Library — a framework-agnostic, ' +
  'business-domain-independent design system driven entirely by CSS custom properties.';

const INTRO = `Import \`@mszczygiel-projects/ui-core-wc\` once to register every custom element
(or import a single component module for tree-shaking). All visual styling resolves through
semantic design tokens from \`@mszczygiel-projects/ui-core-foundations\` — import its
\`tokens.css\` (or \`tailwind.css\`) once in your app. Components adapt automatically to
\`data-theme="dark"\` and \`data-surface\` contexts set on any ancestor element.

This file is generated from custom-elements.json (\`pnpm build\`) — do not edit.`;

const manifestPath = path.join(packageRoot, 'custom-elements.json');
if (!fs.existsSync(manifestPath)) {
  throw new Error(
    'generate-llms: custom-elements.json not found — run `pnpm run cem:build` first.',
  );
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as CemManifest;
const components = extractComponents(manifest);

if (components.length === 0) {
  throw new Error('generate-llms: no custom elements found in custom-elements.json.');
}

const packageJson = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));
const output = renderLlmsTxt(packageJson.name, SUMMARY, INTRO, components);

const outFile = path.join(packageRoot, 'dist', 'llms.txt');
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, output);

console.log(`✓ ${path.relative(packageRoot, outFile)} — ${components.length} components`);
