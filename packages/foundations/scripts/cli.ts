#!/usr/bin/env node
/**
 * `ui-core-foundations` CLI.
 *
 * Usage:
 *   ui-core-foundations build --input <dir> --output <dir>
 *
 * Defaults to the in-package paths so this entry point also drives the
 * monorepo build (`tsx scripts/cli.ts build`).
 */

import { resolve } from 'path';
import { buildTokens, DEFAULT_INPUT_DIR, DEFAULT_OUTPUT_DIR } from './build-tokens.js';
// import { buildTypography } from './build-typography.js';

interface ParsedArgs {
  command: string | undefined;
  inputDir: string;
  outputDir: string;
  autoDarkMode: boolean;
  help: boolean;
}

function parseArgs(argv: string[]): ParsedArgs {
  const out: ParsedArgs = {
    command: undefined,
    inputDir: DEFAULT_INPUT_DIR,
    outputDir: DEFAULT_OUTPUT_DIR,
    autoDarkMode: true,
    help: false,
  };
  const args = [...argv];
  if (args[0] && !args[0].startsWith('-')) out.command = args.shift();

  while (args.length > 0) {
    const flag = args.shift()!;
    switch (flag) {
      case '--input':
      case '-i': {
        const v = args.shift();
        if (!v) fail(`Missing value for ${flag}`);
        out.inputDir = resolve(v!);
        break;
      }
      case '--output':
      case '-o': {
        const v = args.shift();
        if (!v) fail(`Missing value for ${flag}`);
        out.outputDir = resolve(v!);
        break;
      }
      case '--no-auto-dark':
        out.autoDarkMode = false;
        break;
      case '--help':
      case '-h':
        out.help = true;
        break;
      default:
        fail(`Unknown argument: ${flag}`);
    }
  }
  return out;
}

function fail(msg: string): never {
  console.error(`✗ ${msg}\n`);
  printHelp();
  process.exit(1);
}

function printHelp(): void {
  console.log(`ui-core-foundations — build design tokens from Figma JSON exports

Usage:
  ui-core-foundations build [options]

Options:
  -i, --input  <dir>   Directory with Luckino JSON exports
                       (primitives.json, themes.json, surfaces.json, sizes.json, text-styles.json)
  -o, --output <dir>   Directory for generated files
                       (tokens.css, tailwind.css, tokens.ts, typography.css)
      --no-auto-dark   Do not mirror the Figma "Dark" mode into
                       @media (prefers-color-scheme: dark). Every mode is still emitted
                       as [data-theme="<mode>"]; this only drops the OS-preference
                       fallback that applies when no data-theme attribute is set.
  -h, --help           Show this help

Every Figma mode of the Themes collection becomes its own selector: the "Default" mode
(or the first mode, if there is none) lands on :root, every other mode on
[data-theme="<kebab-case mode name>"] — e.g. DarkGreen → [data-theme="dark-green"].

Example:
  ui-core-foundations build --input ./figma-exports --output ./src/generated/foundations
`);
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || !args.command) {
    printHelp();
    process.exit(args.help ? 0 : 1);
  }

  if (args.command !== 'build') {
    fail(`Unknown command: ${args.command}`);
  }

  buildTokens({
    inputDir: args.inputDir,
    outputDir: args.outputDir,
    autoDarkMode: args.autoDarkMode,
  });
  // buildTypography({ inputDir: args.inputDir, outputDir: args.outputDir });
}

main();
