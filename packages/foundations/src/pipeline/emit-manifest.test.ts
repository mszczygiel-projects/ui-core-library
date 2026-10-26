import { describe, expect, it } from 'vitest';

import { buildTokens } from './build.ts';
import { buildManifest, type TokenManifest } from './emit-manifest.ts';
import { textStyles } from './emit-typography.ts';
import type { Token } from './model.ts';
import { parseExports, readExports } from './parse.ts';
import { buildRegistry } from './resolve.ts';
import { EXPORTS_DIR, token } from './tokens.fixture.ts';

function manifestOf(tokens: readonly Token[]): TokenManifest {
  return buildManifest(tokens, buildRegistry(tokens), textStyles(tokens), { breakpointPx: 1280 });
}

function entry(manifest: TokenManifest, name: string) {
  const found = manifest.tokens.find((candidate) => candidate.name === name);
  if (found === undefined) {
    throw new Error(`${name} is not in the manifest`);
  }
  return found;
}

const gray900 = token('Primitives Colors', 'gray/900', '#151419');
const gray100 = token('Primitives Colors', 'gray/100', '#f4f4f5');
const textPrimary: Token = {
  ...token('Themes', 'color/text/primary', {
    Light: '{Primitives Colors.gray.900}',
    Dark: '{Primitives Colors.gray.100}',
  }),
  description: 'Main text.',
};
const onInverse: Token = {
  ...token('Themes', 'color/on-inverse/text/primary', {
    Light: '{Primitives Colors.gray.100}',
    Dark: '{Primitives Colors.gray.900}',
  }),
  figma: { scopes: [], codeSyntax: {}, hiddenFromPublishing: true },
};
const surfaceText = token('Surfaces', 'color/text/primary', {
  Default: '{Themes.color.text.primary}',
  Inverse: '{Themes.color.on-inverse.text.primary}',
});

describe('buildManifest', () => {
  it('lists a primitive as a constant without an alias', () => {
    expect(entry(manifestOf([gray900]), '--color-gray-900')).toEqual({
      name: '--color-gray-900',
      collection: 'Primitives Colors',
      path: 'gray/900',
      kind: 'color',
      axes: [],
      values: [{ context: {}, value: '#151419', raw: '#151419' }],
    });
  });

  it('describes line-height ratios against their own font size across modes', () => {
    const tokens = [
      token('Primitives Sizes', 'text/base', 16, 'number'),
      token('Primitives Sizes', 'text/base-line-height', 24, 'number'),
      token('Sizes', 'body/small/font-size', { Mobile: 14, Desktop: 12 }, 'number'),
      token('Components', 'control/small/font-size', '{Sizes.body.small.font-size}', 'number'),
      token(
        'Components',
        'control/small/line-height',
        '{Primitives Sizes.text.base-line-height}',
        'number',
      ),
    ];
    const line = entry(manifestOf(tokens), '--control-small-line-height');
    expect(line.axes).toEqual(['size']);
    expect(line.values).toEqual([
      {
        context: { size: 'mobile' },
        value: 'calc(1.5 / 0.875)',
        raw: 24,
        alias: '--text-base--line-height',
      },
      {
        context: { size: 'desktop' },
        value: 'calc(1.5 / 0.75)',
        raw: 24,
        alias: '--text-base--line-height',
      },
    ]);
  });

  it('gives a role one value per theme, with the variable it points at', () => {
    const role = entry(manifestOf([gray900, gray100, textPrimary]), '--color-text-primary');
    expect(role.axes).toEqual(['theme']);
    expect(role.values).toEqual([
      { context: { theme: 'light' }, value: '#151419', raw: '#151419', alias: '--color-gray-900' },
      { context: { theme: 'dark' }, value: '#f4f4f5', raw: '#f4f4f5', alias: '--color-gray-100' },
    ]);
  });

  it('describes a shared name by the surface role that declares it last', () => {
    const manifest = manifestOf([gray900, gray100, textPrimary, onInverse, surfaceText]);
    const role = entry(manifest, '--color-text-primary');
    expect(role.collection).toBe('Surfaces');
    expect(role.description).toBe('Main text.');
    expect(role.axes).toEqual(['theme', 'surface']);
    expect(role.values.map(({ context, value, alias }) => ({ context, value, alias }))).toEqual([
      {
        context: { theme: 'light', surface: 'default' },
        value: '#151419',
        alias: '--color-gray-900',
      },
      {
        context: { theme: 'light', surface: 'inverse' },
        value: '#f4f4f5',
        alias: '--color-on-inverse-text-primary',
      },
      {
        context: { theme: 'dark', surface: 'default' },
        value: '#f4f4f5',
        alias: '--color-gray-100',
      },
      {
        context: { theme: 'dark', surface: 'inverse' },
        value: '#151419',
        alias: '--color-on-inverse-text-primary',
      },
    ]);
    expect(manifest.tokens.filter((t) => t.name === '--color-text-primary')).toHaveLength(1);
  });

  it('marks what Figma hides from publishing', () => {
    expect(
      entry(manifestOf([gray900, gray100, onInverse]), '--color-on-inverse-text-primary'),
    ).toMatchObject({ hidden: true });
  });

  it('leaves out an axis along which nothing changes', () => {
    const base = token('Primitives Sizes', 'text/base', 16, 'number');
    const body = token(
      'Sizes',
      'typography/body/font-size',
      { Mobile: '{Primitives Sizes.text.base}', Desktop: '{Primitives Sizes.text.base}' },
      'number',
    );
    expect(entry(manifestOf([base, body]), '--typography-body-font-size')).toMatchObject({
      axes: [],
      values: [{ context: {}, value: '1rem', raw: 16, alias: '--text-base' }],
    });
  });

  it('follows the chain into the collections it reaches, as the cascade does', () => {
    const tokens = [
      token('Primitives Sizes', 'spacing/3', 12, 'number'),
      token('Primitives Sizes', 'spacing/4', 16, 'number'),
      token('Primitives Sizes', 'spacing/8', 32, 'number'),
      token(
        'Sizes',
        'padding/inline',
        {
          Mobile: '{Primitives Sizes.spacing.4}',
          Desktop: '{Primitives Sizes.spacing.8}',
          'Mobile Compact': '{Primitives Sizes.spacing.3}',
          'Desktop Compact': '{Primitives Sizes.spacing.3}',
        },
        'number',
      ),
      token('Components', 'button/padding', '{Sizes.padding.inline}', 'number'),
    ];
    expect(entry(manifestOf(tokens), '--button-padding')).toMatchObject({
      axes: ['density', 'size'],
      values: [
        { context: { density: 'comfortable', size: 'mobile' }, value: '1rem' },
        { context: { density: 'comfortable', size: 'desktop' }, value: '2rem' },
        { context: { density: 'compact', size: 'mobile' }, value: '0.75rem' },
        { context: { density: 'compact', size: 'desktop' }, value: '0.75rem' },
      ],
    });
  });

  it('writes the modes as attribute values, the base mode first, and the breakpoint', () => {
    const manifest = manifestOf([gray900, gray100, textPrimary, onInverse, surfaceText]);
    expect(manifest.modes).toEqual({
      brand: [],
      theme: ['light', 'dark'],
      surface: ['default', 'inverse'],
      density: [],
      size: [],
    });
    expect(manifest.breakpoint).toBe('80rem');
  });

  it('describes the composite shadows with the values they combine', () => {
    const shape = token('Primitives Shadows', 'shadow-shape/sm', '0 1px 2px -1px', 'string');
    const color = token('Primitives Shadows', 'shadow-color/default', 'rgba(0, 0, 0, 0.1)');
    expect(manifestOf([shape, color]).shadows).toContainEqual({
      name: '--shadow-sm',
      shape: '--shadow-shape-sm',
      color: '--shadow-color-default',
      value: '0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    });
  });
});

describe('the manifest of the library', () => {
  const tokens = parseExports(readExports(EXPORTS_DIR));
  const result = buildTokens(tokens, { strict: false, autoDarkMode: true });
  const css = result.files?.['tokens.css'] ?? '';
  const manifest = JSON.parse(result.files?.['tokens.json'] ?? '{}') as TokenManifest;

  it('lists every custom property of tokens.css once, the composite shadows apart', () => {
    const declared = new Set([...css.matchAll(/^\s*(--[A-Za-z0-9-]+):/gm)].map((m) => m[1]));
    const listed = [...manifest.tokens.map((t) => t.name), ...manifest.shadows.map((s) => s.name)];
    expect(new Set(listed).size).toBe(listed.length);
    expect(new Set(listed)).toEqual(declared);
  });

  it('names the modes of every context attribute', () => {
    expect(manifest.modes).toEqual({
      brand: [],
      theme: ['light', 'dark'],
      surface: ['default', 'subtle', 'inverse', 'primary'],
      density: ['comfortable', 'compact'],
      size: ['mobile', 'desktop'],
    });
    for (const t of manifest.tokens) {
      for (const value of t.values) {
        expect(Object.keys(value.context), t.name).toEqual(t.axes);
      }
    }
  });

  it('carries the descriptions of the roles and of the brand values', () => {
    const undescribed = manifest.tokens.filter(
      (t) =>
        ['Themes', 'Surfaces', 'Sizes'].includes(t.collection) &&
        t.hidden !== true &&
        t.description === undefined,
    );
    expect(undescribed.map((t) => t.name)).toEqual([]);
  });

  it('lists the fifteen text styles', () => {
    expect(manifest.textStyles).toHaveLength(15);
  });
});
