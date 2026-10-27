import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildTokens, reportLines } from './build.ts';
import type { Token } from './model.ts';
import { parseExports, readExports } from './parse.ts';
import { buildRegistry, resolveNumber } from './resolve.ts';
import { EXPORTS_DIR, token } from './tokens.fixture.ts';
import { parseExceptions } from './validate.ts';

const breakpoint = token('Primitives Sizes', 'breakpoint/lg', 1024, 'number');
const spacing = token('Primitives Sizes', 'spacing/4', 16, 'number');
const pinned = token('Components', 'popover/radius', '{Primitives Sizes.spacing.4}', 'number');

function exported(variable: Token, scopes: string[], web: string): Token {
  return { ...variable, figma: { scopes, codeSyntax: { WEB: web }, hiddenFromPublishing: false } };
}

describe('buildTokens', () => {
  it('builds an exact geometry alias strictly and rejects a stale target even in a fork', () => {
    const line = exported(
      token('Primitives Sizes', 'border-width/2', 2, 'number'),
      ['STROKE_FLOAT'],
      'var(--border-width-2)',
    );
    const loader = exported(
      token('Components', 'loader/stroke/width', '{Primitives Sizes.border-width.2}', 'number'),
      ['STROKE_FLOAT'],
      'var(--loader-stroke-width)',
    );
    const tokens = [exported(breakpoint, [], 'var(--breakpoint-lg)'), line, loader];
    const exceptions = parseExceptions({
      layoutConstants: [],
      knownViolations: [],
      primitiveAliases: [
        {
          token: 'Components/loader/stroke/width',
          target: 'Primitives Sizes/border-width/2',
          reason: 'Independent geometry.',
        },
      ],
    });
    const result = buildTokens(tokens, { strict: true, autoDarkMode: true, exceptions });
    expect(result.errors).toEqual([]);
    expect(result.files?.['tokens.css']).toContain('--loader-stroke-width: var(--border-width-2);');
    for (const strict of [true, false]) {
      const changed = tokens.map((t) => (t === loader ? { ...t, value: 2 } : t));
      expect(buildTokens(changed, { strict, autoDarkMode: true, exceptions }).files).toBeNull();
    }
  });

  it('keeps the spinner independent when the shared accent stroke changes', () => {
    const tokens = parseExports(readExports(EXPORTS_DIR));
    const loader = tokens.find(
      (t) => t.collection === 'Components' && t.path.join('/') === 'loader/stroke/width',
    );
    const consumers = tokens.filter(
      (t) =>
        t.collection === 'Components' && JSON.stringify(t.value).includes('{Themes.stroke.accent}'),
    );
    expect(loader).toBeDefined();
    expect(consumers).toHaveLength(8);
    const changed = tokens.map((t) =>
      t.collection === 'Themes' && t.path.join('/') === 'stroke/accent'
        ? { ...t, value: { Light: 5, Dark: 7 } }
        : t,
    );
    const registry = buildRegistry(changed);
    if (loader === undefined) {
      throw new Error('Missing Loader stroke token');
    }
    expect(resolveNumber(loader, 'Light', registry)).toBe(2);
    expect(resolveNumber(loader, 'Dark', registry)).toBe(2);
    for (const consumer of consumers) {
      expect(resolveNumber(consumer, 'Light', registry), consumer.path.join('/')).toBe(5);
      expect(resolveNumber(consumer, 'Dark', registry), consumer.path.join('/')).toBe(7);
    }
  });
  it('fails in strict mode on a violation that is not listed as known', () => {
    const result = buildTokens([breakpoint, spacing, pinned], { strict: true, autoDarkMode: true });
    expect(result.files).toBeNull();
    expect(result.errors).toEqual([
      'Components/popover/radius aliases Primitives Sizes/spacing/4, but Components may not alias it',
      'The exports carry no Figma metadata: export the variables with it, so that their scopes and code syntax can be checked',
    ]);
  });

  it('checks the Figma metadata of the exports in strict mode', () => {
    const tokens = [
      exported(breakpoint, [], 'var(--breakpoint-lg)'),
      exported(spacing, [], 'var(--spacing-4)'),
    ];
    const result = buildTokens(tokens, { strict: true, autoDarkMode: true });
    expect(result.files).toBeNull();
    expect(result.errors).toEqual([
      'Primitives Sizes/spacing/4 is offered in no field; its scope rule gives it GAP, WIDTH_HEIGHT',
    ]);
  });

  it('builds a fork with the violations as warnings', () => {
    const result = buildTokens([breakpoint, spacing, pinned], {
      strict: false,
      autoDarkMode: true,
    });
    expect(result.files?.['tokens.css']).toContain('--popover-radius: var(--spacing-4);');
    expect(result.warnings).toEqual([
      expect.stringContaining('Components/popover/radius aliases Primitives Sizes/spacing/4'),
      expect.stringContaining('The exports carry no Figma metadata'),
    ]);
  });

  it('stops a fork too when an alias leads nowhere', () => {
    const broken = token('Components', 'popover/gap', '{Sizes.gap}', 'number');
    const result = buildTokens([breakpoint, broken], { strict: false, autoDarkMode: true });
    expect(result.files).toBeNull();
    expect(result.errors).toEqual([
      'Components/popover/gap aliases {Sizes.gap}, which does not exist',
    ]);
  });

  it('stops when two text styles would make one class', () => {
    const size = (path: string) => token('Sizes', path, { Mobile: 16 }, 'number');
    const result = buildTokens(
      [
        breakpoint,
        size('typography/body/small/font-size'),
        size('typography/body-small/font-size'),
      ],
      { strict: false, autoDarkMode: true },
    );
    expect(result.files).toBeNull();
    expect(result.errors).toEqual([
      'Sizes/typography/body/small/font-size and Sizes/typography/body-small/font-size both make the text style class .ui-text-body-small; rename one of them in Figma',
    ]);
  });

  it('needs the breakpoint from which the Desktop sizes apply', () => {
    expect(buildTokens([spacing], { strict: false, autoDarkMode: true }).errors).toEqual([
      'Primitives Sizes/breakpoint/lg must be a number: the Desktop values of Sizes apply from that width',
    ]);
  });

  it('builds the library exports strictly with the committed exceptions', () => {
    const exceptions = parseExceptions(
      JSON.parse(readFileSync(join(EXPORTS_DIR, '..', 'token-exceptions.json'), 'utf8')),
    );
    const result = buildTokens(parseExports(readExports(EXPORTS_DIR)), {
      strict: true,
      autoDarkMode: true,
      exceptions,
    });
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.knownViolations).toBe(exceptions.knownViolations.length);
    expect(result.summary).toEqual([
      '1667 tokens, 955 of them component tokens',
      'theme modes: Light (:root), Dark ([data-theme="dark"])',
    ]);
  });
});

describe('the tokens of the library', () => {
  const result = buildTokens(parseExports(readExports(EXPORTS_DIR)), {
    strict: false,
    autoDarkMode: true,
  });
  const css = result.files?.['tokens.css'] ?? '';

  it('declare every role and component token without a collection prefix', () => {
    expect(css).not.toMatch(/--(color-color|themes|surfaces|sizes|components)-/);
    expect(css).toContain('--color-background-default:');
    expect(css).toContain('--color-button-primary-background-default:');
  });

  it('write every tracking value as em or a bare 0, never a percentage', () => {
    const tracking = [...css.matchAll(/^\s*(--tracking-[a-z0-9-]+):\s*([^;]+);/gm)];
    expect(tracking.length).toBeGreaterThan(0);
    for (const [, name, value] of tracking) {
      expect(value, name).toMatch(/^(0|-?[\d.]+em)$/);
    }
  });

  it('declare the brand values once, on :root, where a client overrides them', () => {
    expect(css.split(/^\s*--font-heading:/m)).toHaveLength(2);
    expect(css).toMatch(/^\s*--font-heading: "Inter";$/m);
    expect(css).toMatch(/^\s*--text-uppercase-button: uppercase;$/m);
    expect(css).toMatch(/^\s*--typography-body-font-family: var\(--font-body\);$/m);
  });

  it('keep the brand ramps among the colour primitives', () => {
    expect(css).toMatch(/^\s*--color-brand-primary-800: #174ba0;$/m);
    expect(css).toMatch(/^\s*--color-brand-primary-default: var\(--color-brand-primary-800\);$/m);
  });

  it('keep the semantic radius family apart from the primitive ramp', () => {
    expect(css).toMatch(/^\s*--radius-sm: 0\.25rem;$/m);
    expect(css).toMatch(/^\s*--shape-radius-sm: var\(--radius-sm\);$/m);
    expect(css).not.toMatch(/--[a-z-]+-radius: var\(--radius-(sm|md|lg|none|pill)\);/);
  });

  it('switch the Desktop sizes on at the large breakpoint, in every density', () => {
    expect(css.split('@media (min-width: 64rem)')).toHaveLength(3);
  });

  it('switch the surfaces to their copies of the roles', () => {
    expect(css).toContain('var(--color-on-subtle-');
    expect(css).toContain('var(--color-on-inverse-');
    expect(css).toContain('var(--color-on-brand-primary-');
  });
});

describe('reportLines', () => {
  it('reports what stopped the build', () => {
    const result = buildTokens([exported(spacing, ['GAP', 'WIDTH_HEIGHT'], 'var(--spacing-4)')], {
      strict: false,
      autoDarkMode: true,
    });
    expect(reportLines(result).err).toEqual([
      '✗ Primitives Sizes/breakpoint/lg must be a number: the Desktop values of Sizes apply from that width',
      '✗ Nothing was written: 1 error(s)',
    ]);
  });
});
