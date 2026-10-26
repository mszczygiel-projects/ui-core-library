import { describe, expect, it } from 'vitest';

import { buildTokens } from './build.ts';
import { diffNames, tokenNames } from './snapshot.ts';
import { token } from './tokens.fixture.ts';

describe('tokenNames', () => {
  const tokens = [
    token('Primitives Sizes', 'breakpoint/lg', 1280, 'number'),
    token('Primitives Colors', 'gray/900', '#151419'),
    token('Primitives Colors', 'gray/100', '#f4f4f5'),
    token('Themes', 'color/text-primary', {
      Default: '{Primitives Colors.gray.900}',
      Dark: '{Primitives Colors.gray.100}',
    }),
    token('Surfaces', 'color/text-primary', {
      Default: '{Themes.color.text-primary}',
      Inverse: '{Primitives Colors.gray.100}',
    }),
    token('Sizes', 'typography/body/font-size', { Mobile: 16, Desktop: 16 }, 'number'),
  ];
  const { files } = buildTokens(tokens, { strict: false, autoDarkMode: true });

  it('lists every public name once, by kind and in order', () => {
    if (files === null) {
      throw new Error('the fixture should build');
    }
    expect(tokenNames(files, tokens)).toEqual([
      'attr data-surface=default',
      'attr data-surface=inverse',
      'attr data-theme=dark',
      'attr data-theme=default',
      'class ui-text-body',
      'css --breakpoint-lg',
      'css --color-gray-100',
      'css --color-gray-900',
      'css --color-text-primary',
      'css --inset-shadow-2xs',
      'css --inset-shadow-sm',
      'css --inset-shadow-xs',
      'css --shadow-2xl',
      'css --shadow-2xs',
      'css --shadow-lg',
      'css --shadow-md',
      'css --shadow-sm',
      'css --shadow-xl',
      'css --shadow-xs',
      'css --typography-body-font-size',
      'tailwind --color-gray-100',
      'tailwind --color-gray-900',
      'tailwind --color-text-primary',
      'tailwind --inset-shadow-2xs',
      'tailwind --inset-shadow-sm',
      'tailwind --inset-shadow-xs',
      'tailwind --shadow-2xl',
      'tailwind --shadow-2xs',
      'tailwind --shadow-lg',
      'tailwind --shadow-md',
      'tailwind --shadow-sm',
      'tailwind --shadow-xl',
      'tailwind --shadow-xs',
      'ts tokens.sizes.typography.body.fontSize',
      'ts tokens.surfaces.color.textPrimary',
    ]);
  });
});

describe('diffNames', () => {
  it('shows what a change adds and removes', () => {
    expect(diffNames(['css --a', 'css --b'], ['css --b', 'css --c'])).toEqual({
      added: ['css --c'],
      removed: ['css --a'],
    });
  });
});
