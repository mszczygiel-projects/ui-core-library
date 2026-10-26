import { type Collection, COLLECTIONS, isModeValues, type Primitive, type Token } from './model.ts';
import { normalizedPath } from './names.ts';

/** Every token, keyed by `tokenKey` of its collection and normalized path. */
export type Registry = ReadonlyMap<string, Token>;

export function tokenKey(collection: Collection, path: readonly string[]): string {
  return `${collection}::${path.join('.')}`;
}

export function buildRegistry(tokens: readonly Token[]): Map<string, Token> {
  const registry = new Map<string, Token>();
  for (const token of tokens) {
    registry.set(tokenKey(token.collection, normalizedPath(token.path)), token);
  }
  return registry;
}

export function isAlias(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('{') && value.endsWith('}');
}

export interface AliasTarget {
  readonly collection: Collection;
  /** The path as the alias writes it, before normalization. */
  readonly path: string[];
}

/** `{Primitives Colors.brand.500}` → the collection and the path; null for an unknown collection. */
export function parseAlias(alias: string): AliasTarget | null {
  const inner = alias.slice(1, -1);
  for (const collection of COLLECTIONS) {
    if (inner === collection) {
      return { collection, path: [] };
    }
    if (inner.startsWith(`${collection}.`)) {
      return { collection, path: inner.slice(collection.length + 1).split('.') };
    }
  }
  return null;
}

/** The token an alias points at, if the alias is valid and the token exists. */
export function aliasTarget(alias: string, registry: Registry): Token | undefined {
  const target = parseAlias(alias);
  return target === null
    ? undefined
    : registry.get(tokenKey(target.collection, normalizedPath(target.path)));
}

/** The token's values with their modes; a token without modes has one value and mode `null`. */
export function valuesByMode(token: Token): { mode: string | null; raw: Primitive }[] {
  if (isModeValues(token.value)) {
    return Object.entries(token.value).map(([mode, raw]) => ({ mode, raw }));
  }
  return [{ mode: null, raw: token.value }];
}

/** Every mode used by the tokens, in first-seen order. */
export function collectModes(tokens: readonly Token[]): string[] {
  const modes = new Set<string>();
  for (const token of tokens) {
    if (isModeValues(token.value)) {
      for (const mode of Object.keys(token.value)) {
        modes.add(mode);
      }
    }
  }
  return [...modes];
}

/** The mode emitted on `:root`: `Default` or `Light` when there is one, otherwise the first. */
export function baseModeOf(modes: readonly string[]): string | null {
  return modes.find((mode) => mode === 'Default' || mode === 'Light') ?? modes[0] ?? null;
}

/** The token's value in `mode`, falling back to the base mode and then to its first value. */
export function rawForMode(token: Token, mode: string, baseMode: string): Primitive {
  if (!isModeValues(token.value)) {
    return token.value;
  }
  const first = Object.values(token.value)[0];
  const value = token.value[mode] ?? token.value[baseMode] ?? first;
  if (value === undefined) {
    throw new Error(`${token.collection}/${token.path.join('/')} has no value in any mode`);
  }
  return value;
}

/**
 * The number a token resolves to in `mode`, following aliases. An alias into a collection
 * without that mode reads the target's first mode.
 */
export function resolveNumber(
  token: Token,
  mode: string | null,
  registry: Registry,
  visited = new Set<string>(),
): number | null {
  const value = rawForMode(token, mode ?? '', '');
  if (typeof value === 'number') {
    return value;
  }
  if (!isAlias(value)) {
    return null;
  }
  const target = aliasTarget(value, registry);
  if (target === undefined) {
    return null;
  }
  const key = tokenKey(target.collection, target.path);
  if (visited.has(key)) {
    return null;
  }
  visited.add(key);
  return resolveNumber(target, mode, registry, visited);
}

/**
 * Does the token's alias chain reach `collection` in any mode? Component dimensions that do
 * are repeated in every density scope; repeating the others would only add identical
 * declarations, since a dimension that never reaches Density cannot change with it.
 */
export function dependsOnCollection(
  token: Token,
  collection: Collection,
  registry: Registry,
  seen = new Set<string>(),
): boolean {
  const key = tokenKey(token.collection, token.path);
  if (seen.has(key)) {
    return false;
  }
  seen.add(key);
  for (const { raw } of valuesByMode(token)) {
    if (!isAlias(raw)) {
      continue;
    }
    const target = parseAlias(raw);
    if (target === null) {
      continue;
    }
    if (target.collection === collection) {
      return true;
    }
    const next = registry.get(tokenKey(target.collection, normalizedPath(target.path)));
    if (next !== undefined && dependsOnCollection(next, collection, registry, seen)) {
      return true;
    }
  }
  return false;
}

/**
 * The font size a line height belongs to: `text/sm--line-height` pairs with `text/sm`, and
 * `…/line-height` with the `…/font-size` beside it.
 */
export function findFontSizePair(token: Token, registry: Registry): Token | null {
  const path = normalizedPath(token.path);
  const last = path[path.length - 1];
  if (last === undefined) {
    return null;
  }
  let pair: string[] | null = null;
  if (last === 'line-height') {
    pair = [...path.slice(0, -1), 'font-size'];
  } else if (last.endsWith('-line-height')) {
    pair = [...path.slice(0, -1), last.slice(0, -'-line-height'.length)];
  }
  return pair === null ? null : (registry.get(tokenKey(token.collection, pair)) ?? null);
}

/** Alias cycles, each written as the chain of tokens that closes it. */
export function findCycles(tokens: readonly Token[], registry: Registry): string[] {
  const state = new Map<string, 'visiting' | 'done'>();
  const cycles: string[] = [];

  const visit = (key: string, stack: readonly string[]): void => {
    state.set(key, 'visiting');
    const token = registry.get(key);
    for (const { raw } of token === undefined ? [] : valuesByMode(token)) {
      if (!isAlias(raw)) {
        continue;
      }
      const target = parseAlias(raw);
      if (target === null) {
        continue;
      }
      const next = tokenKey(target.collection, normalizedPath(target.path));
      if (!registry.has(next)) {
        continue;
      }
      if (state.get(next) === 'visiting') {
        const chain = [...stack.slice(stack.indexOf(next)), next];
        cycles.push(chain.map((k) => k.replace('::', '/').replaceAll('.', '/')).join(' → '));
      } else if (!state.has(next)) {
        visit(next, [...stack, next]);
      }
    }
    state.set(key, 'done');
  };

  for (const token of tokens) {
    const key = tokenKey(token.collection, normalizedPath(token.path));
    if (!state.has(key)) {
      visit(key, [key]);
    }
  }
  return cycles;
}
