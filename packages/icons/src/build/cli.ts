#!/usr/bin/env node
import { fileURLToPath } from 'node:url';

import { runCli } from './run-cli.ts';

process.exitCode = runCli(
  process.argv.slice(2),
  {
    out: (line) => {
      console.log(line);
    },
    err: (line) => {
      console.error(line);
    },
  },
  // dist/build/cli.js, two levels below the package with its version and required icons.
  { packageDir: fileURLToPath(new URL('../..', import.meta.url)) },
);
