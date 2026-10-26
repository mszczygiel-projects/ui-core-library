/**
 * Writes the metadata every variable of the Foundations file should carry: its
 * scopes, its WEB code syntax and whether it needs a description. The agent writes the file's
 * variables from it and checks its control read against it. It also reports how the committed
 * exports differ from it.
 *
 * Usage: node scripts/figma-metadata.ts --output <file outside the repository>
 */
import { writeFileSync } from 'node:fs';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import { parseArgs } from 'node:util';

import { variableMetadata } from '../src/pipeline/figma.ts';
import { parseExports, readExports } from '../src/pipeline/parse.ts';
import { findMetadataViolations } from '../src/pipeline/validate.ts';

function isInside(directory: string, path: string): boolean {
  const fromDirectory = relative(directory, path);
  return (
    !isAbsolute(fromDirectory) && fromDirectory !== '..' && !fromDirectory.startsWith(`..${sep}`)
  );
}

const { values } = parseArgs({ options: { output: { type: 'string', short: 'o' } } });
if (values.output === undefined) {
  console.error('✗ Usage: node scripts/figma-metadata.ts --output <file outside the repository>');
  process.exit(1);
}

const root = join(import.meta.dirname, '..');
// The plan is never committed. Nx runs this script in the package, so a relative path
// would leave the plan there, untracked and waiting to be committed by mistake.
const output = resolve(values.output);
if (isInside(join(root, '..', '..'), output)) {
  console.error(
    `✗ ${output} is inside the repository, where the plan is never kept; write it elsewhere, such as a temporary directory`,
  );
  process.exit(1);
}
const tokens = parseExports(readExports(join(root, 'figma')));
const { variables, unknown } = variableMetadata(tokens);
if (unknown.length > 0) {
  for (const id of unknown) {
    console.error(`✗ ${id} matches no scope rule; give its kind of token a rule`);
  }
  process.exit(1);
}

writeFileSync(output, `${JSON.stringify({ variables }, null, 2)}\n`);
console.log(`✓ Wrote the metadata of ${String(variables.length)} variables to ${output}`);

const differences = new Map<string, string[]>();
for (const violation of findMetadataViolations(tokens)) {
  differences.set(violation.rule, [...(differences.get(violation.rule) ?? []), violation.message]);
}
for (const [rule, messages] of differences) {
  console.log(`  ${rule}: ${String(messages.length)} to change, for example`);
  for (const message of messages.slice(0, 3)) {
    console.log(`    ${message}`);
  }
}
