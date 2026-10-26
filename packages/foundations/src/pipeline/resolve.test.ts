import { describe, expect, it } from 'vitest';

import {
  baseModeOf,
  buildRegistry,
  collectModes,
  dependsOnCollection,
  findCycles,
  findFontSizePair,
  isAlias,
  parseAlias,
  rawForMode,
  resolveNumber,
} from './resolve.ts';
import { token } from './tokens.fixture.ts';

describe('isAlias and parseAlias', () => {
  it('recognize an alias by its braces', () => {
    expect(isAlias('{Primitives Colors.gray.500}')).toBe(true);
    expect(isAlias('#ffffff')).toBe(false);
    expect(isAlias(42)).toBe(false);
  });

  it('split an alias into its collection and path', () => {
    expect(parseAlias('{Primitives Colors.brand.primary.500}')).toEqual({
      collection: 'Primitives Colors',
      path: ['brand', 'primary', '500'],
    });
    expect(parseAlias('{Sizes.layout.gap}')).toEqual({
      collection: 'Sizes',
      path: ['layout', 'gap'],
    });
  });

  it('return null for an unknown collection', () => {
    expect(parseAlias('{Unknown.foo.bar}')).toBeNull();
  });
});

describe('modes', () => {
  it('lists every mode in first-seen order', () => {
    const surface = token('Surfaces', 'color/text', { Default: '#fff', Subtle: '#eee' });
    const extra = token('Surfaces', 'color/link', { Default: '#00f', BrandHighlight: '#0ff' });
    expect(collectModes([surface, extra])).toEqual(['Default', 'Subtle', 'BrandHighlight']);
  });

  it('prefer a mode named Default as the base, then the first mode', () => {
    expect(baseModeOf(['Dark', 'Default', 'DarkGreen'])).toBe('Default');
    expect(baseModeOf(['TenantLight', 'TenantDark'])).toBe('TenantLight');
    expect(baseModeOf([])).toBeNull();
  });

  it('fall back to the base value when a token lacks a mode', () => {
    const partial = token('Themes', 'color/text', { Default: '#111', DarkGreen: '#0f0' });
    expect(rawForMode(partial, 'Dark', 'Default')).toBe('#111');
    expect(rawForMode(partial, 'DarkGreen', 'Default')).toBe('#0f0');
  });
});

describe('resolveNumber', () => {
  it('follows aliases into the matching mode, or the first mode of the target', () => {
    const spacing = token('Primitives Sizes', 'spacing/4', 16, 'number');
    const ramp = token(
      'Sizes',
      'layout/gap',
      { Mobile: '{Primitives Sizes.spacing.4}', Desktop: 24 },
      'number',
    );
    const component = token('Components', 'button/gap', '{Sizes.layout.gap}', 'number');
    const registry = buildRegistry([spacing, ramp, component]);
    expect(resolveNumber(ramp, 'Mobile', registry)).toBe(16);
    expect(resolveNumber(ramp, 'Desktop', registry)).toBe(24);
    expect(resolveNumber(component, null, registry)).toBe(16);
  });

  it('gives up on a broken alias or a cycle', () => {
    const broken = token('Sizes', 'gap', { Mobile: '{Sizes.missing}' }, 'number');
    const loop = token('Sizes', 'loop', { Mobile: '{Sizes.loop}' }, 'number');
    const registry = buildRegistry([broken, loop]);
    expect(resolveNumber(broken, 'Mobile', registry)).toBeNull();
    expect(resolveNumber(loop, 'Mobile', registry)).toBeNull();
  });
});

describe('dependsOnCollection', () => {
  it('follows the alias chain through other tokens', () => {
    const size = token('Sizes', 'gap', { Mobile: 8 }, 'number');
    const button = token('Components', 'button/gap', '{Sizes.gap}', 'number');
    const chip = token('Components', 'chip/gap', '{Components.button.gap}', 'number');
    const radius = token('Themes', 'radius/sm', { Light: 4 }, 'number');
    const corner = token('Components', 'chip/radius', '{Themes.radius.sm}', 'number');
    const registry = buildRegistry([size, button, chip, radius, corner]);
    expect(dependsOnCollection(chip, 'Sizes', registry)).toBe(true);
    expect(dependsOnCollection(corner, 'Sizes', registry)).toBe(false);
  });
});

describe('findFontSizePair', () => {
  it('pairs a line height with its font size', () => {
    const size = token('Primitives Sizes', 'text/sm', 14, 'number');
    const lineHeight = token('Primitives Sizes', 'text/sm--line-height', 20, 'number');
    const bodySize = token('Sizes', 'typography/body/font-size', { Mobile: 16 }, 'number');
    const bodyLine = token('Sizes', 'typography/body/line-height', { Mobile: 24 }, 'number');
    const registry = buildRegistry([size, lineHeight, bodySize, bodyLine]);
    expect(findFontSizePair(lineHeight, registry)).toBe(size);
    expect(findFontSizePair(bodyLine, registry)).toBe(bodySize);
    expect(findFontSizePair(size, registry)).toBeNull();
  });
});

describe('findCycles', () => {
  it('reports a token that aliases itself', () => {
    const loop = token('Themes', 'color/loop', '{Themes.color.loop}');
    expect(findCycles([loop], buildRegistry([loop]))).toEqual([
      'Themes/color/loop → Themes/color/loop',
    ]);
  });

  it('reports an indirect cycle once', () => {
    const a = token('Themes', 'color/a', '{Themes.color.b}');
    const b = token('Themes', 'color/b', '{Themes.color.a}');
    expect(findCycles([a, b], buildRegistry([a, b]))).toEqual([
      'Themes/color/a → Themes/color/b → Themes/color/a',
    ]);
  });

  it('accepts an acyclic chain', () => {
    const gray = token('Primitives Colors', 'gray/500', '#aaa');
    const text = token('Themes', 'color/text', { Default: '{Primitives Colors.gray.500}' });
    expect(findCycles([gray, text], buildRegistry([gray, text]))).toEqual([]);
  });
});
