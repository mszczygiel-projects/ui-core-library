/**
 * Typography build pipeline.
 *
 * Reads <inputDir>/text-styles.json (Luckino Text Styles export) and writes
 * <outputDir>/typography.css — one utility class per Figma Text Style.
 *
 * Reference resolution: {typography.body.font-size} → var(--typography-body-font-size)
 * Class naming: name.toLowerCase().replace(/\//g, '-').replace(/\s+/g, '-') → .text-{result}
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { buildTypographyCss, type TextStylesJson } from './typography-transformer.js';
import { DEFAULT_INPUT_DIR, DEFAULT_OUTPUT_DIR } from './build-tokens.js';

export interface BuildTypographyOptions {
  inputDir: string;
  outputDir: string;
}

function loadJson(input: string): TextStylesJson {
  try {
    return JSON.parse(readFileSync(input, 'utf8')) as TextStylesJson;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      console.error(
        `✗ Missing input file: ${input}\n` +
          `  Export Text Styles from Figma using the Luckino plugin and place\n` +
          `  the result as text-styles.json in the input directory.`,
      );
    } else {
      console.error(`✗ Failed to read ${input}:`, err);
    }
    process.exit(1);
  }
}

export function buildTypography(
  options: BuildTypographyOptions = {
    inputDir: DEFAULT_INPUT_DIR,
    outputDir: DEFAULT_OUTPUT_DIR,
  },
): void {
  const { inputDir, outputDir } = options;
  const input = join(inputDir, 'text-styles.json');
  const output = join(outputDir, 'typography.css');

  const { textStyles, metadata } = loadJson(input);

  if (!Array.isArray(textStyles) || textStyles.length === 0) {
    console.error('✗ text-styles.json contains no textStyles entries.');
    process.exit(1);
  }

  const { css, warnings } = buildTypographyCss(textStyles);

  writeFileSync(output, css);

  for (const w of warnings) console.warn(`⚠ ${w}`);

  console.log(`\n✓ Generated typography.css in ${outputDir}`);
  console.log(`  — ${metadata.successfulStyles}/${metadata.totalStyles} styles processed`);
  if (warnings.length > 0) console.log(`  — ${warnings.length} warning(s)`);
}

const isDirectRun =
  process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;
if (isDirectRun) {
  buildTypography();
}
