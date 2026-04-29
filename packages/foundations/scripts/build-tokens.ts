/**
 * Token build pipeline entry point.
 *
 * Reads 4 W3C Design Tokens JSON files exported from Figma (Luckino plugin)
 * and writes the generated outputs to src/.
 *
 * Pure transformation logic lives in ./tokens-transformer.ts.
 * Run via: pnpm --filter @ui-core/tokens run tokens:build
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import {
  type Collection,
  type Token,
  walk,
  buildTokensCss,
  buildTailwindCss,
  buildTokensTs,
  detectCycles,
  tokenKey,
  normalizedPath,
} from './tokens-transformer.ts';

// ─── Paths ───────────────────────────────────────────────────────────────

const ROOT = join(import.meta.dirname, '..');
const INPUT_DIR = join(ROOT, 'src', 'figma-exports');
const OUTPUT_DIR = join(ROOT, 'src');

// ─── I/O ─────────────────────────────────────────────────────────────────

function loadJson(filename: string): unknown {
  const path = join(INPUT_DIR, filename);
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      console.error(
        `✗ Missing input file: ${path}\n` +
          `  See src/figma-exports/README.md for how to produce it (Luckino plugin export).`,
      );
    } else {
      console.error(`✗ Failed to read ${path}:`, err);
    }
    process.exit(1);
  }
}

function loadAllTokens(): Token[] {
  const primitives = loadJson('primitives.json') as Record<string, unknown>;
  const themes = loadJson('themes.json') as Record<string, unknown>;
  const surfaces = loadJson('surfaces.json') as Record<string, unknown>;
  const sizes = loadJson('sizes.json') as Record<string, unknown>;

  const tokens: Token[] = [];
  for (const key of [
    'Primitives Colors',
    'Primitives Sizes',
    'Primitives Motions',
    'Primitives Shadows',
  ] as const) {
    walk(primitives[key], key, [], tokens);
  }
  walk(themes, 'Themes', [], tokens);
  walk(surfaces, 'Surfaces', [], tokens);
  walk(sizes, 'Sizes', [], tokens);
  return tokens;
}

// ─── Main ────────────────────────────────────────────────────────────────

function main(): void {
  const tokens = loadAllTokens();

  const registry = new Map<string, Token>();
  for (const t of tokens) registry.set(tokenKey(t.collection, normalizedPath(t.path)), t);

  const warnings = { circular: [] as string[], violations: [] as string[], broken: [] as string[] };

  const bpXlToken = registry.get(tokenKey('Primitives Sizes', ['breakpoint', 'xl']));
  if (!bpXlToken || typeof bpXlToken.value !== 'number') {
    console.error(
      `✗ Missing token: Primitives Sizes → breakpoint/xl\n` +
        `  Add "breakpoint": { "xl": { "$value": 1280, "$type": "number" } } to src/figma-exports/primitives.json\n` +
        `  This value is used as the @media (min-width: …) threshold for Desktop Sizes overrides.`,
    );
    process.exit(1);
  }
  const breakpointXlPx = bpXlToken.value;

  detectCycles(tokens, registry, warnings);

  const tokensCss = buildTokensCss(tokens, registry, warnings, breakpointXlPx);
  const tailwindCss = buildTailwindCss(tokens);
  const tokensTs = buildTokensTs(tokens);

  writeFileSync(join(OUTPUT_DIR, 'tokens.css'), tokensCss);
  writeFileSync(join(OUTPUT_DIR, 'tailwind.css'), tailwindCss);
  writeFileSync(join(OUTPUT_DIR, 'tokens.ts'), tokensTs);

  for (const c of warnings.circular) console.warn(`⚠ CIRCULAR: ${c}`);
  for (const v of warnings.violations) console.warn(`⚠ VIOLATION: ${v}`);
  for (const b of warnings.broken) console.warn(`⚠ BROKEN REF: ${b}`);

  const total = warnings.circular.length + warnings.violations.length + warnings.broken.length;
  console.log(`\n✓ Generated tokens.css, tailwind.css, tokens.ts`);
  console.log(`  — ${tokens.length} tokens processed`);
  console.log(
    `  — ${total} warnings (${warnings.circular.length} circular, ${warnings.violations.length} violations, ${warnings.broken.length} broken)`,
  );
}

main();
