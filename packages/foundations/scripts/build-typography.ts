/**
 * Typography build pipeline.
 *
 * Reads src/figma-exports/text-styles.json (Luckino Text Styles export) and
 * writes src/typography.css — one utility class per Figma Text Style.
 *
 * Reference resolution: {typography.body.font-size} → var(--typography-body-font-size)
 * Class naming: name.toLowerCase().replace(/\//g, '-').replace(/\s+/g, '-') → .text-{result}
 *
 * Run via: pnpm foundations:build
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { buildTypographyCss, type TextStylesJson } from './typography-transformer.ts';

// ─── Paths ───────────────────────────────────────────────────────────────

const ROOT = join(import.meta.dirname, '..');
const INPUT = join(ROOT, 'src', 'figma-exports', 'text-styles.json');
const OUTPUT = join(ROOT, 'src', 'typography.css');

// ─── I/O ─────────────────────────────────────────────────────────────────

function loadJson(): TextStylesJson {
  try {
    return JSON.parse(readFileSync(INPUT, 'utf8')) as TextStylesJson;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      console.error(
        `✗ Missing input file: ${INPUT}\n` +
          `  Export Text Styles from Figma using the Luckino plugin and drop\n` +
          `  the result into src/figma-exports/text-styles.json.`,
      );
    } else {
      console.error(`✗ Failed to read ${INPUT}:`, err);
    }
    process.exit(1);
  }
}

// ─── Main ────────────────────────────────────────────────────────────────

function main(): void {
  const { textStyles, metadata } = loadJson();

  if (!Array.isArray(textStyles) || textStyles.length === 0) {
    console.error('✗ text-styles.json contains no textStyles entries.');
    process.exit(1);
  }

  const { css, warnings } = buildTypographyCss(textStyles);

  writeFileSync(OUTPUT, css);

  for (const w of warnings) console.warn(`⚠ ${w}`);

  console.log(`\n✓ Generated typography.css`);
  console.log(`  — ${metadata.successfulStyles}/${metadata.totalStyles} styles processed`);
  if (warnings.length > 0) console.log(`  — ${warnings.length} warning(s)`);
}

main();
