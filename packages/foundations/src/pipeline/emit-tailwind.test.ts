import { describe, expect, it } from 'vitest';

import { emitTailwindCss, tailwindKey } from './emit-tailwind.ts';
import { token } from './tokens.fixture.ts';

describe('tailwindKey', () => {
  it('maps primitives to Tailwind theme namespaces', () => {
    expect(tailwindKey(token('Primitives Colors', 'gray/500', '#888'))).toBe('--color-gray-500');
    expect(tailwindKey(token('Primitives Sizes', 'spacing/4', 16, 'number'))).toBe('--spacing-4');
    expect(tailwindKey(token('Primitives Sizes', 'font-weight/bold', 700, 'number'))).toBe(
      '--font-weight-bold',
    );
    expect(tailwindKey(token('Primitives Sizes', 'text/sm--line-height', 20, 'number'))).toBe(
      '--text-sm--line-height',
    );
    expect(tailwindKey(token('Primitives Motions', 'easing/ease-in', 'ease-in', 'string'))).toBe(
      '--ease-in',
    );
    expect(tailwindKey(token('Primitives Motions', 'duration/fast', 150, 'number'))).toBe(
      '--duration-fast',
    );
  });

  it('gives the brand ramps of Primitives Colors the brand-* colour names', () => {
    expect(tailwindKey(token('Primitives Colors', 'brand/primary/500', '#256ce1'))).toBe(
      '--color-brand-primary-500',
    );
  });

  it('leaves out what Tailwind has no namespace for', () => {
    expect(tailwindKey(token('Primitives Sizes', 'breakpoint/xl', 1280, 'number'))).toBeNull();
    expect(tailwindKey(token('Themes', 'color/text', { Default: '#111' }))).toBeNull();
    expect(tailwindKey(token('Themes', 'font/body', { Light: 'Inter' }, 'string'))).toBeNull();
  });
});

describe('emitTailwindCss', () => {
  const output = emitTailwindCss([
    token('Primitives Colors', 'gray/500', '#888'),
    token('Primitives Sizes', 'text/sm--line-height', 20, 'number'),
    token('Primitives Sizes', 'spacing/4', 16, 'number'),
    token('Primitives Sizes', 'text/sm', 14, 'number'),
    token('Primitives Motions', 'duration/fast', 150, 'number'),
    token('Primitives Motions', 'easing/ease-in', 'ease-in', 'string'),
    token('Themes', 'color/text/primary', { Default: '{Primitives Colors.gray.500}' }),
    token('Surfaces', 'color/text/primary', { Default: '{Themes.color.text.primary}' }),
    token('Themes', 'typography/body/font-family', { Default: 'Inter' }, 'string'),
  ]);

  it('builds an inline theme over tokens.css, without the default palette', () => {
    expect(output).toContain('@import "./tokens.css";\n\n@theme inline {\n  --color-*: initial;');
    expect(output.trimEnd().endsWith('}')).toBe(true);
  });

  it('maps the primitives in theme order, each text size before its line height', () => {
    const declared = [...output.matchAll(/^ {2}(--[a-z0-9-]+):/gm)].map((m) => m[1]);
    expect(declared.slice(0, 6)).toEqual([
      '--color-gray-500',
      '--spacing-4',
      '--text-sm',
      '--text-sm--line-height',
      '--ease-in',
      '--duration-fast',
    ]);
  });

  it('adds the composite shadows and every semantic colour once', () => {
    expect(output).toContain('  --shadow-sm: var(--shadow-shape-sm) var(--shadow-color-default);');
    expect(output.split('  --color-text-primary: var(--color-text-primary);')).toHaveLength(2);
    expect(output).not.toContain('--typography-');
  });
});
