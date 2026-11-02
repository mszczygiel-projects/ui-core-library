/**
 * The metadata every Figma variable carries besides its value: the scopes, the fields
 * that offer it for binding; the WEB code syntax, the name Dev Mode shows for it in code; and,
 * for a role, a description.
 */

import { type Collection, isPrimitiveCollection, type Token, tokenId } from './model.ts';
import { cssVarName, normalizedPath } from './names.ts';
import {
  baseModeOf,
  collectModes,
  isAlias,
  parseAlias,
  tokenKey,
  valuesByMode,
} from './resolve.ts';

/** The scopes the library uses, as the Plugin API names them. */
export type FigmaScope =
  | 'FRAME_FILL'
  | 'SHAPE_FILL'
  | 'TEXT_FILL'
  | 'STROKE_COLOR'
  | 'EFFECT_COLOR'
  | 'GAP'
  | 'WIDTH_HEIGHT'
  | 'CORNER_RADIUS'
  | 'STROKE_FLOAT'
  | 'FONT_FAMILY'
  | 'FONT_WEIGHT'
  | 'FONT_SIZE'
  | 'LINE_HEIGHT'
  | 'LETTER_SPACING';

/**
 * The scopes of a variable: a list, `fixed` for a boolean, whose scopes Figma does not let
 * anyone set, or `unknown` when no rule knows the variable's name.
 */
export type Scopes = readonly FigmaScope[] | 'fixed' | 'unknown';

/** The WEB code syntax of a variable: the `var()` of its custom property. */
export function webCodeSyntax(token: Token): string {
  return `var(${cssVarName(token.collection, token.path)})`;
}

/** How Surfaces uses the colour roles of Themes, which decides their scopes. */
export interface SurfaceUse {
  /** Themes variables that Surfaces aliases in its base mode: the roles it copies per surface. */
  readonly copiedRoles: ReadonlySet<string>;
  /** Themes variables that Surfaces aliases only in its other modes: the copies themselves. */
  readonly copies: ReadonlySet<string>;
}

function keyOf(token: Token): string {
  return tokenKey(token.collection, normalizedPath(token.path));
}

export function surfaceUse(tokens: readonly Token[]): SurfaceUse {
  const surfaces = tokens.filter((t) => t.collection === 'Surfaces');
  const baseMode = baseModeOf(collectModes(surfaces));
  const inBase = new Set<string>();
  const inOthers = new Set<string>();
  for (const surface of surfaces) {
    for (const { mode, raw } of valuesByMode(surface)) {
      const target = isAlias(raw) ? parseAlias(raw) : null;
      if (target?.collection !== 'Themes') {
        continue;
      }
      const key = tokenKey(target.collection, normalizedPath(target.path));
      (mode === null || mode === baseMode ? inBase : inOthers).add(key);
    }
  }
  return {
    copiedRoles: inBase,
    copies: new Set([...inOthers].filter((key) => !inBase.has(key))),
  };
}

const FILL: readonly FigmaScope[] = ['FRAME_FILL', 'SHAPE_FILL'];
const STROKE: readonly FigmaScope[] = ['STROKE_COLOR'];
const SHAPE: readonly FigmaScope[] = ['SHAPE_FILL', 'STROKE_COLOR'];
const CONTENT: readonly FigmaScope[] = ['TEXT_FILL', 'SHAPE_FILL', 'STROKE_COLOR'];
const ANY_PAINT: readonly FigmaScope[] = ['FRAME_FILL', 'SHAPE_FILL', 'STROKE_COLOR', 'TEXT_FILL'];

/**
 * What a colour paints, read from the last segment of its name that names a part. A tint is a
 * fill laid over another fill, and a backdrop the fill that covers the page behind a modal. A text
 * colour also paints the icons beside the text, drawn as strokes or filled shapes; a separator is a
 * stroke or a thin filled shape, and so is the indicator of a loader; a focus ring is a stroke or
 * a spread shadow.
 */
const COLOR_PARTS: readonly (readonly [parts: readonly string[], scopes: readonly FigmaScope[]])[] =
  [
    [
      ['background', 'label-background', 'fill', 'tint', 'track', 'thumb', 'grabber', 'backdrop'],
      FILL,
    ],
    [['text', 'label', 'placeholder', 'foreground', 'hint', 'meta', 'name', 'link'], CONTENT],
    [['border'], STROKE],
    [['separator', 'divider', 'icon', 'mark', 'dot', 'check', 'indicator'], SHAPE],
    [['ring'], ['STROKE_COLOR', 'EFFECT_COLOR']],
    [['shadow'], ['EFFECT_COLOR']],
  ];

/**
 * Colour roles that name a tone rather than a part, such as `brand/primary/default` or
 * `feedback/error/base`: they colour fills, text and strokes alike, and their `on-*` partners
 * colour the text and icons on top of them.
 */
const TONE_FAMILIES: ReadonlySet<string> = new Set(['brand', 'feedback', 'action']);

function colorScopes(path: readonly string[]): Scopes {
  for (const segment of [...path].reverse()) {
    for (const [parts, scopes] of COLOR_PARTS) {
      if (parts.includes(segment)) {
        return scopes;
      }
    }
  }
  if (path[0] === 'color' && TONE_FAMILIES.has(path[1] ?? '')) {
    return path.some((segment) => segment.startsWith('on-')) ? CONTENT : ANY_PAINT;
  }
  return 'unknown';
}

/** What a number sets, read from the segments of its name; the first rule that matches wins. */
const NUMBER_RULES: readonly (readonly [
  matches: (segment: string) => boolean,
  scopes: readonly FigmaScope[],
])[] = [
  [(s) => s === 'font-size', ['FONT_SIZE']],
  [(s) => s === 'line-height' || s.endsWith('-line-height'), ['LINE_HEIGHT']],
  [(s) => s.startsWith('font-weight'), ['FONT_WEIGHT']],
  [(s) => s === 'letter-spacing', ['LETTER_SPACING']],
  [(s) => s === 'radius', ['CORNER_RADIUS']],
  // A width under `border` or `stroke` is the width of a line, not of an element.
  [(s) => s === 'border' || s === 'stroke', ['STROKE_FLOAT']],
  [(s) => ['gap', 'inset', 'margin', 'offset'].includes(s) || s.startsWith('padding'), ['GAP']],
  [
    (s) =>
      ['size', 'min-size', 'icon', 'hit-area'].includes(s) ||
      s.endsWith('width') ||
      s.endsWith('height'),
    ['WIDTH_HEIGHT'],
  ],
];

function numberScopes(path: readonly string[]): Scopes {
  for (const [matches, scopes] of NUMBER_RULES) {
    if (path.some(matches)) {
      return scopes;
    }
  }
  return 'unknown';
}

/**
 * Text values that no Figma field can bind: tracking written as a percentage and a shadow. They
 * live in code only.
 */
function stringScopes(path: readonly string[]): Scopes {
  if (path.includes('font-family')) {
    return ['FONT_FAMILY'];
  }
  if (path.includes('letter-spacing') || path.includes('shadow')) {
    return [];
  }
  return 'unknown';
}

/**
 * The brand values of Themes that only feed roles: the fonts and the geometry of the focus ring
 *. The typography and stroke roles offer them to designers.
 */
function isBrandValue(token: Token): boolean {
  const family = normalizedPath(token.path)[0];
  return token.collection === 'Themes' && (family === 'font' || family === 'ring');
}

/** Primitives remain available for deliberate fixed values. */
function primitiveScopes(token: Token): Scopes {
  const path = normalizedPath(token.path);
  const family = path[0];
  if (token.collection === 'Primitives Colors' && token.type === 'color') {
    return [...ANY_PAINT, 'EFFECT_COLOR'];
  }
  if (token.collection === 'Primitives Sizes') {
    if (family === 'tracking' && token.type === 'string') {
      return [];
    }
    if (token.type !== 'number') {
      return 'unknown';
    }
    switch (family) {
      case 'spacing':
        return ['GAP', 'WIDTH_HEIGHT'];
      case 'size':
        return ['WIDTH_HEIGHT'];
      case 'radius':
        return ['CORNER_RADIUS'];
      case 'text':
        return path.some((s) => s.endsWith('-line-height')) ? ['LINE_HEIGHT'] : ['FONT_SIZE'];
      case 'font-weight':
        return ['FONT_WEIGHT'];
      case 'border-width':
        return ['STROKE_FLOAT'];
      case 'breakpoint':
        return [];
    }
  }
  if (token.collection === 'Primitives Shadows') {
    if (family === 'shadow-color' && token.type === 'color') {
      return ['EFFECT_COLOR'];
    }
    if ((family === 'shadow-shape' || family === 'inset-shadow-shape') && token.type === 'string') {
      return [];
    }
  }
  if (
    token.collection === 'Primitives Motions' &&
    ((family === 'easing' && token.type === 'string') ||
      (family === 'duration' && token.type === 'number'))
  ) {
    return [];
  }
  return 'unknown';
}

/**
 * The scopes of a variable. Primitives offer fixed values in their intended
 * fields. Brand inputs and the colour roles copied by Surfaces remain behind their aliases.
 */
export function scopesOf(token: Token, use: SurfaceUse): Scopes {
  if (token.type === 'boolean') {
    return 'fixed';
  }
  if (isPrimitiveCollection(token.collection)) {
    return primitiveScopes(token);
  }
  if (isBrandValue(token)) {
    return [];
  }
  const key = keyOf(token);
  if (token.collection === 'Themes' && (use.copiedRoles.has(key) || use.copies.has(key))) {
    return [];
  }
  const path = normalizedPath(token.path);
  switch (token.type) {
    case 'color':
      return colorScopes(path);
    case 'number':
      return numberScopes(path);
    case 'string':
      return stringScopes(path);
  }
}

const ROLE_COLLECTIONS: ReadonlySet<Collection> = new Set(['Themes', 'Surfaces', 'Sizes']);

/**
 * Every role and brand value has a description: each variable of Themes, Surfaces
 * and Sizes, except the copies of the colour roles per surface, which are machinery.
 */
export function needsDescription(token: Token, use: SurfaceUse): boolean {
  return ROLE_COLLECTIONS.has(token.collection) && !use.copies.has(keyOf(token));
}

/** The metadata a variable should have, as the Figma write and its control read use it. */
export interface VariableMetadata {
  readonly collection: Collection;
  /** The name of the variable in Figma. */
  readonly name: string;
  /** The scopes, or null for a boolean, whose scopes Figma keeps. */
  readonly scopes: readonly FigmaScope[] | null;
  readonly codeSyntax: { readonly WEB: string };
  readonly needsDescription: boolean;
}

/**
 * The metadata of every variable, and the variables no scope rule knows. A name the rules do
 * not know stops the plan, so that a new kind of token gets its rule on purpose.
 */
export function variableMetadata(tokens: readonly Token[]): {
  readonly variables: readonly VariableMetadata[];
  readonly unknown: readonly string[];
} {
  const use = surfaceUse(tokens);
  const variables: VariableMetadata[] = [];
  const unknown: string[] = [];
  for (const token of tokens) {
    const scopes = scopesOf(token, use);
    if (scopes === 'unknown') {
      unknown.push(tokenId(token.collection, token.path));
      continue;
    }
    variables.push({
      collection: token.collection,
      name: token.path.join('/'),
      scopes: scopes === 'fixed' ? null : scopes,
      codeSyntax: { WEB: webCodeSyntax(token) },
      needsDescription: needsDescription(token, use),
    });
  }
  return { variables, unknown };
}
