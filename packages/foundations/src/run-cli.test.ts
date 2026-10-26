import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { EXPORTS_DIR } from './pipeline/tokens.fixture.ts';
import { HELP, runCli } from './run-cli.ts';

function run(...argv: string[]) {
  const out: string[] = [];
  const err: string[] = [];
  const code = runCli(argv, {
    out: (line) => out.push(line),
    err: (line) => err.push(line),
  });
  return { code, out: out.join('\n'), err: err.join('\n') };
}

describe('runCli', () => {
  let output: string;

  beforeEach(() => {
    output = mkdtempSync(join(tmpdir(), 'ui-core-tokens-'));
  });

  afterEach(() => {
    rmSync(output, { recursive: true, force: true });
  });

  it('shows the help', () => {
    expect(run('--help')).toEqual({ code: 0, out: HELP, err: '' });
    expect(run('-h').code).toBe(0);
  });

  it('rejects a missing command, an unknown command and an unknown flag', () => {
    expect(run().err).toContain('✗ Missing command');
    expect(run('watch').err).toContain('✗ Unknown command: watch');
    const unknown = run('build', '--input', EXPORTS_DIR, '--output', output, '--verbose');
    expect(unknown.code).toBe(1);
    expect(unknown.err).toContain("Unknown option '--verbose'");
  });

  it('needs both directories', () => {
    const result = run('build', '--input', EXPORTS_DIR);
    expect(result.code).toBe(1);
    expect(result.err).toContain('✗ build needs --input and --output');
  });

  it('names a missing export', () => {
    const result = run('build', '-i', output, '-o', output);
    expect(result.code).toBe(1);
    expect(result.err).toMatch(/✗ Missing export .*primitives\.json/);
  });

  it('builds a fork, reporting the rule violations as warnings', () => {
    const result = run('build', '-i', EXPORTS_DIR, '-o', output);
    expect(result.code).toBe(0);
    expect(result.out).toContain(
      `✓ Wrote tokens.css, tailwind.css, tokens.ts, typography.css, tokens.json to ${output}`,
    );
    expect(result.err).toContain('⚠ Components/');
    for (const file of [
      'tokens.css',
      'tailwind.css',
      'tokens.ts',
      'typography.css',
      'tokens.json',
    ]) {
      expect(existsSync(join(output, file)), file).toBe(true);
    }
    expect(readFileSync(join(output, 'tokens.css'), 'utf8')).toContain(
      '@media (prefers-color-scheme: dark)',
    );
  });

  it('writes nothing in strict mode while violations remain', () => {
    const result = run('build', '-i', EXPORTS_DIR, '-o', output, '--strict');
    expect(result.code).toBe(1);
    expect(result.err).toContain('✗ Nothing was written');
    expect(existsSync(join(output, 'tokens.css'))).toBe(false);
  });

  it('can leave out the system preference mirror of the Dark theme', () => {
    expect(run('build', '-i', EXPORTS_DIR, '-o', output, '--no-auto-dark').code).toBe(0);
    const css = readFileSync(join(output, 'tokens.css'), 'utf8');
    expect(css).not.toContain('prefers-color-scheme');
    expect(css).toContain('[data-theme="dark"]');
  });
});
