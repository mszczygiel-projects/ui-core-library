import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  cssVarName,
  formatNumber,
  formatString,
  formatBoolean,
  formatLineHeight,
  valueToCss,
  resolveCssLine,
  detectCycles,
  buildTokensCss,
  buildTailwindCss,
  buildTsTree,
  buildTokensTs,
  isAlias,
  parseAlias,
  normalizeSegment,
  normalizedPath,
  tokenKey,
  walk,
  isLeaf,
  toCamel,
  tsKey,
  ALLOWED_DEPS,
  type Token,
  type Collection,
  type WarningBucket,
} from '../scripts/tokens-transformer.ts';

// ─── Test helpers ────────────────────────────────────────────────────────

function makeRegistry(tokens: Token[]): Map<string, Token> {
  const r = new Map<string, Token>();
  for (const t of tokens) r.set(tokenKey(t.collection, normalizedPath(t.path)), t);
  return r;
}

function freshWarnings(): WarningBucket {
  return { circular: [], violations: [], broken: [] };
}

function prim(
  ...pathAndValue: [...string[], string]
): Token {
  const value = pathAndValue[pathAndValue.length - 1] as string;
  const path = pathAndValue.slice(0, -1) as string[];
  return { collection: 'Primitives Colors', path, type: 'color', value };
}

function themeColor(path: string[], defaultVal: string, darkVal?: string): Token {
  return {
    collection: 'Themes',
    path,
    type: 'color',
    value: darkVal !== undefined ? { Default: defaultVal, Dark: darkVal } : { Default: defaultVal },
  };
}

function surfaceColor(path: string[], modes: Record<string, string>): Token {
  return { collection: 'Surfaces', path, type: 'color', value: modes };
}

// ─── 1. cssVarName — naming convention ───────────────────────────────────

describe('cssVarName', () => {
  describe('Primitives Colors → --color-{palette}-{shade}', () => {
    it('basic palette + shade', () => {
      expect(cssVarName('Primitives Colors', ['gray', '500'])).toBe('--color-gray-500');
      expect(cssVarName('Primitives Colors', ['brand', 'primary', '500'])).toBe('--color-brand-primary-500');
    });

    it('alpha-scale palette', () => {
      expect(cssVarName('Primitives Colors', ['black', '300'])).toBe('--color-black-300');
    });
  });

  describe('Primitives Sizes → unprefixed', () => {
    it('spacing', () => expect(cssVarName('Primitives Sizes', ['spacing', '4'])).toBe('--spacing-4'));
    it('radius', () => expect(cssVarName('Primitives Sizes', ['radius', 'md'])).toBe('--radius-md'));
    it('font-weight', () => expect(cssVarName('Primitives Sizes', ['font-weight', 'normal'])).toBe('--font-weight-normal'));
    it('tracking', () => expect(cssVarName('Primitives Sizes', ['tracking', 'wide'])).toBe('--tracking-wide'));

    it('text size → --text-{name}', () => {
      expect(cssVarName('Primitives Sizes', ['text', 'sm'])).toBe('--text-sm');
      expect(cssVarName('Primitives Sizes', ['text', 'xl'])).toBe('--text-xl');
    });

    it('line-height uses Tailwind v4 -- convention', () => {
      // The double-dash separates font-size name from the line-height modifier
      expect(cssVarName('Primitives Sizes', ['text', 'sm--line-height'])).toBe('--text-sm--line-height');
    });
  });

  describe('Primitives Motions', () => {
    it('easing drops the "easing" segment', () => {
      expect(cssVarName('Primitives Motions', ['easing', 'ease-in'])).toBe('--ease-in');
      expect(cssVarName('Primitives Motions', ['easing', 'ease-out'])).toBe('--ease-out');
    });

    it('duration keeps all segments', () => {
      expect(cssVarName('Primitives Motions', ['duration', 'fast'])).toBe('--duration-fast');
    });
  });

  describe('Primitives Shadows → --{path}', () => {
    it('shape', () => expect(cssVarName('Primitives Shadows', ['shadow-shape', 'sm'])).toBe('--shadow-shape-sm'));
    it('color', () => expect(cssVarName('Primitives Shadows', ['shadow-color', 'default'])).toBe('--shadow-color-default'));
  });

  describe('Themes — no collection prefix', () => {
    it('color path', () => {
      expect(cssVarName('Themes', ['color', 'brand', 'primary'])).toBe('--color-brand-primary');
      expect(cssVarName('Themes', ['color', 'button', 'primary', 'background', 'default'])).toBe('--color-button-primary-background-default');
    });

    it('non-color path', () => {
      expect(cssVarName('Themes', ['ring', 'style'])).toBe('--ring-style');
      expect(cssVarName('Themes', ['typography', 'body', 'font-family'])).toBe('--typography-body-font-family');
    });
  });

  describe('Surfaces — no collection prefix, same names as Themes', () => {
    it('color path matches equivalent Themes path', () => {
      // Surfaces and Themes share the same CSS var name for the same path
      expect(cssVarName('Surfaces', ['color', 'brand', 'primary'])).toBe('--color-brand-primary');
      expect(cssVarName('Themes', ['color', 'brand', 'primary'])).toBe('--color-brand-primary');
    });
  });

  describe('Sizes — no collection prefix', () => {
    it('typography path', () => {
      expect(cssVarName('Sizes', ['typography', 'body', 'font-size'])).toBe('--typography-body-font-size');
      expect(cssVarName('Sizes', ['typography', 'heading', 'display', 'font-weight'])).toBe('--typography-heading-display-font-weight');
    });
  });
});

// ─── 2. Number formatting ─────────────────────────────────────────────────

describe('formatNumber — px → CSS unit', () => {
  it('converts px to rem (base 16)', () => {
    expect(formatNumber(['spacing', '4'], 16)).toBe('1rem');
    expect(formatNumber(['spacing', '2'], 4)).toBe('0.25rem');
    expect(formatNumber(['radius', 'md'], 8)).toBe('0.5rem');
    expect(formatNumber(['size', 'icon'], 24)).toBe('1.5rem');
  });

  it('returns bare 0 for zero, regardless of path', () => {
    expect(formatNumber(['spacing', '0'], 0)).toBe('0');
    expect(formatNumber(['font-weight', 'zero'], 0)).toBe('0');
  });

  it('font-weight → unitless number', () => {
    expect(formatNumber(['font-weight', 'normal'], 400)).toBe('400');
    expect(formatNumber(['font-weight', 'bold'], 700)).toBe('700');
    // Also matches path containing "font-weight"
    expect(formatNumber(['typography', 'body', 'font-weight'], 400)).toBe('400');
  });

  it('tracking / letter-spacing → em', () => {
    expect(formatNumber(['tracking', 'tight'], -0.025)).toBe('-0.025em');
    expect(formatNumber(['letter-spacing', 'wide'], 0.05)).toBe('0.05em');
  });

  it('duration → ms', () => {
    expect(formatNumber(['duration', 'fast'], 150)).toBe('150ms');
    expect(formatNumber(['duration', 'slow'], 300)).toBe('300ms');
  });
});

// ─── 3. String & Boolean formatting ──────────────────────────────────────

describe('formatString', () => {
  it('font-family path → quoted', () => {
    expect(formatString(['font-family'], 'Roboto')).toBe('"Roboto"');
    expect(formatString(['typography', 'body', 'font-family'], 'Inter')).toBe('"Inter"');
  });

  it('non-font-family path → unquoted', () => {
    expect(formatString(['ring', 'style'], 'solid')).toBe('solid');
    expect(formatString(['button', 'variant'], 'primary')).toBe('primary');
  });
});

describe('formatBoolean', () => {
  it('text-transform true → uppercase', () => {
    expect(formatBoolean(['button', 'text-transform', 'uppercase'], true)).toBe('uppercase');
  });

  it('text-transform false → none', () => {
    expect(formatBoolean(['button', 'text-transform', 'uppercase'], false)).toBe('none');
  });

  it('other paths → string "true"/"false"', () => {
    expect(formatBoolean(['some', 'flag'], true)).toBe('true');
    expect(formatBoolean(['some', 'flag'], false)).toBe('false');
  });
});

// ─── 4. Alias parsing ────────────────────────────────────────────────────

describe('isAlias / parseAlias', () => {
  it('recognises {…} as an alias', () => {
    expect(isAlias('{Primitives Colors.gray.500}')).toBe(true);
    expect(isAlias('#ffffff')).toBe(false);
    expect(isAlias(42)).toBe(false);
  });

  it('parses collection and path from alias', () => {
    const result = parseAlias('{Primitives Colors.brand.primary.500}');
    expect(result?.collection).toBe('Primitives Colors');
    expect(result?.path).toEqual(['brand', 'primary', '500']);
  });

  it('returns null for unrecognised collection', () => {
    expect(parseAlias('{Unknown.foo.bar}')).toBeNull();
  });
});

// ─── 5. Alias resolution & violations (valueToCss) ───────────────────────

describe('valueToCss — alias resolution', () => {
  it('resolves Primitives Colors alias → var(--color-{path})', () => {
    const tokens = [prim('brand', 'primary', '500', '#256ce1')];
    const reg = makeRegistry(tokens);
    const w = freshWarnings();
    const t = themeColor(['color', 'brand', 'primary'], '{Primitives Colors.brand.primary.500}');
    const result = valueToCss(t, '{Primitives Colors.brand.primary.500}', null, reg, w);
    expect(result).toBe('var(--color-brand-primary-500)');
    expect(w.broken).toHaveLength(0);
    expect(w.violations).toHaveLength(0);
  });

  it('Themes alias from Surfaces → var(--color-{path}) — no themes- prefix', () => {
    const themeToken = themeColor(['color', 'brand', 'primary'], '#256ce1');
    const reg = makeRegistry([themeToken]);
    const w = freshWarnings();
    const surfToken = surfaceColor(['color', 'brand', 'primary'], {
      Default: '{Themes.color.brand.primary}',
    });
    const result = valueToCss(surfToken, '{Themes.color.brand.primary}', 'Default', reg, w);
    expect(result).toBe('var(--color-brand-primary)');
    expect(result).not.toContain('--themes-');
  });

  it('flags broken ref when alias target does not exist', () => {
    const reg = makeRegistry([]);
    const w = freshWarnings();
    const t = themeColor(['color', 'brand', 'primary'], '{Primitives Colors.nonexistent.999}');
    valueToCss(t, '{Primitives Colors.nonexistent.999}', null, reg, w);
    expect(w.broken).toHaveLength(1);
    expect(w.broken[0]).toContain('target not found');
  });

  it('flags violation when Themes references Surfaces', () => {
    const surfToken = surfaceColor(['color', 'brand', 'primary'], { Default: '#aaa' });
    const reg = makeRegistry([surfToken]);
    const w = freshWarnings();
    const t: Token = {
      collection: 'Themes',
      path: ['color', 'bad'],
      type: 'color',
      value: '{Surfaces.color.brand.primary}',
    };
    valueToCss(t, '{Surfaces.color.brand.primary}', null, reg, w);
    expect(w.violations).toHaveLength(1);
    expect(w.violations[0]).toContain('should not reference');
  });

  it('flags violation when Primitives references anything', () => {
    const target = themeColor(['color', 'brand', 'primary'], '#abc');
    const reg = makeRegistry([target]);
    const w = freshWarnings();
    const t: Token = {
      collection: 'Primitives Colors',
      path: ['brand', 'primary', '500'],
      type: 'color',
      value: '{Themes.color.brand.primary}',
    };
    valueToCss(t, '{Themes.color.brand.primary}', null, reg, w);
    expect(w.violations).toHaveLength(1);
  });

  it('emits raw color value directly', () => {
    const t = themeColor(['color', 'brand', 'primary'], '#256ce1');
    expect(valueToCss(t, '#256ce1', null, makeRegistry([]), freshWarnings())).toBe('#256ce1');
  });
});

// ─── 6. Line-height formatting ────────────────────────────────────────────

describe('formatLineHeight', () => {
  it('calculates unitless ratio relative to paired font-size', () => {
    const fsToken: Token = {
      collection: 'Primitives Sizes',
      path: ['text', 'sm'],
      type: 'number',
      value: 14,
    };
    const lhToken: Token = {
      collection: 'Primitives Sizes',
      path: ['text', 'sm--line-height'],
      type: 'number',
      value: 20,
    };
    const reg = makeRegistry([fsToken, lhToken]);
    const w = freshWarnings();
    const result = formatLineHeight(lhToken, null, reg, w);
    // 20/16 / (14/16) = 1.25 / 0.875 = calc(1.25 / 0.875)
    expect(result).toBe('calc(1.25 / 0.875)');
  });

  it('returns 0 when line-height value is 0', () => {
    const lhToken: Token = {
      collection: 'Primitives Sizes',
      path: ['text', 'xs--line-height'],
      type: 'number',
      value: 0,
    };
    expect(formatLineHeight(lhToken, null, makeRegistry([lhToken]), freshWarnings())).toBe('0');
  });
});

// ─── 7. Self-ref detection (resolveCssLine) ───────────────────────────────

describe('resolveCssLine — circular var detection', () => {
  it('returns null when resolved value equals var(own-name) — Surfaces Default case', () => {
    // Surfaces color.brand.primary → {Themes.color.brand.primary}
    // Both generate --color-brand-primary after prefix removal → self-ref
    const themeToken = themeColor(['color', 'brand', 'primary'], '#256ce1');
    const reg = makeRegistry([themeToken]);
    const w = freshWarnings();
    const surfToken = surfaceColor(['color', 'brand', 'primary'], {
      Default: '{Themes.color.brand.primary}',
    });
    const result = resolveCssLine(surfToken, '{Themes.color.brand.primary}', 'Default', reg, w);
    expect(result).toBeNull();
  });

  it('returns a CSS declaration for non-circular Surfaces Subtle case', () => {
    // Surfaces Subtle: color.brand.primary → {Themes.color.on-subtle.brand.primary}
    // var name: --color-brand-primary; value: var(--color-on-subtle-brand-primary) → different
    const onSubtle = themeColor(['color', 'on-subtle', 'brand', 'primary'], '#1e5ac8');
    const reg = makeRegistry([onSubtle]);
    const w = freshWarnings();
    const surfToken = surfaceColor(['color', 'brand', 'primary'], {
      Subtle: '{Themes.color.on-subtle.brand.primary}',
    });
    const result = resolveCssLine(surfToken, '{Themes.color.on-subtle.brand.primary}', 'Subtle', reg, w);
    expect(result).toBe('  --color-brand-primary: var(--color-on-subtle-brand-primary);');
  });

  it('returns a CSS declaration for Themes tokens that reference primitives (not self-ref)', () => {
    const primToken = prim('brand', 'primary', '500', '#256ce1');
    const reg = makeRegistry([primToken]);
    const w = freshWarnings();
    const themeToken = themeColor(['color', 'brand', 'primary'], '{Primitives Colors.brand.primary.500}');
    const result = resolveCssLine(
      themeToken,
      '{Primitives Colors.brand.primary.500}',
      'Default',
      reg,
      w,
    );
    expect(result).toBe('  --color-brand-primary: var(--color-brand-primary-500);');
  });
});

// ─── 8. Cycle detection ───────────────────────────────────────────────────

describe('detectCycles', () => {
  it('detects a direct self-referential token (A → A)', () => {
    const t: Token = {
      collection: 'Themes',
      path: ['color', 'loop'],
      type: 'color',
      value: '{Themes.color.loop}',
    };
    const reg = makeRegistry([t]);
    const w = freshWarnings();
    detectCycles([t], reg, w);
    expect(w.circular).toHaveLength(1);
    expect(w.circular[0]).toContain('→');
  });

  it('detects an indirect cycle (A → B → A)', () => {
    const a: Token = {
      collection: 'Themes',
      path: ['color', 'a'],
      type: 'color',
      value: '{Themes.color.b}',
    };
    const b: Token = {
      collection: 'Themes',
      path: ['color', 'b'],
      type: 'color',
      value: '{Themes.color.a}',
    };
    const tokens = [a, b];
    const reg = makeRegistry(tokens);
    const w = freshWarnings();
    detectCycles(tokens, reg, w);
    expect(w.circular).toHaveLength(1);
  });

  it('does not warn for a valid acyclic alias chain', () => {
    const prim = { collection: 'Primitives Colors' as Collection, path: ['gray', '500'], type: 'color' as const, value: '#aaa' };
    const theme = themeColor(['color', 'text', 'primary'], '{Primitives Colors.gray.500}');
    const tokens = [prim, theme];
    const reg = makeRegistry(tokens);
    const w = freshWarnings();
    detectCycles(tokens, reg, w);
    expect(w.circular).toHaveLength(0);
  });
});

// ─── 9. Dark mode block ───────────────────────────────────────────────────

describe('buildTokensCss — dark mode block', () => {
  function buildWithThemes(themesData: Token[], extraTokens: Token[] = []): string {
    const prim500: Token = prim('brand', 'primary', '500', '#256ce1');
    const prim600: Token = prim('brand', 'primary', '600', '#1e5ac8');
    const tokens = [prim500, prim600, ...themesData, ...extraTokens];
    const reg = makeRegistry(tokens);
    return buildTokensCss(tokens, reg, freshWarnings());
  }

  it('emits [data-theme="dark"] block when at least one token has Dark ≠ Default', () => {
    const differs = themeColor(
      ['color', 'brand', 'primary'],
      '{Primitives Colors.brand.primary.500}',
      '{Primitives Colors.brand.primary.600}',
    );
    expect(buildWithThemes([differs])).toContain('[data-theme="dark"]');
  });

  it('omits [data-theme="dark"] block when all tokens have Dark = Default', () => {
    const same = themeColor(
      ['color', 'brand', 'primary'],
      '{Primitives Colors.brand.primary.500}',
      '{Primitives Colors.brand.primary.500}',
    );
    expect(buildWithThemes([same])).not.toContain('[data-theme="dark"]');
  });

  it('dark block contains only the token whose Dark value differs', () => {
    const differs = themeColor(
      ['color', 'brand', 'primary'],
      '{Primitives Colors.brand.primary.500}',
      '{Primitives Colors.brand.primary.600}',
    );
    const same = themeColor(
      ['color', 'text', 'primary'],
      '{Primitives Colors.brand.primary.500}',
      '{Primitives Colors.brand.primary.500}',
    );
    const css = buildWithThemes([differs, same]);
    const darkStart = css.indexOf('[data-theme="dark"]');
    const darkEnd = css.indexOf('}', darkStart);
    const darkBlock = css.slice(darkStart, darkEnd + 1);

    expect(darkBlock).toContain('--color-brand-primary');
    expect(darkBlock).not.toContain('--color-text-primary');
  });

  it('dark block uses unprefixed CSS var names', () => {
    const differs = themeColor(
      ['color', 'brand', 'primary'],
      '{Primitives Colors.brand.primary.500}',
      '{Primitives Colors.brand.primary.600}',
    );
    const css = buildWithThemes([differs]);
    expect(css).not.toContain('--themes-');
    expect(css).toContain('--color-brand-primary: var(--color-brand-primary-600)');
  });
});

// ─── 10. Surfaces block structure ─────────────────────────────────────────

describe('buildTokensCss — Surfaces block structure', () => {
  function buildWithSurfaces(): string {
    const prim500: Token = prim('brand', 'primary', '500', '#256ce1');
    const theme = themeColor(['color', 'brand', 'primary'], '{Primitives Colors.brand.primary.500}');
    const onSubtle = themeColor(['color', 'on-subtle', 'brand', 'primary'], '{Primitives Colors.brand.primary.500}');
    const surface = surfaceColor(['color', 'brand', 'primary'], {
      Default: '{Themes.color.brand.primary}',
      Subtle: '{Themes.color.on-subtle.brand.primary}',
    });
    const tokens = [prim500, theme, onSubtle, surface];
    const reg = makeRegistry(tokens);
    return buildTokensCss(tokens, reg, freshWarnings());
  }

  it('omits Surfaces Default block — it would be self-referential', () => {
    expect(buildWithSurfaces()).not.toContain('/* === Surfaces (Default) ===');
  });

  it('emits Surfaces Subtle block with correct on-subtle reference', () => {
    const css = buildWithSurfaces();
    expect(css).toContain('[data-surface="subtle"]');
    expect(css).toContain('--color-brand-primary: var(--color-on-subtle-brand-primary)');
  });

  it('Surfaces subtle block has no --surfaces- prefix', () => {
    expect(buildWithSurfaces()).not.toContain('--surfaces-');
  });
});

// ─── 11. Surfaces precedence in tokens.ts (buildTsTree) ──────────────────

describe('buildTsTree — Surfaces precedence', () => {
  const prim500 = prim('brand', 'primary', '500', '#256ce1');
  const themeBrand = themeColor(['color', 'brand', 'primary'], '{Primitives Colors.brand.primary.500}');
  const themeOnSubtle = themeColor(['color', 'on-subtle', 'brand', 'primary'], '{Primitives Colors.brand.primary.500}');
  const surfBrand = surfaceColor(['color', 'brand', 'primary'], {
    Default: '{Themes.color.brand.primary}',
    Subtle: '{Themes.color.on-subtle.brand.primary}',
  });

  it('excludes Themes tokens that have a Surfaces counterpart', () => {
    const tree = buildTsTree([prim500, themeBrand, surfBrand]);
    const themes = tree['themes'] as Record<string, unknown> | undefined;
    // themes.color.brand should not exist (Surfaces has the same path)
    const color = themes?.['color'] as Record<string, unknown> | undefined;
    expect(color?.['brand']).toBeUndefined();
  });

  it('includes Themes tokens that have no Surfaces counterpart (on-subtle group)', () => {
    const tree = buildTsTree([prim500, themeBrand, themeOnSubtle, surfBrand]);
    const themes = tree['themes'] as Record<string, unknown> | undefined;
    const color = themes?.['color'] as Record<string, unknown> | undefined;
    expect(color?.['on-subtle']).toBeDefined();
  });

  it('always includes Surfaces tokens with unprefixed var references', () => {
    const tree = buildTsTree([prim500, themeBrand, surfBrand]);
    const surfaces = tree['surfaces'] as Record<string, unknown> | undefined;
    const color = surfaces?.['color'] as Record<string, unknown> | undefined;
    const brand = color?.['brand'] as Record<string, unknown> | undefined;
    expect(brand?.['primary']).toBe('var(--color-brand-primary)');
  });

  it('Primitives are excluded from the TS tree', () => {
    const tree = buildTsTree([prim500, themeBrand, surfBrand]);
    expect(tree['primitives colors']).toBeUndefined();
    expect(tree['primitives sizes']).toBeUndefined();
  });
});

// ─── 12. walk / isLeaf helpers ────────────────────────────────────────────

describe('walk', () => {
  it('collects all leaf tokens from a nested object', () => {
    const json = {
      brand: {
        primary: { $value: '#256ce1', $type: 'color' },
        secondary: { $value: '#1e5ac8', $type: 'color' },
      },
    };
    const out: Token[] = [];
    walk(json, 'Primitives Colors', [], out);
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ collection: 'Primitives Colors', path: ['brand', 'primary'], value: '#256ce1' });
    expect(out[1]).toMatchObject({ collection: 'Primitives Colors', path: ['brand', 'secondary'], value: '#1e5ac8' });
  });

  it('handles multi-mode leaf values', () => {
    const json = {
      color: {
        brand: {
          primary: { $value: { Default: '#256ce1', Dark: '#1e5ac8' }, $type: 'color' },
        },
      },
    };
    const out: Token[] = [];
    walk(json, 'Themes', [], out);
    expect(out).toHaveLength(1);
    expect(out[0]?.value).toEqual({ Default: '#256ce1', Dark: '#1e5ac8' });
  });
});

describe('isLeaf', () => {
  it('returns true for a W3C token node', () => {
    expect(isLeaf({ $value: '#fff', $type: 'color' })).toBe(true);
  });

  it('returns false for a non-leaf node', () => {
    expect(isLeaf({ brand: { primary: { $value: '#fff', $type: 'color' } } })).toBe(false);
    expect(isLeaf(null)).toBe(false);
    expect(isLeaf('string')).toBe(false);
  });
});

// ─── 13. normalizeSegment / toCamel / tsKey ───────────────────────────────

describe('normalizeSegment', () => {
  it('collapses double-dash (Tailwind modifier) to single dash', () => {
    expect(normalizeSegment('sm--line-height')).toBe('sm-line-height');
    expect(normalizeSegment('base')).toBe('base');
  });
});

describe('toCamel / tsKey', () => {
  it('converts kebab to camelCase', () => {
    expect(toCamel('brand-primary')).toBe('brandPrimary');
    expect(toCamel('on-subtle')).toBe('onSubtle');
    expect(toCamel('font-size')).toBe('fontSize');
  });

  it('tsKey quotes keys that are not valid JS identifiers', () => {
    expect(tsKey('on-subtle')).toBe('onSubtle'); // valid after camel
    expect(tsKey('2xl')).toBe('"2xl"'); // starts with digit
  });
});

// ─── 14. ALLOWED_DEPS — architectural direction ───────────────────────────

describe('ALLOWED_DEPS', () => {
  it('Themes may reference Primitives and other Themes', () => {
    expect(ALLOWED_DEPS['Themes'].has('Primitives Colors')).toBe(true);
    expect(ALLOWED_DEPS['Themes'].has('Themes')).toBe(true);
  });

  it('Themes must not reference Surfaces or Sizes', () => {
    expect(ALLOWED_DEPS['Themes'].has('Surfaces')).toBe(false);
    expect(ALLOWED_DEPS['Themes'].has('Sizes')).toBe(false);
  });

  it('Surfaces may reference Themes and Primitives', () => {
    expect(ALLOWED_DEPS['Surfaces'].has('Themes')).toBe(true);
    expect(ALLOWED_DEPS['Surfaces'].has('Primitives Colors')).toBe(true);
  });

  it('Surfaces must not reference Sizes', () => {
    expect(ALLOWED_DEPS['Surfaces'].has('Sizes')).toBe(false);
  });

  it('Primitives may not reference anything', () => {
    expect(ALLOWED_DEPS['Primitives Colors'].size).toBe(0);
    expect(ALLOWED_DEPS['Primitives Sizes'].size).toBe(0);
  });

  it('Sizes may reference Themes (for font-family etc.)', () => {
    expect(ALLOWED_DEPS['Sizes'].has('Themes')).toBe(true);
  });
});

// ─── 15. Integration: generated tokens.css ───────────────────────────────

describe('tokens.css — generated output', () => {
  let css: string;

  beforeAll(() => {
    css = readFileSync(join(import.meta.dirname, 'tokens.css'), 'utf8');
  });

  it('has no --themes- prefixed variables', () => {
    expect(css).not.toMatch(/--themes-/);
  });

  it('has no --surfaces- prefixed variables', () => {
    expect(css).not.toMatch(/--surfaces-/);
  });

  it('has no --sizes- prefixed variables', () => {
    expect(css).not.toMatch(/--sizes-/);
  });

  it('contains [data-theme="dark"] block', () => {
    expect(css).toContain('[data-theme="dark"]');
  });

  it('dark block contains fewer declarations than the Themes :root block', () => {
    const darkMatch = css.match(/\[data-theme="dark"\]\s*\{([^}]+)\}/);
    const themesMatch = css.match(/\/\* === Themes === \*\/\n:root \{([\s\S]*?)\n\}/);
    expect(darkMatch).not.toBeNull();
    expect(themesMatch).not.toBeNull();
    const countLines = (s: string) => s.split('\n').filter((l) => l.trim().startsWith('--')).length;
    expect(countLines(darkMatch![1]!)).toBeLessThan(countLines(themesMatch![1]!));
  });

  it('has NO Surfaces Default block (self-referential — merged with Themes :root)', () => {
    expect(css).not.toContain('/* === Surfaces (Default) ===');
  });

  it('has Surfaces blocks for Subtle, Inverse, and Primary', () => {
    expect(css).toContain('[data-surface="subtle"]');
    expect(css).toContain('[data-surface="inverse"]');
    expect(css).toContain('[data-surface="primary"]');
  });

  it('Surfaces blocks reference on-surface Themes vars (unprefixed)', () => {
    expect(css).toContain('var(--color-on-subtle-');
    expect(css).toContain('var(--color-on-inverse-');
    expect(css).toContain('var(--color-on-brand-primary-');
  });

  it('semantic --color-* vars are present as Themes definitions', () => {
    expect(css).toContain('--color-brand-primary:');
    expect(css).toContain('--color-background-default:');
    expect(css).toContain('--color-button-primary-background-default:');
  });

  it('Primitives are still emitted with their own naming conventions', () => {
    expect(css).toContain('--color-gray-'); // Primitives Colors
    expect(css).toContain('--spacing-');    // Primitives Sizes
    expect(css).toContain('--radius-');     // Primitives Sizes
    expect(css).toContain('--shadow-shape-'); // Primitives Shadows
  });

  it('typography Sizes vars are unprefixed and Desktop overrides use @media', () => {
    expect(css).toContain('--typography-');
    expect(css).toContain('@media (min-width:');
    expect(css).not.toContain('[data-breakpoint');
  });

  it('composite shadow vars are present', () => {
    expect(css).toContain('--shadow-sm:');
    expect(css).toContain('--inset-shadow-xs:');
  });
});

// ─── 16. Integration: generated tokens.ts ────────────────────────────────

describe('tokens.ts — generated output', () => {
  let ts: string;

  beforeAll(() => {
    ts = readFileSync(join(import.meta.dirname, 'tokens.ts'), 'utf8');
  });

  it('all var() references use unprefixed CSS vars', () => {
    expect(ts).not.toContain("var(--themes-");
    expect(ts).not.toContain("var(--surfaces-");
    expect(ts).not.toContain("var(--sizes-");
  });

  it('surfaces section has brand.primary referencing --color-brand-primary', () => {
    expect(ts).toContain("var(--color-brand-primary)'");
  });

  it('themes section has onSubtle group (no Surfaces counterpart → exported from Themes)', () => {
    expect(ts).toContain('onSubtle:');
  });

  it('themes section does NOT have a direct top-level color.brand group (Surfaces precedence)', () => {
    // Find where themes: { color: { starts — brand should NOT be the first key
    const themesColorMatch = ts.match(/themes:\s*\{[\s\S]*?color:\s*\{([\s\S]*?)(?=\n  \})/);
    if (themesColorMatch) {
      // The color section should start with onSubtle/onInverse/onBrandPrimary groups, not brand
      const colorSection = themesColorMatch[1]!;
      const firstKey = colorSection.match(/(\w+):/)?.[1];
      expect(firstKey).not.toBe('brand');
    }
  });

  it('typography sizes are exported with unprefixed references', () => {
    expect(ts).toContain("var(--typography-");
  });

  it('file exports tokens const and Tokens type', () => {
    expect(ts).toContain('export const tokens =');
    expect(ts).toContain('export type Tokens =');
  });
});

// ─── 17. Integration: generated tailwind.css ─────────────────────────────

describe('tailwind.css — generated output', () => {
  let tw: string;

  beforeAll(() => {
    tw = readFileSync(join(import.meta.dirname, 'tailwind.css'), 'utf8');
  });

  it('imports tokens.css', () => {
    expect(tw).toContain('@import "./tokens.css"');
  });

  it('has @theme inline block', () => {
    expect(tw).toContain('@theme inline {');
  });

  it('resets color scale before re-declaring', () => {
    expect(tw).toContain('--color-*: initial;');
  });

  it('maps Primitives Colors to @theme', () => {
    expect(tw).toMatch(/--color-gray-\d+: var\(--color-gray-\d+\)/);
  });

  it('maps spacing, radius, text sizes', () => {
    expect(tw).toMatch(/--spacing-\d+: var\(--spacing-\d+\)/);
    expect(tw).toMatch(/--radius-/);
    expect(tw).toMatch(/--text-/);
  });

  it('includes composite shadow vars', () => {
    expect(tw).toContain('--shadow-sm:');
    expect(tw).toContain('--inset-shadow-');
  });

  it('does not include semantic Themes/Surfaces/Sizes tokens (Primitives only)', () => {
    expect(tw).not.toContain('--color-brand-primary:');
    expect(tw).not.toContain('--typography-');
  });
});
