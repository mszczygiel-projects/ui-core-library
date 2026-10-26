/**
 * The model of the Figma variables the pipeline reads: one token per variable, holding either a
 * single value or one value per mode of its collection. A value is raw (`#fff`, `16`) or an alias
 * to another variable (`{Primitives Sizes.spacing.4}`).
 */

/** The `$type` of a design token, as the export writes it. */
export type TokenType = 'color' | 'number' | 'string' | 'boolean';

const TOKEN_TYPES: ReadonlySet<string> = new Set<TokenType>([
  'color',
  'number',
  'string',
  'boolean',
]);

export function isTokenType(value: unknown): value is TokenType {
  return typeof value === 'string' && TOKEN_TYPES.has(value);
}

/** A raw value or an alias written as `{Collection.path.to.variable}`. */
export type Primitive = string | number | boolean;

/** One value per Figma mode, keyed by the mode's name. */
export type ModeValues = Readonly<Record<string, Primitive>>;

export type TokenValue = Primitive | ModeValues;

/** The Figma collections, in the order the pipeline reads and emits them. */
export const COLLECTIONS = [
  'Primitives Colors',
  'Primitives Sizes',
  'Primitives Motions',
  'Primitives Shadows',
  'Themes',
  'Surfaces',
  'Components',
  'Sizes',
] as const;

export type Collection = (typeof COLLECTIONS)[number];

/** The collections of raw values. Every other collection is a semantic layer above them. */
export const PRIMITIVE_COLLECTIONS: readonly Collection[] = [
  'Primitives Colors',
  'Primitives Sizes',
  'Primitives Motions',
  'Primitives Shadows',
];

export function isPrimitiveCollection(collection: Collection): boolean {
  return PRIMITIVE_COLLECTIONS.includes(collection);
}

/**
 * What Figma keeps about a variable besides its value, as the export writes it under
 * `$extensions["com.figma"]`: the fields that offer it for binding, the names Dev Mode shows
 * for it in code and whether the library publishes it.
 */
export interface FigmaMetadata {
  readonly scopes: readonly string[];
  /** The code syntax per platform: `WEB`, `ANDROID` or `iOS`. */
  readonly codeSyntax: Readonly<Record<string, string>>;
  readonly hiddenFromPublishing: boolean;
}

export interface Token {
  readonly collection: Collection;
  readonly path: readonly string[];
  readonly type: TokenType;
  readonly value: TokenValue;
  readonly description?: string;
  /** Present when the export was made with the Figma metadata of its variables. */
  readonly figma?: FigmaMetadata;
}

export function isModeValues(value: TokenValue): value is ModeValues {
  return typeof value === 'object';
}

/** How diagnostics name a token: its collection and its path as Figma writes it. */
export function tokenId(collection: Collection, path: readonly string[]): string {
  return `${collection}/${path.join('/')}`;
}
