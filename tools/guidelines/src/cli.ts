/**
 * Writes the guidelines of the three Figma libraries into dist/<library>/, where the owner uploads
 * them with Library › Manage guidelines in each file, and the documentation links of the component
 * sets into dist/documentation-links.json, which an agent writes into [Core] UI Library.
 *
 * Usage: node src/cli.ts
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { buildGuidelines, documentedComponents, LIBRARY_LIMIT, sizeOf } from './build.ts';
import { documentationLinks } from './links.ts';

const dist = join(import.meta.dirname, '..', 'dist');
rmSync(dist, { recursive: true, force: true });
const guidelines = buildGuidelines();
for (const [library, files] of Object.entries(guidelines)) {
  const size = sizeOf(files);
  if (size > LIBRARY_LIMIT) {
    console.error(`✗ The guidelines of ${library} take ${String(size)} bytes, over Figma's limit`);
    process.exitCode = 1;
  }
  for (const [name, text] of Object.entries(files)) {
    const path = join(dist, library, name);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, text);
  }
  console.log(
    `✓ ${library}: ${String(Object.keys(files).length)} files, ${String(Math.round(size / 1024))} KB`,
  );
}

const links = documentationLinks(documentedComponents());
writeFileSync(join(dist, 'documentation-links.json'), `${JSON.stringify(links, null, 2)}\n`);
console.log(`✓ documentation links: ${String(Object.keys(links).length)} component sets`);
