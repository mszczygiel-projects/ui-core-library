/**
 * Builds this package's tokens from the committed exports, in strict mode with the exceptions
 * of token-exceptions.json: the stylesheets and the manifest into dist/, the typed
 * references into src/generated/, where the TypeScript build compiles them.
 *
 * Usage: node scripts/generate.ts
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { buildTokens, reportLines } from '../src/pipeline/build.ts';
import { GENERATED_NOTICE } from '../src/pipeline/emit-css.ts';
import { parseExports, readExports } from '../src/pipeline/parse.ts';
import { parseExceptions } from '../src/pipeline/validate.ts';

const root = join(import.meta.dirname, '..');

/**
 * The type of the default export of tokens.json, which the `types` condition of the export
 * points at, so that TypeScript never infers a type from the large file itself.
 */
const MANIFEST_DECLARATION = `// ${GENERATED_NOTICE}

import type { TokenManifest } from './index.js';

declare const manifest: TokenManifest;
export default manifest;
`;

const result = buildTokens(parseExports(readExports(join(root, 'figma'))), {
  strict: true,
  autoDarkMode: true,
  exceptions: parseExceptions(
    JSON.parse(readFileSync(join(root, 'token-exceptions.json'), 'utf8')),
  ),
});

const report = reportLines(result);
for (const line of report.err) {
  console.error(line);
}
if (result.files === null) {
  process.exitCode = 1;
} else {
  mkdirSync(join(root, 'dist'), { recursive: true });
  mkdirSync(join(root, 'src', 'generated'), { recursive: true });
  writeFileSync(join(root, 'dist', 'tokens.css'), result.files['tokens.css']);
  writeFileSync(join(root, 'dist', 'tailwind.css'), result.files['tailwind.css']);
  writeFileSync(join(root, 'dist', 'typography.css'), result.files['typography.css']);
  writeFileSync(join(root, 'dist', 'tokens.json'), result.files['tokens.json']);
  writeFileSync(join(root, 'dist', 'tokens.json.d.ts'), MANIFEST_DECLARATION);
  writeFileSync(join(root, 'src', 'generated', 'tokens.ts'), result.files['tokens.ts']);
  console.log(
    '✓ Generated dist/tokens.css, dist/tailwind.css, dist/typography.css, dist/tokens.json and src/generated/tokens.ts',
  );
  for (const line of report.out) {
    console.log(line);
  }
}
