import { describe, expect, it } from 'vitest';

import { type CssOptions, emitTokensCss, type EmitWarning, valueToCss } from './emit-css.ts';
import type { Token } from './model.ts';
import { buildRegistry } from './resolve.ts';
import { token } from './tokens.fixture.ts';

function emit(tokens: Token[], options: Partial<CssOptions> = {}) {
  return emitTokensCss(tokens, buildRegistry(tokens), {
    breakpointPx: 1280,
    autoDarkMode: true,
    ...options,
  });
}

function css(tokens: Token[], options: Partial<CssOptions> = {}): string {
  return emit(tokens, options).css;
}

/** The body of the first block whose header or selector starts with `marker`. */
function blockAfter(text: string, marker: string): string {
  const start = text.indexOf(marker);
  expect(start, `not found: ${marker}`).toBeGreaterThanOrEqual(0);
  return text.slice(start, text.indexOf('}', start) + 1);
}

function count(text: string, fragment: string): number {
  return text.split(fragment).length - 1;
}

const brand500 = token('Primitives Colors', 'brand/primary/500', '#256ce1');
const brand600 = token('Primitives Colors', 'brand/primary/600', '#1e5ac8');
const brand700 = token('Primitives Colors', 'brand/primary/700', '#173f8f');

function brand(values: Record<string, string>): Token {
  return token('Themes', 'color/brand/primary', values);
}

describe('valueToCss', () => {
  it('turns an alias into the var() of its target, without a collection prefix', () => {
    const theme = brand({ Default: '{Primitives Colors.brand.primary.500}' });
    const registry = buildRegistry([brand500, theme]);
    const surface = token('Surfaces', 'color/brand/primary', {
      Default: '{Themes.color.brand.primary}',
    });
    expect(
      valueToCss(theme, '{Primitives Colors.brand.primary.500}', 'Default', registry, []),
    ).toBe('var(--color-brand-primary-500)');
    expect(valueToCss(surface, '{Themes.color.brand.primary}', 'Default', registry, [])).toBe(
      'var(--color-brand-primary)',
    );
  });

  it('writes a line height as a ratio of its paired font size', () => {
    const size = token('Primitives Sizes', 'text/sm', 14, 'number');
    const lineHeight = token('Primitives Sizes', 'text/sm--line-height', 20, 'number');
    const registry = buildRegistry([size, lineHeight]);
    expect(valueToCss(lineHeight, 20, null, registry, [])).toBe('calc(1.25 / 0.875)');
    const zero = token('Primitives Sizes', 'text/xs--line-height', 0, 'number');
    expect(valueToCss(zero, 0, null, buildRegistry([zero]), [])).toBe('0');
  });

  it('rescales an aliased line height for its own font size in every size mode', () => {
    const baseSize = token('Primitives Sizes', 'text/base', 16, 'number');
    const baseLine = token('Primitives Sizes', 'text/base-line-height', 24, 'number');
    const size = token('Sizes', 'body/small/font-size', { Mobile: 14, Desktop: 12 }, 'number');
    const line = token(
      'Sizes',
      'body/small/line-height',
      {
        Mobile: '{Primitives Sizes.text.base-line-height}',
        Desktop: '{Primitives Sizes.text.base-line-height}',
      },
      'number',
    );
    const componentSize = token(
      'Components',
      'control/small/font-size',
      '{Sizes.body.small.font-size}',
      'number',
    );
    const componentLine = token(
      'Components',
      'control/small/line-height',
      '{Primitives Sizes.text.base-line-height}',
      'number',
    );
    const tokens = [baseSize, baseLine, size, line, componentSize, componentLine];
    const registry = buildRegistry(tokens);
    expect(
      valueToCss(line, '{Primitives Sizes.text.base-line-height}', 'Mobile', registry, []),
    ).toBe('calc(var(--text-base--line-height) * 16 / 14)');
    const output = css(tokens);
    expect(blockAfter(output, '/* === Sizes (Desktop) === */')).toContain(
      '--body-small-line-height: calc(var(--text-base--line-height) * 16 / 12)',
    );
    expect(output).toContain(
      '--control-small-line-height: calc(var(--text-base--line-height) * 16 / 14)',
    );
    expect(blockAfter(output, '/* === Components — dimensions (Desktop) === */')).toContain(
      '--control-small-line-height: calc(var(--text-base--line-height) * 16 / 12)',
    );
  });

  it('keeps a line height that aliases another length as that length', () => {
    const size = token('Sizes', 'body/small/font-size', { Mobile: 14 }, 'number');
    const labelSize = token(
      'Components',
      'control/label/floating/font-size',
      '{Sizes.body.small.font-size}',
      'number',
    );
    const labelLine = token(
      'Components',
      'control/label/floating/line-height',
      '{Sizes.body.small.font-size}',
      'number',
    );
    const registry = buildRegistry([size, labelSize, labelLine]);
    expect(valueToCss(labelLine, '{Sizes.body.small.font-size}', 'Mobile', registry, [])).toBe(
      'var(--body-small-font-size)',
    );
  });

  it('warns about a line height without a font size and assumes 16px', () => {
    const lonely = token('Sizes', 'caption/line-height', { Mobile: 24 }, 'number');
    const warnings: EmitWarning[] = [];
    expect(valueToCss(lonely, 24, 'Mobile', buildRegistry([lonely]), warnings)).toBe(
      'calc(1.5 / 1)',
    );
    expect(warnings.map((w) => w.rule)).toEqual(['unpaired-line-height']);
  });
});

describe('emitTokensCss — theme modes', () => {
  const darkDiffers = brand({
    Default: '{Primitives Colors.brand.primary.500}',
    Dark: '{Primitives Colors.brand.primary.600}',
  });
  const primitives = [brand500, brand600, brand700];

  it('puts the base mode on :root, its own attribute and the default surface', () => {
    expect(css([...primitives, darkDiffers])).toContain(
      '/* === Themes === */\n:root,\n[data-theme="default"],\n[data-surface="default"] {',
    );
  });

  it('emits a block for Dark only when a value differs from the base', () => {
    expect(css([...primitives, darkDiffers])).toContain(
      '/* === Themes (Dark) === */\n[data-theme="dark"],\n[data-theme="dark"] [data-surface="default"] {',
    );
    const same = brand({
      Default: '{Primitives Colors.brand.primary.500}',
      Dark: '{Primitives Colors.brand.primary.500}',
    });
    expect(css([...primitives, same])).not.toContain('[data-theme="dark"]');
  });

  it('chooses a further brand with data-brand and its dark scheme with data-theme too', () => {
    const output = css([
      ...primitives,
      brand({
        Light: '{Primitives Colors.brand.primary.500}',
        Dark: '{Primitives Colors.brand.primary.600}',
        Green: '{Primitives Colors.brand.primary.700}',
        'Green Dark': '{Primitives Colors.brand.primary.600}',
      }),
    ]);
    expect(blockAfter(output, '/* === Themes (Green) === */')).toContain(
      '[data-brand="green"],\n[data-brand="green"] [data-surface="default"] {\n  --color-brand-primary: var(--color-brand-primary-700);',
    );
    expect(blockAfter(output, '/* === Themes (Green Dark) === */')).toContain(
      '[data-brand="green"][data-theme="dark"],\n[data-brand="green"][data-theme="dark"] [data-surface="default"] {',
    );
  });

  it('re-declares only what differs, plus the aliases that follow it', () => {
    const gray700 = token('Primitives Colors', 'gray/700', '#374151');
    const gray200 = token('Primitives Colors', 'gray/200', '#e5e7eb');
    const secondary = token('Themes', 'color/text/secondary', {
      Default: '{Primitives Colors.gray.700}',
      Dark: '{Primitives Colors.gray.200}',
    });
    const label = token('Themes', 'color/control/label', {
      Default: '{Themes.color.text.secondary}',
      Dark: '{Themes.color.text.secondary}',
    });
    const steady = token('Themes', 'color/text/primary', {
      Default: '{Primitives Colors.gray.700}',
      Dark: '{Primitives Colors.gray.700}',
    });
    const dark = blockAfter(
      css([gray700, gray200, secondary, label, steady]),
      '/* === Themes (Dark) === */',
    );
    expect(dark).toContain('--color-text-secondary: var(--color-gray-200);');
    expect(dark).toContain('--color-control-label: var(--color-text-secondary);');
    expect(dark).not.toContain('--color-text-primary');
  });

  it('leaves a token out of a mode it has no value for', () => {
    const partial = token('Themes', 'color/text/primary', {
      Default: '{Primitives Colors.brand.primary.500}',
      Green: '{Primitives Colors.brand.primary.700}',
    });
    const block = blockAfter(css([...primitives, partial, darkDiffers]), '[data-brand="green"],');
    expect(block).toContain('--color-text-primary');
    expect(block).not.toContain('--color-brand-primary:');
  });

  it('mirrors Dark onto the system preference, unless a theme is chosen', () => {
    expect(css([...primitives, darkDiffers])).toContain(
      '@media (prefers-color-scheme: dark) {\n  :root:not([data-theme]),\n  :root:not([data-theme]) [data-surface="default"] {',
    );
    const withoutMirror = css([...primitives, darkDiffers], { autoDarkMode: false });
    expect(withoutMirror).not.toContain('prefers-color-scheme');
    expect(withoutMirror).toContain('[data-theme="dark"],');
  });

  it('mirrors no mode other than a dark one', () => {
    const green = brand({
      Default: '{Primitives Colors.brand.primary.500}',
      Green: '{Primitives Colors.brand.primary.700}',
    });
    expect(css([...primitives, green])).not.toContain('prefers-color-scheme');
  });

  it('mirrors the dark scheme of a further brand onto its root without a chosen theme', () => {
    const output = css([
      ...primitives,
      brand({
        Light: '{Primitives Colors.brand.primary.500}',
        Green: '{Primitives Colors.brand.primary.700}',
        'Green Dark': '{Primitives Colors.brand.primary.600}',
      }),
    ]);
    expect(output).toContain(
      '@media (prefers-color-scheme: dark) {\n  [data-brand="green"]:not([data-theme]),\n  [data-brand="green"]:not([data-theme]) [data-surface="default"] {',
    );
  });

  it('takes Light as the base mode', () => {
    const output = css([
      ...primitives,
      brand({
        Dark: '{Primitives Colors.brand.primary.600}',
        Light: '{Primitives Colors.brand.primary.500}',
      }),
    ]);
    expect(output).toContain(
      '/* === Themes === */\n:root,\n[data-theme="light"],\n[data-surface="default"] {',
    );
    expect(output).toContain('/* === Themes (Dark) === */');
  });

  it('takes the first mode as the base when there is no Default or Light', () => {
    const output = css([
      ...primitives,
      brand({
        TenantLight: '{Primitives Colors.brand.primary.500}',
        TenantDark: '{Primitives Colors.brand.primary.600}',
      }),
    ]);
    expect(output).toContain(
      '/* === Themes === */\n:root,\n[data-brand="tenant"],\n[data-surface="default"] {',
    );
    expect(output).toContain('[data-brand="tenant"][data-theme="dark"],');
  });
});

describe('emitTokensCss — brand values', () => {
  it('declares the brand values of Themes on :root, with each value in its CSS form', () => {
    const output = css([
      token('Primitives Sizes', 'font-weight/semibold', 600, 'number'),
      token('Themes', 'font/body', { Light: 'Inter', Dark: 'Inter' }, 'string'),
      token('Themes', 'text-uppercase/button', { Light: true, Dark: true }, 'boolean'),
      token('Themes', 'ring/width', { Light: 2, Dark: 2 }, 'number'),
    ]);
    const root = blockAfter(output, '/* === Themes — the same in every mode === */');
    expect(root).toContain(':root {');
    expect(root).toContain('  --font-body: "Inter";');
    expect(root).toContain('  --text-uppercase-button: uppercase;');
    expect(root).toContain('  --ring-width: 0.125rem;');
    expect(count(output, '--font-body:')).toBe(1);
  });

  it('keeps a brand value off the reset scopes, so an override on :root reaches every surface', () => {
    const output = css([
      token('Primitives Colors', 'gray/50', '#fafafa'),
      token('Themes', 'font/body', { Light: 'Inter', Dark: 'Inter' }, 'string'),
      token('Themes', 'color/text/primary', { Light: '#111111', Dark: '#111111' }),
    ]);
    const base = blockAfter(output, '/* === Themes === */');
    expect(base).toContain('[data-surface="default"]');
    expect(base).toContain('--color-text-primary');
    expect(base).not.toContain('--font-body');
  });

  it('declares a brand value again only in the modes where it differs', () => {
    const output = css([
      token('Themes', 'font/body', { Light: 'Inter', Club: 'Barlow' }, 'string'),
      token('Themes', 'ring/width', { Light: 2, Club: 2 }, 'number'),
    ]);
    expect(blockAfter(output, '/* === Themes (Club) === */')).toBe(
      '/* === Themes (Club) === */\n[data-brand="club"],\n[data-brand="club"] [data-surface="default"] {\n  --font-body: "Barlow";\n}',
    );
  });
});

describe('emitTokensCss — surfaces', () => {
  const theme = brand({ Default: '{Primitives Colors.brand.primary.500}' });
  const onSubtle = token('Themes', 'color/on-subtle/brand/primary', {
    Default: '{Primitives Colors.brand.primary.500}',
  });
  const surface = token('Surfaces', 'color/brand/primary', {
    Default: '{Themes.color.brand.primary}',
    Subtle: '{Themes.color.on-subtle.brand.primary}',
  });

  it('skips the Default surface, which only repeats the theme', () => {
    expect(css([brand500, theme, onSubtle, surface])).not.toContain('Surfaces (Default)');
  });

  it('switches a role to its copy for the surface', () => {
    expect(
      blockAfter(css([brand500, theme, onSubtle, surface]), '[data-surface="subtle"]'),
    ).toContain('--color-brand-primary: var(--color-on-subtle-brand-primary);');
  });

  it('emits a surface mode that a client file adds', () => {
    const onHighlight = token('Themes', 'color/on-highlight/brand/primary', {
      Default: '{Primitives Colors.brand.primary.500}',
    });
    const highlighted = token('Surfaces', 'color/brand/primary', {
      Default: '{Themes.color.brand.primary}',
      BrandHighlight: '{Themes.color.on-highlight.brand.primary}',
    });
    expect(css([brand500, theme, onHighlight, highlighted])).toContain(
      '/* === Surfaces (BrandHighlight) === */\n[data-surface="brand-highlight"] {\n  --color-brand-primary: var(--color-on-highlight-brand-primary);',
    );
  });

  it('repeats a theme-dependent line of the Default surface in every theme scope', () => {
    const green = token('Primitives Colors', 'brand/500', '#2f9e63');
    const blue = token('Primitives Colors', 'brand/600', '#0a1e3c');
    const role = brand({
      Green: '{Primitives Colors.brand.500}',
      Blue: '{Primitives Colors.brand.600}',
    });
    const badge = token('Surfaces', 'color/badge/brand/solid/background', {
      Default: '{Themes.color.brand.primary}',
    });
    const output = css([green, blue, role, badge]);
    const declaration = '--color-badge-brand-solid-background: var(--color-brand-primary);';
    expect(count(output, declaration)).toBe(2);
    expect(blockAfter(output, '/* === Surfaces (Default — Blue) === */')).toContain(declaration);
  });
});

describe('emitTokensCss — components', () => {
  const gray900 = token('Primitives Colors', 'gray/900', '#151419');
  const gray800 = token('Primitives Colors', 'gray/800', '#2d2f31');
  const role = token('Themes', 'color/neutral/background', {
    Default: '{Primitives Colors.gray.900}',
    Dark: '{Primitives Colors.gray.800}',
  });
  const surface = token('Surfaces', 'color/neutral/background', {
    Default: '{Themes.color.neutral.background}',
    Subtle: '{Themes.color.on-subtle.neutral.background}',
    Inverse: '{Themes.color.on-inverse.neutral.background}',
  });
  const chip = token('Components', 'color/chip/background', '{Surfaces.color.neutral.background}');
  const colours = [gray900, gray800, role, surface, chip];

  it('repeats colour aliases in every theme and surface scope', () => {
    const output = css(colours);
    const declaration = '  --color-chip-background: var(--color-neutral-background);';
    for (const selector of [
      ':root,\n[data-theme="default"],\n[data-surface="default"]',
      '[data-theme="dark"],\n[data-theme="dark"] [data-surface="default"]',
      '[data-surface="subtle"]',
      '[data-surface="inverse"]',
    ]) {
      expect(blockAfter(output, `/* === Components === */\n${selector} {`)).toContain(declaration);
    }
  });

  it('declares a dimension once, on :root, while Sizes has one density', () => {
    const spacing = token('Primitives Sizes', 'spacing/4', 16, 'number');
    const ramp = token(
      'Sizes',
      'layout/padding/inline/lg',
      { Mobile: '{Primitives Sizes.spacing.4}', Desktop: '{Primitives Sizes.spacing.4}' },
      'number',
    );
    const padding = token(
      'Components',
      'button/padding/inline',
      '{Sizes.layout.padding.inline.lg}',
      'number',
    );
    const output = css([...colours, spacing, ramp, padding]);
    expect(count(output, '--button-padding-inline: var(--layout-padding-inline-lg);')).toBe(1);
    expect(output).toContain(
      '/* === Components — dimensions (sizes) === */\n:root {\n  --button-padding-inline:',
    );
  });

  it('emits no Components section without the collection', () => {
    expect(css([gray900, gray800, role, surface])).not.toContain('=== Components ===');
  });
});

describe('emitTokensCss — screen and density', () => {
  const spacing2 = token('Primitives Sizes', 'spacing/2', 8, 'number');
  const spacing3 = token('Primitives Sizes', 'spacing/3', 12, 'number');
  const spacing4 = token('Primitives Sizes', 'spacing/4', 16, 'number');
  const gap = token(
    'Sizes',
    'gap/md',
    {
      Mobile: '{Primitives Sizes.spacing.4}',
      Desktop: '{Primitives Sizes.spacing.4}',
      'Mobile Compact': '{Primitives Sizes.spacing.3}',
      'Desktop Compact': '{Primitives Sizes.spacing.3}',
    },
    'number',
  );
  const page = token(
    'Sizes',
    'layout/padding',
    {
      Mobile: '{Primitives Sizes.spacing.3}',
      Desktop: '{Primitives Sizes.spacing.4}',
      'Mobile Compact': '{Primitives Sizes.spacing.2}',
      'Desktop Compact': '{Primitives Sizes.spacing.3}',
    },
    'number',
  );
  const buttonGap = token('Components', 'button/gap', '{Sizes.gap.md}', 'number');
  const base = [spacing2, spacing3, spacing4, gap, page, buttonGap];

  it('gives the base density :root and its attribute, so a nested container can reset to it', () => {
    const output = css(base);
    expect(blockAfter(output, '/* === Sizes (Mobile) === */')).toContain(
      ':root,\n[data-density="comfortable"] {\n  --gap-md: var(--spacing-4);',
    );
    expect(blockAfter(output, '/* === Sizes (Mobile Compact) === */')).toContain(
      '[data-density="compact"] {\n  --gap-md: var(--spacing-3);',
    );
  });

  it('puts the Desktop values of every density in a media query at the breakpoint', () => {
    const output = css(base);
    expect(blockAfter(output, '/* === Sizes (Desktop) === */')).toBe(
      '/* === Sizes (Desktop) === */\n@media (min-width: 80rem) {\n  :root,\n[data-density="comfortable"] {\n    --layout-padding: var(--spacing-4);\n  }',
    );
    expect(blockAfter(output, '/* === Sizes (Desktop Compact) === */')).toContain(
      '[data-density="compact"] {\n    --layout-padding: var(--spacing-3);',
    );
  });

  it('declares every Sizes token in every density, so nothing is inherited across densities', () => {
    expect(count(css(base), '--gap-md:')).toBe(2);
  });

  it('repeats a dimension that reaches Sizes in every density scope', () => {
    expect(count(css(base), '--button-gap: var(--gap-md);')).toBe(2);
  });

  it('follows the alias chain through another component token', () => {
    const chipGap = token('Components', 'chip/gap', '{Components.button.gap}', 'number');
    expect(count(css([...base, chipGap]), '--chip-gap: var(--button-gap);')).toBe(2);
  });

  it('names no density without a density mode', () => {
    const ramp = token(
      'Sizes',
      'layout/padding/inline/lg',
      { Mobile: '{Primitives Sizes.spacing.4}', Desktop: '{Primitives Sizes.spacing.4}' },
      'number',
    );
    const padding = token(
      'Components',
      'button/padding/inline',
      '{Sizes.layout.padding.inline.lg}',
      'number',
    );
    const output = css([spacing4, ramp, padding]);
    expect(output).not.toContain('data-density');
    expect(count(output, '--button-padding-inline: var(--layout-padding-inline-lg);')).toBe(1);
  });
});

describe('emitTokensCss — sizes', () => {
  it('puts Desktop values that differ from Mobile in a media query at the breakpoint', () => {
    const ramp = token('Sizes', 'typography/body/font-size', { Mobile: 16, Desktop: 18 }, 'number');
    const output = css([ramp]);
    expect(output).toContain(
      '/* === Sizes (Mobile) === */\n:root {\n  --typography-body-font-size: 1rem;',
    );
    expect(output).toContain(
      '@media (min-width: 80rem) {\n  :root {\n    --typography-body-font-size: 1.125rem;',
    );
  });

  it('warns about a Sizes mode that names no known screen', () => {
    const wide = token('Sizes', 'gap', { Mobile: 8, Desktop: 12, Wide: 16 }, 'number');
    expect(emit([wide]).warnings).toEqual([
      {
        rule: 'unmapped-mode',
        message: 'Sizes mode "Wide" names no known screen; only mobile and desktop are emitted',
      },
    ]);
  });

  it('emits the semantic radius family beside the primitive ramp', () => {
    const output = css([
      token('Primitives Sizes', 'radius/sm', 4, 'number'),
      token('Primitives Sizes', 'radius/none', 0, 'number'),
      token('Themes', 'radius/sm', { Light: '{Primitives Sizes.radius.sm}' }, 'number'),
      token('Components', 'badge/square/radius', '{Themes.radius.sm}', 'number'),
    ]);
    expect(output).toContain('--radius-sm: 0.25rem;');
    expect(output).toContain('--shape-radius-sm: var(--radius-sm);');
    expect(output).toContain('--badge-square-radius: var(--shape-radius-sm);');
  });
});
