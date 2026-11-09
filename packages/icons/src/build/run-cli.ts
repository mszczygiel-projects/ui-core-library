import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

import { buildDirectory, emitPackage, missingRequired, parseRequired } from './build.ts';

/** The help text. Its commands and flags are public API from 1.0.0. */
export const HELP = `ui-core-icons: build an icon package from your own SVG files

Usage:
  ui-core-icons build --input <dir> --output <dir>

Options:
  -i, --input <dir>   Directory of SVG files named in kebab case, like chevron-down.svg
  -o, --output <dir>  Directory to write the package to: package.json, index.js and index.d.ts
  -h, --help          Show this help

The package has the name and exports of @mszczygiel-projects/ui-core-icons, so the components
render your icons once your package manager points that name at it (pnpm.overrides, overrides
or resolutions). Every icon the components render must be in the set. An icon may hold only
plain shapes; one drawn off the 24 grid, in several colours or with strokes is built with
a warning.
`;

export interface CliIo {
  readonly out: (line: string) => void;
  readonly err: (line: string) => void;
}

/** Where the CLI finds the list of required icons and its own version. */
export interface CliContext {
  readonly packageDir: string;
}

function usageError(io: CliIo, message: string): number {
  io.err(`✗ ${message}\n`);
  io.err(HELP);
  return 1;
}

/** Runs the CLI with its arguments and returns the exit code. */
export function runCli(argv: readonly string[], io: CliIo, context: CliContext): number {
  let parsed;
  try {
    parsed = parseArgs({
      args: [...argv],
      allowPositionals: true,
      strict: true,
      options: {
        input: { type: 'string', short: 'i' },
        output: { type: 'string', short: 'o' },
        help: { type: 'boolean', short: 'h' },
      },
    });
  } catch (error) {
    return usageError(io, error instanceof Error ? error.message : String(error));
  }
  const { values, positionals } = parsed;
  if (values.help === true) {
    io.out(HELP);
    return 0;
  }
  const [command, ...extra] = positionals;
  if (command !== 'build' || extra.length > 0) {
    return usageError(
      io,
      command === undefined ? 'Missing command' : `Unknown command: ${positionals.join(' ')}`,
    );
  }
  if (values.input === undefined || values.output === undefined) {
    return usageError(io, 'build needs --input and --output');
  }
  const input = resolve(values.input);
  if (!existsSync(input)) {
    io.err(`✗ ${input} does not exist`);
    return 1;
  }

  const { icons, errors, warnings } = buildDirectory(input, { strict: false });
  const required = parseRequired(
    readFileSync(join(context.packageDir, 'required-icons.txt'), 'utf8'),
  );
  const problems = [...errors, ...(errors.length > 0 ? [] : missingRequired(icons, required))];
  for (const warning of warnings) {
    io.err(`⚠ ${warning}`);
  }
  if (problems.length > 0) {
    for (const problem of problems) {
      io.err(`✗ ${problem}`);
    }
    io.err(`✗ Nothing was written: ${String(problems.length)} error(s)`);
    return 1;
  }

  const { version } = JSON.parse(
    readFileSync(join(context.packageDir, 'package.json'), 'utf8'),
  ) as {
    version: string;
  };
  const output = resolve(values.output);
  mkdirSync(output, { recursive: true });
  for (const [name, content] of Object.entries(emitPackage(icons, version))) {
    writeFileSync(join(output, name), content);
  }
  io.out(`✓ Wrote a package of ${String(icons.length)} icons to ${output}`);
  return 0;
}
