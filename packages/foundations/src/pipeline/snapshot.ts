import type { OutputFile } from './build.ts';
import { buildTsTree, type TsNode } from './emit-ts.ts';
import type { Token } from './model.ts';
import { normalizeSegment, toCamel } from './names.ts';

/**
 * The public names of the tokens, one per line with its kind: the context attributes
 * with their values, the classes of typography.css, the custom properties of tokens.css, the keys
 * of the Tailwind theme and the paths of `tokens.ts`. The committed snapshot turns every rename,
 * addition and removal into a visible line of the diff.
 */
export type NameKind = 'attr' | 'class' | 'css' | 'tailwind' | 'ts';

const DECLARATION = /^\s*(--[A-Za-z0-9-]+):/gm;
const CONTEXT_ATTRIBUTE = /\[data-(brand|theme|surface|density)="([^"]+)"\]/g;
/** A class of a text style, where its rule starts; the rules for `strong` inside it repeat it. */
const TEXT_STYLE_CLASS = /^\s*\.([A-Za-z0-9_-]+) \{/gm;

function declaredNames(css: string): Set<string> {
  return new Set([...css.matchAll(DECLARATION)].map((match) => match[1] ?? ''));
}

function leafPaths(node: TsNode, prefix: string): string[] {
  return Object.entries(node).flatMap(([key, value]) => {
    const path = `${prefix}.${toCamel(normalizeSegment(key))}`;
    return typeof value === 'string' ? [path] : leafPaths(value, path);
  });
}

function compare(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function tokenNames(
  files: Readonly<Record<OutputFile, string>>,
  tokens: readonly Token[],
): string[] {
  const css = files['tokens.css'];
  const named = (kind: NameKind, names: Iterable<string>) =>
    [...names].sort(compare).map((name) => `${kind} ${name}`);
  return [
    ...named(
      'attr',
      new Set(
        [...css.matchAll(CONTEXT_ATTRIBUTE)].map(
          ([, axis, value]) => `data-${axis ?? ''}=${value ?? ''}`,
        ),
      ),
    ),
    ...named(
      'class',
      new Set(
        [...files['typography.css'].matchAll(TEXT_STYLE_CLASS)].map((match) => match[1] ?? ''),
      ),
    ),
    ...named('css', declaredNames(css)),
    ...named('tailwind', declaredNames(files['tailwind.css'])),
    ...named('ts', leafPaths(buildTsTree(tokens), 'tokens')),
  ];
}

/** The lines added and removed between the committed snapshot and the current names. */
export function diffNames(
  committed: readonly string[],
  current: readonly string[],
): { added: string[]; removed: string[] } {
  const before = new Set(committed);
  const after = new Set(current);
  return {
    added: current.filter((name) => !before.has(name)),
    removed: committed.filter((name) => !after.has(name)),
  };
}
