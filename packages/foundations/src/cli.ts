#!/usr/bin/env node
import { runCli } from './run-cli.ts';

process.exitCode = runCli(process.argv.slice(2), {
  out: (line) => {
    console.log(line);
  },
  err: (line) => {
    console.error(line);
  },
});
