#!/usr/bin/env node
/**
 * `ui-core-icons` CLI.
 *
 * Usage:
 *   ui-core-icons build --input <svg-dir> --output <dist-dir>
 */

import { resolve } from 'path';
import { buildIcons, DEFAULT_SVG_DIR, DEFAULT_DIST_DIR } from './build-icons.js';

interface ParsedArgs {
  command: string | undefined;
  inputDir: string;
  outputDir: string;
  help: boolean;
}

function parseArgs(argv: string[]): ParsedArgs {
  const out: ParsedArgs = {
    command: undefined,
    inputDir: DEFAULT_SVG_DIR,
    outputDir: DEFAULT_DIST_DIR,
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
  console.log(`ui-core-icons — build icon set from SVG sources

Usage:
  ui-core-icons build [options]

Options:
  -i, --input  <dir>   Directory with .svg sources (files must be named icon-*.svg)
  -o, --output <dir>   Output directory; receives svg-map.js, icon-names.d.ts and react/*
  -h, --help           Show this help

Example:
  ui-core-icons build --input ./brand-icons --output ./src/generated/icons
`);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || !args.command) {
    printHelp();
    process.exit(args.help ? 0 : 1);
  }

  if (args.command !== 'build') {
    fail(`Unknown command: ${args.command}`);
  }

  await buildIcons({ inputDir: args.inputDir, outputDir: args.outputDir });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
