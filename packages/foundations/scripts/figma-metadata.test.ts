import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const root = join(import.meta.dirname, '..');

/** Runs the script as Nx does, from the package. */
function run(output: string) {
  return spawnSync(process.execPath, ['scripts/figma-metadata.ts', '--output', output], {
    cwd: root,
    encoding: 'utf8',
  });
}

describe('figma-metadata', () => {
  let directory: string;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'figma-metadata-'));
  });

  afterEach(() => {
    rmSync(directory, { recursive: true, force: true });
  });

  it('writes the metadata of every variable to a file outside the repository', () => {
    const output = join(directory, 'plan.json');
    const result = run(output);
    expect(result.status).toBe(0);
    const plan = JSON.parse(readFileSync(output, 'utf8')) as { variables: unknown[] };
    expect(plan.variables.length).toBeGreaterThan(0);
    expect(result.stdout).toContain(
      `✓ Wrote the metadata of ${String(plan.variables.length)} variables to ${output}`,
    );
  });

  it('refuses a file inside the repository, where the plan is never kept', () => {
    for (const output of ['plan.json', join(root, '..', '..', 'plan.json')]) {
      const result = run(output);
      expect(result.status, output).toBe(1);
      expect(result.stderr).toContain('is inside the repository');
      expect(existsSync(resolve(root, output)), output).toBe(false);
    }
  });
});
