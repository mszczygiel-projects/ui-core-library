import { describe, expect, it } from 'vitest';

import { foldText, matchText, sameText } from './text.ts';

describe('foldText', () => {
  it('removes diacritics and lowercases', () => {
    expect(foldText('Żółw')).toBe('zolw');
    expect(foldText('Łódź')).toBe('lodz');
    expect(foldText('Crème brûlée')).toBe('creme brulee');
    expect(foldText('Ångström')).toBe('angstrom');
  });

  it('spells out the letters that Unicode keeps whole', () => {
    expect(foldText('Straße')).toBe('strasse');
    expect(foldText('STRAẞE')).toBe('strasse');
    expect(foldText('Ærø')).toBe('aero');
    expect(foldText('Œuvre')).toBe('oeuvre');
    expect(foldText('Øresund')).toBe('oresund');
    expect(foldText('Đakovo')).toBe('dakovo');
    expect(foldText('ısı')).toBe('isi');
    expect(foldText('Þór')).toBe('thor');
    expect(foldText('Guðrún')).toBe('gudrun');
    expect(foldText('ÐÓR')).toBe('dor');
    expect(foldText('Ħamrun')).toBe('hamrun');
  });

  it('writes the final sigma as a sigma', () => {
    expect(foldText('ΟΔΟΣ')).toBe('οδοσ');
    expect(foldText('οδός')).toBe('οδοσ');
  });

  it('turns ligatures and full-width letters into plain letters', () => {
    expect(foldText('ﬁlm')).toBe('film');
    expect(foldText('Ｗｉｄｅ')).toBe('wide');
    expect(foldText('ｶﾞｲﾄﾞ')).toBe('ガイド');
  });

  it('removes the diacritics of Latin, Greek, Cyrillic, Hebrew and Arabic letters', () => {
    expect(foldText('Việt Nam')).toBe('viet nam');
    expect(foldText('Οδός')).toBe('οδοσ');
    expect(foldText('Ёлка')).toBe('елка');
    expect(foldText('שָׁלוֹם')).toBe('שלום');
    expect(foldText('مُحَمَّد')).toBe('محمد');
  });

  it('keeps the marks that are part of a letter in other scripts', () => {
    expect(foldText('काम')).toBe('काम');
    expect(foldText('が')).toBe('が');
    expect(foldText('ไม่')).toBe('ไม่');
  });

  it('lowercases the same way whatever the locale, the Turkish capital İ included', () => {
    expect(foldText('İstanbul')).toBe('istanbul');
    expect(foldText('ISTANBUL')).toBe('istanbul');
  });
});

describe('matchText', () => {
  it('finds a query anywhere in the candidate, whatever its case and diacritics', () => {
    expect(matchText('Żółw błotny', 'zolw')).toBe(true);
    expect(matchText('Żółw błotny', 'BŁOTNY')).toBe(true);
    expect(matchText('Żółw błotny', 'olw b')).toBe(true);
    expect(matchText('Żółw błotny', 'kot')).toBe(false);
  });

  it('matches only at the start for typeahead', () => {
    expect(matchText('Łódź', 'lo', 'startsWith')).toBe(true);
    expect(matchText('Stara Łódź', 'lo', 'startsWith')).toBe(false);
    expect(matchText('Stara Łódź', 'lo')).toBe(true);
  });

  it('matches a query in Greek capitals that ends on a sigma', () => {
    expect(matchText('ΟΔΟΣ', 'οδοσ')).toBe(true);
    expect(matchText('Οδόστρωμα', 'ΟΔΟΣ', 'startsWith')).toBe(true);
  });

  it('tells apart the words that only a mark of their script tells apart', () => {
    expect(matchText('काम', 'कम')).toBe(false);
    expect(matchText('किताब', 'कतब')).toBe(false);
    expect(matchText('がっこう', 'か')).toBe(false);
    expect(matchText('ไม่', 'ไม้')).toBe(false);
  });

  it('treats a run of white space as one space', () => {
    expect(matchText('New  York', 'new york')).toBe(true);
    expect(matchText('New York', '  new   york ')).toBe(true);
    expect(matchText(' Łódź', 'lodz', 'startsWith')).toBe(true);
  });

  it('matches every candidate with an empty query', () => {
    expect(matchText('Żółw', '')).toBe(true);
    expect(matchText('Żółw', '   ')).toBe(true);
  });
});

describe('sameText', () => {
  it('compares whole texts without case, diacritics and extra spacing', () => {
    expect(sameText('Żółw  morski', ' zolw MORSKI')).toBe(true);
    expect(sameText('Żółw', 'Żółwie')).toBe(false);
  });
});
