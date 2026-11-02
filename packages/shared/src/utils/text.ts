/**
 * Text matching for filters and typeahead that ignores case and diacritics, so that a query
 * `zolw` finds `Żółw` and `strasse` finds `Straße`.
 */

/** Where a query has to match: anywhere in the candidate, or at its start. */
export type MatchMode = 'contains' | 'startsWith';

/**
 * Letters that Unicode does not split into a base letter and marks, spelled as a search types them,
 * and the final sigma: lowercasing writes a capital sigma at the end of a word as `ς`, so a query
 * in capitals would miss the `σ` of a longer word.
 */
const UNSPLIT_LETTERS: Readonly<Record<string, string>> = {
  ł: 'l',
  ß: 'ss',
  æ: 'ae',
  œ: 'oe',
  ø: 'o',
  đ: 'd',
  ð: 'd',
  ħ: 'h',
  ı: 'i',
  þ: 'th',
  ς: 'σ',
};
const UNSPLIT_LETTER = new RegExp(`[${Object.keys(UNSPLIT_LETTERS).join('')}]`, 'gu');

// The marks on Latin, Greek, Cyrillic, Hebrew and Arabic letters are diacritics that a search
// ignores. In other scripts, such as Devanagari, Thai or Japanese kana, a mark is part of the
// letter: काम and कम are different words.
const DIACRITIC =
  /(?<=[\p{Script=Latin}\p{Script=Greek}\p{Script=Cyrillic}\p{Script=Hebrew}\p{Script=Arabic}]\p{M}*)\p{M}/gu;

/**
 * Text folded for matching. Compatibility forms such as ligatures and full-width letters become
 * plain letters, diacritics go, the letters that Unicode keeps whole are spelled out, and the
 * text is lowercased the same way on every machine, whatever its locale. The marks that are part
 * of a letter stay, composed with it again, so that `か` does not find `が`.
 */
export function foldText(text: string): string {
  return text
    .normalize('NFKD')
    .replace(DIACRITIC, '')
    .normalize('NFC')
    .toLowerCase()
    .replace(UNSPLIT_LETTER, (letter) => UNSPLIT_LETTERS[letter] ?? letter);
}

function normalized(text: string): string {
  return foldText(text).replace(/\s+/gu, ' ').trim();
}

/**
 * Whether `candidate` matches `query`, ignoring case, diacritics and runs of white space.
 * `contains` looks anywhere in the candidate, as a filter does, and `startsWith` at its start, as
 * typeahead does. An empty query matches every candidate.
 */
export function matchText(candidate: string, query: string, mode: MatchMode = 'contains'): boolean {
  const needle = normalized(query);
  if (needle === '') {
    return true;
  }
  const haystack = normalized(candidate);
  return mode === 'startsWith' ? haystack.startsWith(needle) : haystack.includes(needle);
}

/** Whether two texts are the same, ignoring case, diacritics and runs of white space. */
export function sameText(first: string, second: string): boolean {
  return normalized(first) === normalized(second);
}
