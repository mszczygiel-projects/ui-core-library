import { describe, expect, it } from 'vitest';

import {
  type FigmaScope,
  needsDescription,
  type Scopes,
  scopesOf,
  surfaceUse,
  variableMetadata,
  webCodeSyntax,
} from './figma.ts';
import type { Collection, TokenType, TokenValue } from './model.ts';
import { parseExports, readExports } from './parse.ts';
import { EXPORTS_DIR, token } from './tokens.fixture.ts';

const color = [
  token('Themes', 'color/text/primary', { Light: '#111111', Dark: '#eeeeee' }),
  token('Themes', 'color/on-subtle/text/primary', { Light: '#000000', Dark: '#ffffff' }),
  token('Themes', 'color/shadow/default', { Light: '{Primitives Shadows.shadow-color.default}' }),
];
const surfaces = [
  token('Surfaces', 'color/text/primary', {
    Default: '{Themes.color.text.primary}',
    Subtle: '{Themes.color.on-subtle.text.primary}',
  }),
];
const use = surfaceUse([...color, ...surfaces]);

function scopes(
  collection: Collection,
  path: string,
  type: TokenType = 'color',
  value: TokenValue = '{Surfaces.color.text.primary}',
): Scopes {
  return scopesOf(token(collection, path, value, type), use);
}

describe('webCodeSyntax', () => {
  it('is the var() of the custom property, with every rule of the CSS names', () => {
    const syntax = (collection: Collection, path: string) =>
      webCodeSyntax(token(collection, path, 0, 'number'));
    expect(syntax('Themes', 'font/heading')).toBe('var(--font-heading)');
    expect(syntax('Themes', 'radius/sm')).toBe('var(--shape-radius-sm)');
    expect(syntax('Primitives Sizes', 'text/xs-line-height')).toBe('var(--text-xs--line-height)');
    expect(syntax('Primitives Motions', 'easing/ease-in')).toBe('var(--ease-in)');
    expect(syntax('Primitives Colors', 'gray/500')).toBe('var(--color-gray-500)');
  });

  it('gives a colour role the same name in Themes and in Surfaces', () => {
    const [role] = color;
    const [surfaceRole] = surfaces;
    expect(role && webCodeSyntax(role)).toBe('var(--color-text-primary)');
    expect(surfaceRole && webCodeSyntax(surfaceRole)).toBe('var(--color-text-primary)');
  });
});

describe('scopesOf', () => {
  it('offers the background behind a floating label as a fill', () => {
    expect(scopes('Components', 'color/control/outline/label-background')).toEqual([
      'FRAME_FILL',
      'SHAPE_FILL',
    ]);
  });

  it('offers a tint over a fill and the backdrop of a modal as fills, and a smallest target as a size', () => {
    expect(scopes('Components', 'color/chip/tint/active')).toEqual(['FRAME_FILL', 'SHAPE_FILL']);
    expect(scopes('Components', 'color/dialog/backdrop')).toEqual(['FRAME_FILL', 'SHAPE_FILL']);
    expect(scopes('Components', 'chip/target/min-size', 'number', 24)).toEqual(['WIDTH_HEIGHT']);
  });

  it('keeps component shadow shapes out of fields that cannot bind strings', () => {
    expect(
      scopes('Components', 'button/shadow/active', 'string', '{Themes.shadow.interactive.hover}'),
    ).toEqual([]);
    expect(scopes('Components', 'color/button/shadow')).toEqual(['EFFECT_COLOR']);
  });

  it('offers the variables reached only through aliases in no field', () => {
    expect(scopes('Themes', 'font/heading', 'string', 'Inter')).toEqual([]);
    expect(scopes('Themes', 'ring/width', 'number', 2)).toEqual([]);
  });

  it('offers primitive colours in every paint field, and shadow colours only in effects', () => {
    expect(scopes('Primitives Colors', 'gray/500', 'color', '#6b7280')).toEqual([
      'FRAME_FILL',
      'SHAPE_FILL',
      'STROKE_COLOR',
      'TEXT_FILL',
      'EFFECT_COLOR',
    ]);
    expect(scopes('Primitives Shadows', 'shadow-color/default')).toEqual(['EFFECT_COLOR']);
  });

  it.each<[string, FigmaScope[]]>([
    ['spacing/4', ['GAP', 'WIDTH_HEIGHT']],
    ['size/1', ['WIDTH_HEIGHT']],
    ['radius/md', ['CORNER_RADIUS']],
    ['text/sm', ['FONT_SIZE']],
    ['text/sm-line-height', ['LINE_HEIGHT']],
    ['font-weight/medium', ['FONT_WEIGHT']],
    ['border-width/2', ['STROKE_FLOAT']],
    ['breakpoint/lg', []],
  ])('offers %s in its intended fields', (path, expected) => {
    expect(scopes('Primitives Sizes', path, 'number', 4)).toEqual(expected);
  });

  it.each<[Collection, string, TokenType, TokenValue]>([
    ['Primitives Sizes', 'tracking/normal', 'string', '0%'],
    ['Primitives Shadows', 'shadow-shape/sm', 'string', '0 1px 2px'],
    ['Primitives Shadows', 'inset-shadow-shape/sm', 'string', 'inset 0 1px 2px'],
    ['Primitives Motions', 'easing/ease-in', 'string', 'cubic-bezier(0.4, 0, 1, 1)'],
    ['Primitives Motions', 'duration/100', 'number', 100],
  ])('keeps %s/%s out of unrelated fields', (collection, path, type, value) => {
    expect(scopes(collection, path, type, value)).toEqual([]);
  });

  it('requires a rule for an unknown primitive family or incompatible type', () => {
    expect(scopes('Primitives Sizes', 'mystery/4', 'number', 4)).toBe('unknown');
    expect(scopes('Primitives Sizes', 'size/1', 'string', '4')).toBe('unknown');
  });

  it('offers a colour role of Themes only through its copy in Surfaces', () => {
    expect(scopes('Themes', 'color/text/primary')).toEqual([]);
    expect(scopes('Themes', 'color/on-subtle/text/primary')).toEqual([]);
    expect(scopes('Surfaces', 'color/text/primary')).toEqual([
      'TEXT_FILL',
      'SHAPE_FILL',
      'STROKE_COLOR',
    ]);
    // Surfaces does not copy the shadow colours, so designers bind them in Themes.
    expect(scopes('Themes', 'color/shadow/default')).toEqual(['EFFECT_COLOR']);
  });

  it('offers a colour in the fields of the part it paints', () => {
    const cases: [string, FigmaScope[]][] = [
      ['color/background/default', ['FRAME_FILL', 'SHAPE_FILL']],
      ['color/border/default', ['STROKE_COLOR']],
      ['color/icon/default', ['SHAPE_FILL', 'STROKE_COLOR']],
      // The icons beside a text take its colour.
      ['color/link/hover', ['TEXT_FILL', 'SHAPE_FILL', 'STROKE_COLOR']],
      ['color/ring/default', ['STROKE_COLOR', 'EFFECT_COLOR']],
    ];
    for (const [path, expected] of cases) {
      expect(scopes('Surfaces', path), path).toEqual(expected);
    }
    expect(scopes('Components', 'color/checkbox/checked/mark/default')).toEqual([
      'SHAPE_FILL',
      'STROKE_COLOR',
    ]);
    expect(scopes('Components', 'color/button/primary/background/active')).toEqual([
      'FRAME_FILL',
      'SHAPE_FILL',
    ]);
    expect(scopes('Components', 'color/dialog/divider')).toEqual(['SHAPE_FILL', 'STROKE_COLOR']);
    // The indicator of a loader is a stroke or a filled shape, like an icon.
    expect(scopes('Components', 'color/loader/indicator')).toEqual(['SHAPE_FILL', 'STROKE_COLOR']);
  });

  it('offers a tone in every paint, and the content on a tone in text and icons', () => {
    const anyPaint = ['FRAME_FILL', 'SHAPE_FILL', 'STROKE_COLOR', 'TEXT_FILL'];
    expect(scopes('Surfaces', 'color/brand/primary/default')).toEqual(anyPaint);
    expect(scopes('Surfaces', 'color/action/primary/base/hover')).toEqual(anyPaint);
    expect(scopes('Surfaces', 'color/feedback/error/on-base')).toEqual([
      'TEXT_FILL',
      'SHAPE_FILL',
      'STROKE_COLOR',
    ]);
  });

  it('offers a number in the field its name sets', () => {
    const cases: [Collection, string, FigmaScope][] = [
      ['Sizes', 'typography/heading/h1/font-size', 'FONT_SIZE'],
      ['Sizes', 'typography/body/line-height', 'LINE_HEIGHT'],
      ['Themes', 'typography/body/font-weight-strong', 'FONT_WEIGHT'],
      ['Components', 'notification/letter-spacing', 'LETTER_SPACING'],
      ['Components', 'control/radius', 'CORNER_RADIUS'],
      ['Components', 'control/border/width', 'STROKE_FLOAT'],
      ['Themes', 'stroke/ring', 'STROKE_FLOAT'],
      ['Sizes', 'layout/padding/inline/md', 'GAP'],
      ['Sizes', 'layout/container/padding-inline', 'GAP'],
      ['Sizes', 'gap/sm', 'GAP'],
      ['Components', 'button/padding-inline', 'GAP'],
      ['Components', 'drawer/width', 'WIDTH_HEIGHT'],
      ['Sizes', 'icon/sm', 'WIDTH_HEIGHT'],
      ['Sizes', 'height/sm', 'WIDTH_HEIGHT'],
      ['Sizes', 'min-height/sm', 'WIDTH_HEIGHT'],
    ];
    for (const [collection, path, expected] of cases) {
      expect(scopes(collection, path, 'number', 0), path).toEqual([expected]);
    }
  });

  it('offers a font family for binding and keeps the text values Figma cannot bind in code', () => {
    expect(scopes('Themes', 'typography/body/font-family', 'string')).toEqual(['FONT_FAMILY']);
    expect(scopes('Themes', 'typography/body/letter-spacing', 'string')).toEqual([]);
    expect(scopes('Themes', 'shadow/elevation/1', 'string')).toEqual([]);
  });

  it('leaves the scopes of a boolean to Figma', () => {
    expect(scopes('Themes', 'text-uppercase/button', 'boolean', true)).toBe('fixed');
    expect(scopes('Themes', 'typography/caption/text-uppercase', 'boolean')).toBe('fixed');
    expect(scopes('Components', 'button/text-uppercase', 'boolean')).toBe('fixed');
  });

  it('knows no scopes for a name no rule describes', () => {
    expect(scopes('Components', 'button/mystery', 'number', 0)).toBe('unknown');
    expect(scopes('Components', 'color/button/primary/glow')).toBe('unknown');
    expect(scopes('Themes', 'typography/body/font-style', 'string')).toBe('unknown');
  });
});

describe('needsDescription', () => {
  it('asks for a description of every role, but not of the copies per surface', () => {
    const [role, copy, shadow] = color;
    expect(role && needsDescription(role, use)).toBe(true);
    expect(copy && needsDescription(copy, use)).toBe(false);
    expect(shadow && needsDescription(shadow, use)).toBe(true);
    for (const collection of ['Themes', 'Surfaces', 'Sizes'] as const) {
      expect(needsDescription(token(collection, 'gap/sm', 4, 'number'), use)).toBe(true);
    }
    expect(needsDescription(token('Components', 'button/gap', 4, 'number'), use)).toBe(false);
    expect(needsDescription(token('Primitives Sizes', 'spacing/4', 4, 'number'), use)).toBe(false);
  });
});

describe('variableMetadata', () => {
  it('lists the metadata of every variable and the names no rule knows', () => {
    const { variables, unknown } = variableMetadata([
      token('Themes', 'text-uppercase/button', { Light: true }, 'boolean'),
      token('Themes', 'radius/md', { Light: '{Primitives Sizes.radius.md}' }, 'number'),
      token('Components', 'button/mystery', 0, 'number'),
    ]);
    expect(variables).toEqual([
      {
        collection: 'Themes',
        name: 'text-uppercase/button',
        scopes: null,
        codeSyntax: { WEB: 'var(--text-uppercase-button)' },
        needsDescription: true,
      },
      {
        collection: 'Themes',
        name: 'radius/md',
        scopes: ['CORNER_RADIUS'],
        codeSyntax: { WEB: 'var(--shape-radius-md)' },
        needsDescription: true,
      },
    ]);
    expect(unknown).toEqual(['Components/button/mystery']);
  });

  it('knows every variable of the library', () => {
    const { variables, unknown } = variableMetadata(parseExports(readExports(EXPORTS_DIR)));
    expect(unknown).toEqual([]);
    expect(variables).toHaveLength(1372);
    expect(variables.filter((v) => v.scopes === null)).toHaveLength(12);
    expect(variables.filter((v) => v.scopes?.length === 0)).toHaveLength(341);
    expect(variables.filter((v) => v.needsDescription)).toHaveLength(283);
  });
});
