/**
 * Token build pipeline entry point.
 *
 * Reads 4 W3C Design Tokens JSON files exported from Figma (Luckino plugin)
 * and writes tokens.css / tailwind.css / tokens.ts to the output directory.
 *
 * Pure transformation logic lives in ./tokens-transformer.ts.
 *
 * In the monorepo: invoked via `pnpm foundations:build` (defaults).
 * For consumers: invoked via the `ui-core-foundations` bin (custom input/output).
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import {
  type Token,
  walk,
  buildTokensCss,
  buildTailwindCss,
  buildTokensTs,
  detectCycles,
  tokenKey,
  normalizedPath,
  collectModes,
  baseModeOf,
  modeSlug,
} from './tokens-transformer.js';

export interface BuildTokensOptions {
  inputDir: string;
  outputDir: string;
  /**
   * Mirror the Figma `Dark` mode into `@media (prefers-color-scheme: dark)` on top of its
   * `[data-theme="dark"]` block, so the OS setting still applies when no theme attribute is
   * set. Turn it off in projects that always drive the theme from `data-theme`.
   * @default true
   */
  autoDarkMode?: boolean;
}

export const DEFAULT_FOUNDATIONS_ROOT = join(import.meta.dirname, '..');
export const DEFAULT_INPUT_DIR = join(DEFAULT_FOUNDATIONS_ROOT, 'src', 'figma-exports');
export const DEFAULT_OUTPUT_DIR = join(DEFAULT_FOUNDATIONS_ROOT, 'src');

function loadJson(inputDir: string, filename: string): unknown {
  const path = join(inputDir, filename);
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      console.error(
        `✗ Missing input file: ${path}\n` +
          `  Export it from Figma using the Luckino plugin and place it in the input directory.`,
      );
    } else {
      console.error(`✗ Failed to read ${path}:`, err);
    }
    process.exit(1);
  }
}

/**
 * Reads an export that may legitimately be absent.
 *
 * `components.json` only exists once the token restructure has run in Figma
 * (see packages/foundations/docs/token-audit.md). Before that the collection simply
 * is not there, and a missing file is not an error — unlike the four required exports,
 * where a missing file means a broken Luckino export and has to stop the build.
 */
function loadOptionalJson(inputDir: string, filename: string): unknown | null {
  const path = join(inputDir, filename);
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    console.error(`✗ Failed to read ${path}:`, err);
    process.exit(1);
  }
}

function loadAllTokens(inputDir: string): Token[] {
  const primitives = loadJson(inputDir, 'primitives.json') as Record<string, unknown>;
  const themes = loadJson(inputDir, 'themes.json') as Record<string, unknown>;
  const surfaces = loadJson(inputDir, 'surfaces.json') as Record<string, unknown>;
  const components = loadOptionalJson(inputDir, 'components.json') as Record<
    string,
    unknown
  > | null;
  const sizes = loadJson(inputDir, 'sizes.json') as Record<string, unknown>;

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
  if (components) walk(components, 'Components', [], tokens);
  walk(sizes, 'Sizes', [], tokens);
  return tokens;
}

export function buildTokens(
  options: BuildTokensOptions = {
    inputDir: DEFAULT_INPUT_DIR,
    outputDir: DEFAULT_OUTPUT_DIR,
  },
): void {
  const { inputDir, outputDir, autoDarkMode = true } = options;
  const tokens = loadAllTokens(inputDir);

  const registry = new Map<string, Token>();
  for (const t of tokens) registry.set(tokenKey(t.collection, normalizedPath(t.path)), t);

  const warnings = { circular: [] as string[], violations: [] as string[], broken: [] as string[] };

  const bpXlToken = registry.get(tokenKey('Primitives Sizes', ['breakpoint', 'xl']));
  if (!bpXlToken || typeof bpXlToken.value !== 'number') {
    console.error(
      `✗ Missing token: Primitives Sizes → breakpoint/xl\n` +
        `  Add "breakpoint": { "xl": { "$value": 1280, "$type": "number" } } to primitives.json\n` +
        `  This value is used as the @media (min-width: …) threshold for Desktop Sizes overrides.`,
    );
    process.exit(1);
  }
  const breakpointXlPx = bpXlToken.value;

  detectCycles(tokens, registry, warnings);

  const tokensCss = buildTokensCss(tokens, registry, warnings, breakpointXlPx, { autoDarkMode });
  const tailwindCss = buildTailwindCss(tokens);
  const tokensTs = buildTokensTs(tokens);

  writeFileSync(join(outputDir, 'tokens.css'), tokensCss);
  writeFileSync(join(outputDir, 'tailwind.css'), tailwindCss);
  writeFileSync(join(outputDir, 'tokens.ts'), tokensTs);

  for (const c of warnings.circular) console.warn(`⚠ CIRCULAR: ${c}`);
  for (const v of warnings.violations) console.warn(`⚠ VIOLATION: ${v}`);
  for (const b of warnings.broken) console.warn(`⚠ BROKEN REF: ${b}`);

  const total = warnings.circular.length + warnings.violations.length + warnings.broken.length;
  const themeModes = collectModes(tokens.filter((t) => t.collection === 'Themes'));
  const baseThemeMode = baseModeOf(themeModes);
  const themeSummary = themeModes
    .map((m) => (m === baseThemeMode ? `${m} (:root)` : `${m} ([data-theme="${modeSlug(m)}"])`))
    .join(', ');

  const componentCount = tokens.filter((t) => t.collection === 'Components').length;

  console.log(`\n✓ Generated tokens.css, tailwind.css, tokens.ts in ${outputDir}`);
  console.log(`  — ${tokens.length} tokens processed`);
  console.log(
    componentCount > 0
      ? `  — ${componentCount} component tokens (Components collection)`
      : `  — no components.json — component tokens still live in Themes/Surfaces`,
  );
  console.log(`  — ${themeModes.length} theme modes: ${themeSummary || '(none)'}`);
  console.log(
    `  — ${total} warnings (${warnings.circular.length} circular, ${warnings.violations.length} violations, ${warnings.broken.length} broken)`,
  );
}

// Allow direct execution: `tsx scripts/build-tokens.ts` (monorepo default paths).
const isDirectRun =
  process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;
if (isDirectRun) {
  buildTokens();
}
