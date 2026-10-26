import { describe, expect, it } from 'vitest';

import { cssVarName, modeSlug, normalizeSegment, renamedPath, toCamel, tsKey } from './names.ts';

describe('cssVarName', () => {
  it('prefixes primitive colours with --color-', () => {
    expect(cssVarName('Primitives Colors', ['gray', '500'])).toBe('--color-gray-500');
    expect(cssVarName('Primitives Colors', ['brand', 'primary', '500'])).toBe(
      '--color-brand-primary-500',
    );
    expect(cssVarName('Primitives Colors', ['black', '300'])).toBe('--color-black-300');
  });

  it('writes primitive sizes without a prefix', () => {
    expect(cssVarName('Primitives Sizes', ['spacing', '4'])).toBe('--spacing-4');
    expect(cssVarName('Primitives Sizes', ['radius', 'md'])).toBe('--radius-md');
    expect(cssVarName('Primitives Sizes', ['font-weight', 'normal'])).toBe('--font-weight-normal');
    expect(cssVarName('Primitives Sizes', ['tracking', 'wide'])).toBe('--tracking-wide');
    expect(cssVarName('Primitives Sizes', ['text', 'sm'])).toBe('--text-sm');
  });

  it('pairs a text size with its line height the way Tailwind does', () => {
    expect(cssVarName('Primitives Sizes', ['text', 'sm--line-height'])).toBe(
      '--text-sm--line-height',
    );
    expect(cssVarName('Primitives Sizes', ['text', 'sm-line-height'])).toBe(
      '--text-sm--line-height',
    );
  });

  it('drops the easing segment of a motion curve and keeps durations whole', () => {
    expect(cssVarName('Primitives Motions', ['easing', 'ease-in'])).toBe('--ease-in');
    expect(cssVarName('Primitives Motions', ['duration', 'fast'])).toBe('--duration-fast');
  });

  it('names the brand values of Themes by their path, with no prefix', () => {
    expect(cssVarName('Themes', ['font', 'heading'])).toBe('--font-heading');
    expect(cssVarName('Themes', ['text-uppercase', 'button'])).toBe('--text-uppercase-button');
  });

  it('writes shadows by their path', () => {
    expect(cssVarName('Primitives Shadows', ['shadow-shape', 'sm'])).toBe('--shadow-shape-sm');
    expect(cssVarName('Primitives Shadows', ['shadow-color', 'default'])).toBe(
      '--shadow-color-default',
    );
  });

  it('gives semantic collections no prefix of their own, so they share names', () => {
    expect(cssVarName('Themes', ['color', 'brand', 'primary'])).toBe('--color-brand-primary');
    expect(cssVarName('Surfaces', ['color', 'brand', 'primary'])).toBe('--color-brand-primary');
    expect(cssVarName('Themes', ['ring', 'style'])).toBe('--ring-style');
    expect(cssVarName('Sizes', ['typography', 'body', 'font-size'])).toBe(
      '--typography-body-font-size',
    );
    expect(cssVarName('Components', ['color', 'chip', 'neutral', 'solid', 'background'])).toBe(
      '--color-chip-neutral-solid-background',
    );
  });
});

describe('the semantic renames', () => {
  it('keep the short name for the primitive and move the semantic radius family', () => {
    expect(cssVarName('Primitives Sizes', ['radius', 'sm'])).toBe('--radius-sm');
    expect(cssVarName('Primitives Sizes', ['radius', 'full'])).toBe('--radius-full');
    expect(cssVarName('Themes', ['radius', 'sm'])).toBe('--shape-radius-sm');
    expect(cssVarName('Themes', ['radius', 'pill'])).toBe('--shape-radius-pill');
  });

  it('need no rule for the shadow colours of Themes, which live under color/', () => {
    expect(cssVarName('Themes', ['color', 'shadow', 'default'])).toBe('--color-shadow-default');
    expect(cssVarName('Themes', ['shadow', 'elevation', '1'])).toBe('--shadow-elevation-1');
  });

  it('leave other paths alone and apply only once', () => {
    expect(cssVarName('Components', ['control', 'radius'])).toBe('--control-radius');
    expect(renamedPath('Themes', ['shape-radius', 'sm'])).toEqual(['shape-radius', 'sm']);
  });
});

describe('modeSlug', () => {
  it('turns a Figma mode name into an attribute value', () => {
    expect(modeSlug('Dark')).toBe('dark');
    expect(modeSlug('DarkGreen')).toBe('dark-green');
    expect(modeSlug('Tenant Light')).toBe('tenant-light');
    expect(modeSlug('tenant_dark')).toBe('tenant-dark');
    expect(modeSlug('Brand/High Contrast')).toBe('brand-high-contrast');
    expect(modeSlug('HCDark')).toBe('hc-dark');
  });
});

describe('normalizeSegment', () => {
  it('collapses a doubled hyphen', () => {
    expect(normalizeSegment('sm--line-height')).toBe('sm-line-height');
    expect(normalizeSegment('base')).toBe('base');
  });
});

describe('toCamel and tsKey', () => {
  it('turn kebab-case into camelCase keys', () => {
    expect(toCamel('on-subtle')).toBe('onSubtle');
    expect(toCamel('font-size')).toBe('fontSize');
    expect(tsKey('on-subtle')).toBe('onSubtle');
  });

  it('quote a key that is not an identifier', () => {
    expect(tsKey('2xl')).toBe('"2xl"');
  });
});
