import type { ManifestToken, TokenManifest } from '@mszczygiel-projects/ui-core-foundations';
import { describe, expect, it } from 'vitest';

import {
  contextLabel,
  describeValue,
  groupBy,
  modeLabel,
  tokensWithPrefix,
  toolbarItems,
  valueIn,
} from './tokens.ts';

const textPrimary: ManifestToken = {
  name: '--color-text-primary',
  collection: 'Surfaces',
  path: 'color/text/primary',
  kind: 'color',
  axes: ['theme', 'surface'],
  values: [
    { context: { theme: 'light', surface: 'default' }, value: '#111', raw: '#111' },
    { context: { theme: 'light', surface: 'inverse' }, value: '#eee', raw: '#eee' },
    { context: { theme: 'dark', surface: 'default' }, value: '#eee', raw: '#eee' },
    { context: { theme: 'dark', surface: 'inverse' }, value: '#111', raw: '#111' },
  ],
};

const spacing: ManifestToken = {
  name: '--spacing-4',
  collection: 'Primitives Sizes',
  path: 'spacing/4',
  kind: 'number',
  axes: [],
  values: [{ context: {}, value: '1rem', raw: 16 }],
};

const copy: ManifestToken = {
  ...textPrimary,
  name: '--color-on-inverse-text-primary',
  hidden: true,
};

const manifest: TokenManifest = {
  $comment: '',
  modes: {
    brand: [],
    theme: ['light', 'dark'],
    surface: ['default', 'inverse'],
    density: [],
    size: [],
  },
  breakpoint: '64rem',
  textStyles: [],
  shadows: [],
  tokens: [textPrimary, copy, spacing],
};

describe('valueIn', () => {
  it('finds the value of a context', () => {
    expect(valueIn(textPrimary, { theme: 'dark', surface: 'inverse' })?.value).toBe('#111');
  });

  it('takes the base mode of an axis the context leaves out', () => {
    expect(valueIn(textPrimary, { theme: 'dark' })?.value).toBe('#eee');
    expect(valueIn(textPrimary)?.value).toBe('#111');
  });

  it('ignores axes the token does not change with', () => {
    expect(valueIn(spacing, { theme: 'dark' })?.value).toBe('1rem');
  });
});

describe('tokensWithPrefix', () => {
  it('leaves out what Figma hides from publishing, unless asked', () => {
    expect(tokensWithPrefix(manifest, '--color-').map((t) => t.name)).toEqual([
      '--color-text-primary',
    ]);
    expect(tokensWithPrefix(manifest, '--color-', { hidden: true })).toHaveLength(2);
  });
});

describe('groupBy', () => {
  it('keeps the order in which groups first appear', () => {
    const groups = groupBy(['b1', 'a1', 'b2'], (item) => item.charAt(0));
    expect([...groups]).toEqual([
      ['b', ['b1', 'b2']],
      ['a', ['a1']],
    ]);
  });
});

describe('modeLabel and toolbarItems', () => {
  it('turn attribute values into labels', () => {
    expect(modeLabel('dark-green')).toBe('Dark green');
    expect(toolbarItems(['light', 'dark'])).toEqual([
      { value: 'light', title: 'Light' },
      { value: 'dark', title: 'Dark' },
    ]);
  });
});

describe('describeValue', () => {
  it('adds the pixels of a rem, and gives a line height in pixels', () => {
    expect(describeValue({ context: {}, value: '1rem', raw: 16 })).toBe('1rem (16px)');
    expect(describeValue({ context: {}, value: 'calc(1.5 / 1)', raw: 24 })).toBe('24px');
    expect(describeValue({ context: {}, value: '#111', raw: '#111' })).toBe('#111');
  });
});

describe('contextLabel', () => {
  it('names the modes of a context, or the value when there are none', () => {
    expect(contextLabel({ theme: 'dark', surface: 'inverse' })).toBe('Dark · Inverse');
    expect(contextLabel({})).toBe('Value');
  });
});
