import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { HELP, runCli } from './run-cli.ts';

const FILLED = (d: string): string =>
  `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="${d}" fill="#000"/></svg>`;
const STROKED = (d: string): string =>
  `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="${d}" stroke="#000"/></svg>`;

describe('runCli', () => {
  let root: string;
  let input: string;
  let output: string;
  let packageDir: string;

  function run(...argv: string[]) {
    const out: string[] = [];
    const err: string[] = [];
    const code = runCli(
      argv,
      { out: (line) => out.push(line), err: (line) => err.push(line) },
      { packageDir },
    );
    return { code, out: out.join('\n'), err: err.join('\n') };
  }

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'ui-core-icons-'));
    input = join(root, 'svg');
    output = join(root, 'out');
    packageDir = join(root, 'package');
    mkdirSync(input);
    mkdirSync(packageDir);
    writeFileSync(join(packageDir, 'package.json'), '{"version":"1.2.3"}');
    writeFileSync(join(packageDir, 'required-icons.txt'), 'close\n');
    writeFileSync(join(input, 'close.svg'), FILLED('M6 6l12 12M18 6L6 18'));
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('writes a package with the version of the library', () => {
    writeFileSync(join(input, 'star.svg'), STROKED('M12 3l3 6h6'));
    const { code, out, err } = run('build', '--input', input, '--output', output);
    expect(code).toBe(0);
    expect(out).toContain('2 icons');
    expect(err).toMatch(/⚠ star\.svg draws with strokes/);
    const manifest = JSON.parse(readFileSync(join(output, 'package.json'), 'utf8')) as {
      version: string;
    };
    expect(manifest.version).toBe('1.2.3');
    expect(readFileSync(join(output, 'index.js'), 'utf8')).toContain('export const iconStar');
  });

  it('writes nothing when a required icon is missing', () => {
    rmSync(join(input, 'close.svg'));
    writeFileSync(join(input, 'star.svg'), STROKED('M12 3l3 6h6'));
    const { code, err } = run('build', '-i', input, '-o', output);
    expect(code).toBe(1);
    expect(err).toMatch(/✗ close\.svg is missing/);
    expect(existsSync(output)).toBe(false);
  });

  it('writes nothing when a file is badly named', () => {
    writeFileSync(join(input, 'Star.svg'), STROKED('M12 3l3 6h6'));
    const { code, err } = run('build', '-i', input, '-o', output);
    expect(code).toBe(1);
    expect(err).toMatch(/Star\.svg is not named in kebab case/);
    expect(existsSync(output)).toBe(false);
  });

  it('explains its usage', () => {
    expect(run('--help')).toMatchObject({ code: 0, out: HELP });
    expect(run('build', '--input', input)).toMatchObject({ code: 1 });
    expect(run('publish')).toMatchObject({ code: 1 });
    expect(run('build', '-i', join(root, 'none'), '-o', output).err).toMatch(/does not exist/);
  });
});
