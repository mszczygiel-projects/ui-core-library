import { compositeShadows, type EmitWarning, GENERATED_NOTICE, valueToCss } from './emit-css.ts';
import type { TextStyle, TextStyleProperty } from './emit-typography.ts';
import {
  type Collection,
  isModeValues,
  type ModeValues,
  type Primitive,
  type Token,
  type TokenType,
} from './model.ts';
import { BASE_DENSITY, BASE_SCREEN, sizesModeParts, themeModeParts } from './modes.ts';
import { cssVarName, modeSlug, normalizedPath } from './names.ts';
import {
  aliasTarget,
  baseModeOf,
  collectModes,
  findFontSizePair,
  isAlias,
  type Registry,
  tokenKey,
  valuesByMode,
} from './resolve.ts';
import { cleanNumber, pathCategory, toRem } from './values.ts';

/**
 * What a token's value can change with: a further brand, the theme, the surface and the density
 * are attributes, and the size is the media query of the breakpoint. Themes holds the brand and
 * the theme, Sizes the size and the density.
 */
export const MANIFEST_AXES = ['brand', 'theme', 'surface', 'density', 'size'] as const;

export type ManifestAxis = (typeof MANIFEST_AXES)[number];

const AXES_OF: Readonly<Partial<Record<Collection, readonly ManifestAxis[]>>> = {
  Themes: ['brand', 'theme'],
  Surfaces: ['surface'],
  Sizes: ['size', 'density'],
};

/** The value of the brand axis for the base brand, which sets no attribute. */
const BASE_BRAND = 'default';

/** One value of a token, in the modes of the axes it changes with. */
export interface ManifestValue {
  /** The mode of each of the token's axes, as its attribute writes it: `{ theme: 'dark' }`. */
  readonly context: Readonly<Partial<Record<ManifestAxis, string>>>;
  /** The value as tokens.css declares it at the end of the alias chain: `#1a3056`, `1rem`. */
  readonly value: string;
  /** The value of the variable at the end of the alias chain, as Figma holds it: `16`. */
  readonly raw: Primitive;
  /** The first custom property with another name that the token points at. */
  readonly alias?: string;
}

export interface ManifestToken {
  /** The custom property: `--color-text-primary`. */
  readonly name: string;
  /** The collection of the variable that declares it last, which decides its value. */
  readonly collection: Collection;
  /** The variable's path in Figma: `color/text/primary`. */
  readonly path: string;
  readonly kind: TokenType;
  readonly description?: string;
  /** Hidden from publishing in Figma, such as the copies of the colour roles per surface. */
  readonly hidden?: true;
  /** The axes along which its value changes; none for a constant. */
  readonly axes: readonly ManifestAxis[];
  /** One value per combination of the modes of its axes, base modes first. */
  readonly values: readonly ManifestValue[];
}

export interface ManifestTextStyle {
  /** The path of its group under `typography/`: `heading/h1`. */
  readonly name: string;
  readonly className: string;
  /** The custom property behind each property the class sets. */
  readonly properties: Readonly<Partial<Record<TextStyleProperty, string>>>;
  /** The custom property with the weight of `strong` and `b` inside the style. */
  readonly strongWeight?: string;
}

export interface ManifestShadow {
  readonly name: string;
  /** The custom properties of the shape and of the colour it combines. */
  readonly shape: string;
  readonly color: string;
  /** The shadow as the browser reads it once both are substituted. */
  readonly value: string;
}

/**
 * tokens.json: every custom property of tokens.css with its description and its values in every
 * context where it changes, the modes of the context attributes, the text styles and the
 * composite shadows. Documentation and tools read it instead of parsing the stylesheet.
 */
export interface TokenManifest {
  readonly $comment: string;
  /** The modes of each axis, as the attribute writes them, the base mode first. */
  readonly modes: Readonly<Record<ManifestAxis, readonly string[]>>;
  /** The width from which the Desktop sizes apply. */
  readonly breakpoint: string;
  readonly textStyles: readonly ManifestTextStyle[];
  readonly shadows: readonly ManifestShadow[];
  readonly tokens: readonly ManifestToken[];
}

/** Collections that declare a shared name later win it, as the scopes of tokens.css do. */
const PRECEDENCE: readonly Collection[] = ['Components', 'Surfaces', 'Themes'];

interface Axes {
  /** The values of each axis with more than one, as the attributes write them, the base first. */
  readonly modes: ReadonlyMap<ManifestAxis, readonly string[]>;
  /** The Figma modes of each collection with modes, the base mode first. */
  readonly figmaModes: ReadonlyMap<Collection, readonly string[]>;
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function readAxes(tokens: readonly Token[]): Axes {
  const figmaModes = new Map<Collection, readonly string[]>();
  for (const collection of Object.keys(AXES_OF) as Collection[]) {
    const found = collectModes(tokens.filter((t) => t.collection === collection));
    const baseMode = baseModeOf(found);
    if (baseMode !== null) {
      figmaModes.set(collection, [baseMode, ...found.filter((mode) => mode !== baseMode)]);
    }
  }
  const themes = (figmaModes.get('Themes') ?? []).map(themeModeParts);
  const sizes = (figmaModes.get('Sizes') ?? []).map(sizesModeParts);
  const candidates: Record<ManifestAxis, string[]> = {
    brand: unique([BASE_BRAND, ...themes.map((t) => t.brand ?? BASE_BRAND)]),
    theme: unique(themes.map((t) => t.scheme ?? 'light')),
    surface: (figmaModes.get('Surfaces') ?? []).map(modeSlug),
    density: unique(sizes.map((s) => s.density ?? BASE_DENSITY)),
    size: unique(
      [...sizes.map((s) => s.screen)].sort((a, b) =>
        a === BASE_SCREEN ? -1 : b === BASE_SCREEN ? 1 : 0,
      ),
    ),
  };
  const modes = new Map<ManifestAxis, readonly string[]>();
  for (const axis of MANIFEST_AXES) {
    if (candidates[axis].length > 1) {
      modes.set(axis, candidates[axis]);
    }
  }
  return { modes, figmaModes };
}

/** The Figma mode of a collection in a context; the base mode for an axis the context leaves out. */
function modeOf(
  collection: Collection,
  context: ReadonlyMap<ManifestAxis, string>,
  axes: Axes,
): string | undefined {
  const modes = axes.figmaModes.get(collection) ?? [];
  const base = modes[0];
  switch (collection) {
    case 'Themes': {
      const brand = context.get('brand') ?? BASE_BRAND;
      const theme = context.get('theme') ?? axes.modes.get('theme')?.[0] ?? 'light';
      return (
        modes.find((mode) => {
          const parts = themeModeParts(mode);
          return (parts.brand ?? BASE_BRAND) === brand && (parts.scheme ?? 'light') === theme;
        }) ?? base
      );
    }
    case 'Surfaces': {
      const surface = context.get('surface');
      return modes.find((mode) => modeSlug(mode) === surface) ?? base;
    }
    case 'Sizes': {
      const size = context.get('size') ?? BASE_SCREEN;
      const density = context.get('density') ?? BASE_DENSITY;
      return (
        modes.find((mode) => {
          const parts = sizesModeParts(mode);
          return parts.screen === size && (parts.density ?? BASE_DENSITY) === density;
        }) ?? base
      );
    }
    default:
      return base;
  }
}

interface Hop {
  readonly token: Token;
  readonly mode: string | null;
  readonly raw: Primitive;
}

/** The token's alias chain in one context: each variable it passes and the value it reads there. */
function chainIn(
  token: Token,
  context: ReadonlyMap<ManifestAxis, string>,
  axes: Axes,
  registry: Registry,
): Hop[] {
  const hops: Hop[] = [];
  const seen = new Set<string>();
  for (let current: Token | undefined = token; current !== undefined;) {
    const key = tokenKey(current.collection, normalizedPath(current.path));
    if (seen.has(key)) {
      break;
    }
    seen.add(key);
    let mode: string | null = null;
    let raw: Primitive | undefined;
    if (isModeValues(current.value)) {
      const values: ModeValues = current.value;
      const wanted = modeOf(current.collection, context, axes);
      mode = (wanted !== undefined && wanted in values ? wanted : Object.keys(values)[0]) ?? null;
      raw = mode === null ? undefined : values[mode];
    } else {
      raw = current.value;
    }
    if (raw === undefined) {
      break;
    }
    hops.push({ token: current, mode, raw });
    current = isAlias(raw) ? aliasTarget(raw, registry) : undefined;
  }
  return hops;
}

/** The axes a token's chain reaches in any of its modes. */
function reachedAxes(
  token: Token,
  axes: Axes,
  registry: Registry,
  seen = new Set<string>(),
): Set<ManifestAxis> {
  const reached = new Set<ManifestAxis>();
  const key = tokenKey(token.collection, normalizedPath(token.path));
  if (seen.has(key)) {
    return reached;
  }
  seen.add(key);
  if (isModeValues(token.value)) {
    for (const own of AXES_OF[token.collection] ?? []) {
      if (axes.modes.has(own)) {
        reached.add(own);
      }
    }
  }
  for (const { raw } of valuesByMode(token)) {
    const target = isAlias(raw) ? aliasTarget(raw, registry) : undefined;
    if (target !== undefined) {
      for (const axis of reachedAxes(target, axes, registry, seen)) {
        reached.add(axis);
      }
    }
  }
  const pair = findFontSizePair(token, registry);
  if (pair !== null) {
    for (const axis of reachedAxes(pair, axes, registry, seen)) {
      reached.add(axis);
    }
  }
  return reached;
}

/** Every combination of the modes of the axes, in the order of the axes and of their modes. */
function contexts(of: readonly ManifestAxis[], axes: Axes): ReadonlyMap<ManifestAxis, string>[] {
  let combinations: Map<ManifestAxis, string>[] = [new Map<ManifestAxis, string>()];
  for (const axis of of) {
    const modes = axes.modes.get(axis) ?? [];
    combinations = combinations.flatMap((combination) =>
      modes.map((mode) => new Map<ManifestAxis, string>(combination).set(axis, mode)),
    );
  }
  return combinations;
}

interface Resolved {
  readonly value: string;
  readonly raw: Primitive;
  readonly alias?: string;
}

function resolveIn(
  token: Token,
  name: string,
  context: ReadonlyMap<ManifestAxis, string>,
  axes: Axes,
  registry: Registry,
): Resolved {
  const hops = chainIn(token, context, axes, registry);
  const end = hops[hops.length - 1];
  if (end === undefined) {
    return { value: 'initial', raw: '' };
  }
  // The CSS emitter already reports anything odd about a value, such as an unpaired line height.
  const warnings: EmitWarning[] = [];
  let value = valueToCss(end.token, end.raw, end.mode, registry, warnings);
  if (pathCategory(token.path) === 'line-height' && typeof end.raw === 'number') {
    const pair = findFontSizePair(token, registry);
    const pairHops = pair === null ? [] : chainIn(pair, context, axes, registry);
    const fontSize = pairHops[pairHops.length - 1]?.raw ?? 16;
    value =
      typeof fontSize === 'number' && fontSize > 0 && end.raw !== 0
        ? `calc(${cleanNumber(end.raw / 16)} / ${cleanNumber(fontSize / 16)})`
        : '0';
  }
  const alias = hops
    .slice(1)
    .map((hop) => cssVarName(hop.token.collection, hop.token.path))
    .find((hopName) => hopName !== name);
  return { value, raw: end.raw, ...(alias === undefined ? {} : { alias }) };
}

function contextKey(context: ReadonlyMap<ManifestAxis, string>, without?: ManifestAxis): string {
  return MANIFEST_AXES.filter((axis) => axis !== without)
    .map((axis) => `${axis}=${context.get(axis) ?? ''}`)
    .join(',');
}

/** The axes along which at least one value differs; the rest change nothing for this token. */
function varyingAxes(
  reached: readonly ManifestAxis[],
  results: ReadonlyMap<string, Resolved>,
  all: readonly ReadonlyMap<ManifestAxis, string>[],
): ManifestAxis[] {
  return reached.filter((axis) => {
    const seen = new Map<string, string>();
    for (const context of all) {
      const value = results.get(contextKey(context))?.value ?? '';
      const rest = contextKey(context, axis);
      const first = seen.get(rest);
      if (first === undefined) {
        seen.set(rest, value);
      } else if (first !== value) {
        return true;
      }
    }
    return false;
  });
}

function manifestToken(
  token: Token,
  sibling: Token | undefined,
  axes: Axes,
  registry: Registry,
): ManifestToken {
  const name = cssVarName(token.collection, token.path);
  const reachedSet = reachedAxes(token, axes, registry);
  const reached = MANIFEST_AXES.filter((axis) => reachedSet.has(axis));
  const all = contexts(reached, axes);
  const results = new Map<string, Resolved>();
  for (const context of all) {
    results.set(contextKey(context), resolveIn(token, name, context, axes, registry));
  }
  const varying = varyingAxes(reached, results, all);
  // An axis that changes nothing falls back to its base mode, where the value is the same.
  const values: ManifestValue[] = contexts(varying, axes).map((context) => {
    const resolved = resolveIn(token, name, context, axes, registry);
    const slugs: Partial<Record<ManifestAxis, string>> = {};
    for (const [axis, mode] of context) {
      slugs[axis] = mode;
    }
    return { context: slugs, ...resolved };
  });
  const description = token.description ?? sibling?.description;
  return {
    name,
    collection: token.collection,
    path: token.path.join('/'),
    kind: token.type,
    ...(description === undefined ? {} : { description }),
    ...(token.figma?.hiddenFromPublishing === true ? { hidden: true } : {}),
    axes: varying,
    values,
  };
}

export interface ManifestOptions {
  /** The width, in pixels, from which the Desktop values of Sizes apply. */
  readonly breakpointPx: number;
}

export function buildManifest(
  tokens: readonly Token[],
  registry: Registry,
  styles: readonly TextStyle[],
  options: ManifestOptions,
): TokenManifest {
  const axes = readAxes(tokens);
  const byName = new Map<string, Token[]>();
  for (const token of tokens) {
    const name = cssVarName(token.collection, token.path);
    byName.set(name, [...(byName.get(name) ?? []), token]);
  }
  const rank = (token: Token) => {
    const index = PRECEDENCE.indexOf(token.collection);
    return index === -1 ? PRECEDENCE.length : index;
  };

  const entries: ManifestToken[] = [];
  const emitted = new Set<string>();
  for (const token of tokens) {
    const name = cssVarName(token.collection, token.path);
    if (emitted.has(name)) {
      continue;
    }
    emitted.add(name);
    const [winner, sibling] = [...(byName.get(name) ?? [token])].sort((a, b) => rank(a) - rank(b));
    entries.push(manifestToken(winner ?? token, sibling, axes, registry));
  }

  const rawOf = (name: string) => {
    const entry = entries.find((candidate) => candidate.name === name);
    return entry?.values[0]?.value ?? `var(${name})`;
  };
  const slugsOf = (axis: ManifestAxis) => [...(axes.modes.get(axis) ?? [])];
  return {
    $comment: GENERATED_NOTICE,
    modes: {
      brand: slugsOf('brand'),
      theme: slugsOf('theme'),
      surface: slugsOf('surface'),
      density: slugsOf('density'),
      size: slugsOf('size'),
    },
    breakpoint: toRem(options.breakpointPx),
    textStyles: styles.map((style) => ({
      name: style.path.join('/'),
      className: style.className,
      properties: style.properties,
      ...(style.strongWeight === undefined ? {} : { strongWeight: style.strongWeight }),
    })),
    shadows: compositeShadows().map((shadow) => ({
      ...shadow,
      value: `${rawOf(shadow.shape)} ${rawOf(shadow.color)}`,
    })),
    tokens: entries,
  };
}

export function emitTokensJson(manifest: TokenManifest): string {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}
