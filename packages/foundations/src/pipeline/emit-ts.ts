import { GENERATED_NOTICE } from './emit-css.ts';
import { isPrimitiveCollection, type Token } from './model.ts';
import { cssVarName, normalizedPath, normalizeSegment, tsKey } from './names.ts';

/** A tree of token references: groups are objects, leaves are `var(--…)` strings. */
export interface TsNode {
  [key: string]: TsNode | string;
}

/**
 * The semantic tokens as a tree, keyed by collection. Semantic collections share CSS names, so a
 * path is published once, from its most specific collection: Components over Surfaces over
 * Themes. Primitives stay out; consumers should reach for roles.
 */
export function buildTsTree(tokens: readonly Token[]): TsNode {
  const pathsIn = (collection: string) =>
    new Set(
      tokens
        .filter((t) => t.collection === collection)
        .map((t) => normalizedPath(t.path).join('.')),
    );
  const surfacePaths = pathsIn('Surfaces');
  const componentPaths = pathsIn('Components');

  const root: TsNode = {};
  for (const token of tokens) {
    if (isPrimitiveCollection(token.collection)) {
      continue;
    }
    const path = normalizedPath(token.path).join('.');
    if (
      (token.collection === 'Themes' && (surfacePaths.has(path) || componentPaths.has(path))) ||
      (token.collection === 'Surfaces' && componentPaths.has(path))
    ) {
      continue;
    }

    const segments = [token.collection.toLowerCase(), ...token.path.map(normalizeSegment)];
    const leaf = segments.pop();
    if (leaf === undefined) {
      continue;
    }
    let cursor = root;
    for (const segment of segments) {
      const child = cursor[segment];
      if (typeof child === 'object') {
        cursor = child;
      } else {
        const group: TsNode = {};
        cursor[segment] = group;
        cursor = group;
      }
    }
    cursor[leaf] = `var(${cssVarName(token.collection, token.path)})`;
  }
  return root;
}

function serialize(node: TsNode, depth: number): string {
  const keys = Object.keys(node);
  if (keys.length === 0) {
    return '{}';
  }
  const indent = '  '.repeat(depth);
  const inner = '  '.repeat(depth + 1);
  const lines = ['{'];
  for (const key of keys) {
    const value = node[key];
    if (value === undefined) {
      continue;
    }
    lines.push(
      typeof value === 'string'
        ? `${inner}${tsKey(key)}: '${value}',`
        : `${inner}${tsKey(key)}: ${serialize(value, depth + 1)},`,
    );
  }
  lines.push(`${indent}}`);
  return lines.join('\n');
}

/** tokens.ts: the tree as a typed constant, with the union of its values as `TokenKey`. */
export function emitTokensTs(tokens: readonly Token[]): string {
  return (
    `// ${GENERATED_NOTICE}\n\n` +
    `export const tokens = ${serialize(buildTsTree(tokens), 0)} as const;\n\n` +
    `export type Tokens = typeof tokens;\n` +
    `type DeepValues<T> = T extends Record<string, unknown> ? DeepValues<T[keyof T]> : T;\n` +
    `export type TokenKey = DeepValues<Tokens>;\n`
  );
}
