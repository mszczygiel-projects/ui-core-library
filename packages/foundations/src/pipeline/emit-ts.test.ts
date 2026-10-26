import { describe, expect, it } from 'vitest';

import { buildTsTree, emitTokensTs } from './emit-ts.ts';
import { token } from './tokens.fixture.ts';

const brand500 = token('Primitives Colors', 'brand/primary/500', '#256ce1');
const themeBrand = token('Themes', 'color/brand/primary', {
  Default: '{Primitives Colors.brand.primary.500}',
});
const themeOnSubtle = token('Themes', 'color/on-subtle/brand/primary', {
  Default: '{Primitives Colors.brand.primary.500}',
});
const surfaceBrand = token('Surfaces', 'color/brand/primary', {
  Default: '{Themes.color.brand.primary}',
  Subtle: '{Themes.color.on-subtle.brand.primary}',
});

describe('buildTsTree', () => {
  it('publishes a path from its most specific collection', () => {
    const chip = token('Components', 'color/chip/background', '{Surfaces.color.brand.primary}');
    const themeChip = token('Themes', 'color/chip/background', { Default: '#000' });
    const surfaceChip = token('Surfaces', 'color/chip/background', { Default: '#000' });
    const tree = buildTsTree([brand500, themeBrand, surfaceBrand, themeChip, surfaceChip, chip]);
    expect(tree).toEqual({
      surfaces: { color: { brand: { primary: 'var(--color-brand-primary)' } } },
      components: { color: { chip: { background: 'var(--color-chip-background)' } } },
    });
  });

  it('keeps the theme tokens that no surface re-declares', () => {
    const tree = buildTsTree([brand500, themeBrand, themeOnSubtle, surfaceBrand]);
    expect(tree['themes']).toEqual({
      color: { 'on-subtle': { brand: { primary: 'var(--color-on-subtle-brand-primary)' } } },
    });
  });

  it('leaves the primitives out', () => {
    expect(Object.keys(buildTsTree([brand500, themeOnSubtle, surfaceBrand]))).toEqual([
      'themes',
      'surfaces',
    ]);
  });

  it('publishes the brand values of Themes under the key of Themes', () => {
    const font = token('Themes', 'font/body', { Light: 'Inter' }, 'string');
    expect(buildTsTree([font])).toEqual({ themes: { font: { body: 'var(--font-body)' } } });
  });
});

describe('emitTokensTs', () => {
  it('writes a typed constant with camelCase keys, quoted where they are not identifiers', () => {
    const output = emitTokensTs([
      themeOnSubtle,
      token('Sizes', 'typography/heading/2xl/font-size', { Mobile: 24 }, 'number'),
    ]);
    expect(output).toContain(
      'export const tokens = {\n  themes: {\n    color: {\n      onSubtle: {',
    );
    expect(output).toContain(
      `"2xl": {\n          fontSize: 'var(--typography-heading-2xl-font-size)',`,
    );
    expect(output).toContain('} as const;\n\nexport type Tokens = typeof tokens;\n');
    expect(output).toContain('export type TokenKey = DeepValues<Tokens>;\n');
  });
});
