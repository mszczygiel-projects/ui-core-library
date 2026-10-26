/**
 * Builds this package's module of icons from the SVG files of [Core] Icons in figma/: every icon
 * is checked strictly, the set must hold every icon the components require, and the module is
 * written to src/generated/icons.ts, which the TypeScript build compiles with the package.
 *
 * Usage: node scripts/generate.ts
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { buildDirectory, emitModule, missingRequired, parseRequired } from '../src/build/build.ts';

const root = join(import.meta.dirname, '..');

const { icons, errors } = buildDirectory(join(root, 'figma'), { strict: true });
const problems = [
  ...errors,
  ...missingRequired(icons, parseRequired(readFileSync(join(root, 'required-icons.txt'), 'utf8'))),
];
if (problems.length > 0) {
  for (const problem of problems) {
    console.error(`✗ ${problem}`);
  }
  console.error(`✗ Nothing was written: ${String(problems.length)} error(s)`);
  process.exitCode = 1;
} else {
  mkdirSync(join(root, 'src', 'generated'), { recursive: true });
  writeFileSync(join(root, 'src', 'generated', 'icons.ts'), emitModule(icons));
  console.log(`✓ Generated src/generated/icons.ts with ${String(icons.length)} icons`);
}
