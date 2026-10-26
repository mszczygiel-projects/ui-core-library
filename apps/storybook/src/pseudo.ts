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

function pseudo(text: string): string {
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
 * Every label in a pseudo-language, made from the English defaults, for the language toolbar: a
 * text that stays in English with it on was written into a component.
 */
export const pseudoLabels = Object.fromEntries(
  Object.entries(defaultLabels).map(([group, leaves]: [string, object]) => [
    group,
    Object.fromEntries(Object.entries(leaves).map(([key, leaf]) => [key, pseudoLeaf(leaf)])),
  ]),
) as unknown as UiCoreLabels;
