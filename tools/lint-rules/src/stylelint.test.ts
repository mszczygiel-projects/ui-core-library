import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import stylelint from 'stylelint';
import { describe, expect, it } from 'vitest';

import { isReadableByComponents, manifest, tokensByName } from './manifest.ts';
import {
  containerBreakpoints,
  customPropertiesRead,
  mediaLengths,
  rawValues,
  uiCorePlugins,
} from './stylelint.ts';

const plugins = uiCorePlugins(stylelint);

async function lint(code: string, rules: Record<string, unknown>, codeFilename?: string) {
  const { results } = await stylelint.lint({
    code,
    codeFilename,
    config: { plugins: [...plugins], rules },
  });
  return results.flatMap((result) => result.warnings.map((warning) => warning.text));
}

describe('the helpers', () => {
  it('lists the custom properties a value reads, fallbacks included', () => {
    expect(customPropertiesRead('var(--a) calc(var(--_b) * 2) var(--c, var(--d))')).toEqual([
      '--a',
      '--_b',
      '--c',
      '--d',
    ]);
  });

  it('finds lengths and times, but not zero, geometry or plain counts', () => {
    expect(rawValues('margin', '4px 0 0.5rem var(--x)')).toEqual(['4px', '0.5rem']);
    expect(rawValues('transition', 'opacity 150ms')).toEqual(['150ms']);
    expect(rawValues('transform', 'rotate(1turn) translate(50%)')).toEqual([]);
    expect(rawValues('grid-template-columns', 'repeat(3, 1fr)')).toEqual([]);
    expect(rawValues('flex', '1 1 0')).toEqual([]);
    expect(rawValues('min-block-size', '100dvh')).toEqual([]);
  });

  it('finds the unitless numbers of visual properties', () => {
    expect(rawValues('opacity', '0.4')).toEqual(['0.4']);
    expect(rawValues('opacity', '0')).toEqual([]);
    expect(rawValues('line-height', '1.5')).toEqual(['1.5']);
  });

  it('reads the lengths of a media query', () => {
    expect(mediaLengths('(width >= 64rem)')).toEqual(['64rem']);
    expect(mediaLengths('(min-width: 48em) and (max-width: 1200px)')).toEqual(['48em', '1200px']);
    expect(mediaLengths('(prefers-reduced-motion: reduce)')).toEqual([]);
  });

  it('lets components read the Components layer, the focus ring and motion only', () => {
    const readable = (name: string) => {
      const token = tokensByName.get(name);
      if (token === undefined) {
        throw new Error(`Missing ${name}`);
      }
      return isReadableByComponents(token);
    };
    expect(readable('--button-radius')).toBe(true);
    expect(readable('--color-ring-default')).toBe(true);
    expect(readable('--ring-offset')).toBe(true);
    expect(readable('--stroke-ring')).toBe(true);
    expect(readable('--duration-150')).toBe(true);
    expect(readable('--ease-linear')).toBe(true);
    expect(readable('--color-text-primary')).toBe(false);
    expect(readable('--stroke-accent')).toBe(false);
    expect(readable('--spacing-4')).toBe(false);
  });
});

describe('ui-core/known-tokens', () => {
  const rules = { 'ui-core/known-tokens': true };

  it('accepts tokens of the manifest and private aliases declared in the stylesheet', async () => {
    const code = '.a { --_size: var(--button-icon-size); inline-size: var(--_size); }';
    expect(await lint(code, rules)).toEqual([]);
  });

  it('rejects an unknown token', async () => {
    expect(await lint('.a { color: var(--color-text-primry); }', rules)).toEqual([
      'Unknown token --color-text-primry: take token names from packages/foundations/token-names.txt (ui-core/known-tokens)',
    ]);
  });

  it('rejects a private alias that the stylesheet does not declare', async () => {
    const warnings = await lint('.a { inline-size: var(--_size); }', rules);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('--_size is read but never declared');
  });

  it('accepts the private aliases of the shared stylesheets of the same package only', async () => {
    const root = mkdtempSync(join(tmpdir(), 'ui-core-lint-'));
    try {
      mkdirSync(join(root, 'package', 'src', 'internal'), { recursive: true });
      writeFileSync(
        join(root, 'package', 'src', 'internal', 'surface.css'),
        '.surface { --_size: var(--button-icon-size); }',
      );
      const code = '.a { inline-size: var(--_size); }';
      expect(await lint(code, rules, join(root, 'package', 'src', 'a', 'a.css'))).toEqual([]);
      expect(await lint(code, rules, join(root, 'other', 'src', 'a', 'a.css'))).toHaveLength(1);
      expect(
        await lint(
          '.b { inline-size: var(--_size); }',
          rules,
          join(root, 'package', 'src', 'internal', 'b.css'),
        ),
      ).toHaveLength(1);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('ui-core/token-layer', () => {
  const rules = { 'ui-core/token-layer': true };

  it('rejects a role read by a component', async () => {
    const warnings = await lint('.a { color: var(--color-text-primary); }', rules);
    expect(warnings).toEqual([
      '--color-text-primary is a token of Surfaces: a component reads the Components layer, the roles of the focus ring and the motion primitives (ui-core/token-layer)',
    ]);
  });

  it('accepts component tokens, the focus ring and motion', async () => {
    const code = `.a {
      border-radius: var(--button-radius);
      outline: var(--stroke-ring) var(--ring-style) var(--color-ring-default);
      transition: opacity var(--duration-150) var(--ease-out);
    }`;
    expect(await lint(code, rules)).toEqual([]);
  });
});

describe('ui-core/no-raw-values', () => {
  const rules = { 'ui-core/no-raw-values': true };

  it('rejects lengths and times, also in fallbacks', async () => {
    const warnings = await lint('.a { margin: var(--x, 4px); transition: color 1s; }', rules);
    expect(warnings).toEqual([
      'Raw value 4px: every visual value comes from a token (ui-core/no-raw-values)',
      'Raw value 1s: every visual value comes from a token (ui-core/no-raw-values)',
    ]);
  });

  it('accepts zero, keywords and geometry', async () => {
    const code = '.a { margin: 0; inset: auto; transform: rotate(1turn); inline-size: 100%; }';
    expect(await lint(code, rules)).toEqual([]);
  });
});

describe('ui-core/container-breakpoint', () => {
  const rules = { 'ui-core/container-breakpoint': true };

  it('accepts the value of a breakpoint token and rejects any other length', async () => {
    const code = `@container (width < 40rem) { .a { display: none; } }
      @container (width < 30rem) { .b { display: none; } }`;
    expect(containerBreakpoints).toContain('40rem');
    expect(await lint(code, rules)).toEqual([
      `Container query at 30rem: a component changes with its own width at a breakpoint of tokens.json, ${containerBreakpoints.join(', ')} (ui-core/container-breakpoint)`,
    ]);
  });
});

describe('ui-core/breakpoint', () => {
  const rules = { 'ui-core/breakpoint': true };

  it('accepts the breakpoint of the manifest and rejects any other', async () => {
    const code = `@media (width >= ${manifest.breakpoint}) { .a { display: none; } }
      @media (width >= 48rem) { .b { display: none; } }`;
    expect(await lint(code, rules)).toEqual([
      `Media query at 48rem: the layout changes at the breakpoint of tokens.json, ${manifest.breakpoint} (ui-core/breakpoint)`,
    ]);
  });
});
