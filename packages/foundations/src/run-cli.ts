import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

import { buildTokens, OUTPUT_FILES, reportLines } from './pipeline/build.ts';
import { ExportError, parseExports, readExports } from './pipeline/parse.ts';

/** The help text. Its commands and flags are public API from 1.0.0. */
export const HELP = `ui-core-foundations: build design tokens from the exports of a Figma file

Usage:
  ui-core-foundations build --input <dir> --output <dir> [options]

Options:
  -i, --input <dir>   Directory with the Luckino exports: primitives.json, themes.json,
                      surfaces.json and sizes.json, and components.json when the file has
                      that collection
  -o, --output <dir>  Directory to write tokens.css, tailwind.css, tokens.ts,
                      typography.css and tokens.json to
      --strict        Fail on every violation of the token rules, as the library's own
                      build does; without it they are warnings, as in a consumer's build
      --no-auto-dark  Do not mirror the Dark theme onto prefers-color-scheme: dark
  -h, --help          Show this help

The Light or Default mode of Themes, or the first one, lands on :root. Light and Dark set
[data-theme], a further brand <Brand> Light or <Brand> Dark sets [data-brand] as well. Mobile
values of Sizes land on :root and Desktop values apply from breakpoint/lg; a mode named
<Screen> <Density> sets [data-density].
`;

export interface CliIo {
  readonly out: (line: string) => void;
  readonly err: (line: string) => void;
}

function usageError(io: CliIo, message: string): number {
  io.err(`✗ ${message}\n`);
  io.err(HELP);
  return 1;
}

/** Runs the CLI with its arguments and returns the exit code. */
export function runCli(argv: readonly string[], io: CliIo): number {
  let parsed;
  try {
    parsed = parseArgs({
      args: [...argv],
      allowPositionals: true,
      strict: true,
      options: {
        input: { type: 'string', short: 'i' },
        output: { type: 'string', short: 'o' },
        strict: { type: 'boolean' },
        'no-auto-dark': { type: 'boolean' },
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

  let tokens;
  try {
    tokens = parseExports(readExports(resolve(values.input)));
  } catch (error) {
    if (error instanceof ExportError) {
      io.err(`✗ ${error.message}`);
      return 1;
    }
    throw error;
  }

  const result = buildTokens(tokens, {
    strict: values.strict === true,
    autoDarkMode: values['no-auto-dark'] !== true,
  });
  const report = reportLines(result);
  report.err.forEach(io.err);
  if (result.files === null) {
    return 1;
  }

  const output = resolve(values.output);
  mkdirSync(output, { recursive: true });
  for (const file of OUTPUT_FILES) {
    writeFileSync(join(output, file), result.files[file]);
  }
  io.out(`✓ Wrote ${OUTPUT_FILES.join(', ')} to ${output}`);
  report.out.forEach(io.out);
  return 0;
}
