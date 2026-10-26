import { defaultLabels, type UiCoreLabels } from '@mszczygiel-projects/ui-core-foundations/config';

const ACCENTED: Readonly<Record<string, string>> = {
  a: 'á',
  c: 'ç',
  d: 'ď',
  e: 'é',
  g: 'ĝ',
  i: 'î',
  l: 'ŀ',
  n: 'ñ',
  o: 'ô',
  s: 'š',
  u: 'ú',
  L: 'Ŀ',
};

/** A text of the pseudo-language: accented and bracketed, so that it shows where it comes from. */
export function pseudo(text: string): string {
  return `⟦${text.replace(/[a-z]/gi, (char) => ACCENTED[char] ?? char)}⟧`;
}

function pseudoLeaf(leaf: unknown): unknown {
  if (typeof leaf === 'string') {
    return pseudo(leaf);
  }
  if (typeof leaf === 'function') {
    return (...args: unknown[]): string => pseudo(String(Reflect.apply(leaf, undefined, args)));
  }
  return leaf;
}

/**
 * Every label in the pseudo-language, made from the English defaults. A contract renders its
 * component with them and checks that every text the component renders comes from the
 * configuration.
 */
export const pseudoLabels = Object.fromEntries(
  Object.entries(defaultLabels).map(([group, leaves]: [string, object]) => [
    group,
    Object.fromEntries(Object.entries(leaves).map(([key, leaf]) => [key, pseudoLeaf(leaf)])),
  ]),
) as unknown as UiCoreLabels;
