import { describe, expect, it } from 'vitest';

import { resolveLocale } from './locale.ts';

describe('resolveLocale', () => {
  it('gives the first valid language tag, in its canonical form', () => {
    expect(resolveLocale('pl-pl')).toBe('pl-PL');
    expect(resolveLocale(undefined, null, '', 'de-de', 'fr')).toBe('de-DE');
  });

  it('skips what is not a language tag', () => {
    expect(resolveLocale('not a locale', 'en-GB')).toBe('en-GB');
  });

  it('skips a language the runtime has no data for', () => {
    expect(resolveLocale('zz', 'pl')).toBe('pl');
    expect(resolveLocale('und', 'de-de')).toBe('de-DE');
    expect(resolveLocale('po')).toBe('en-US');
  });

  it('keeps a tag whose language has data, whatever its region and script', () => {
    expect(resolveLocale('en-ZZ')).toBe('en-ZZ');
    expect(resolveLocale('sr-latn-rs')).toBe('sr-Latn-RS');
  });

  it('falls back to en-US', () => {
    expect(resolveLocale()).toBe('en-US');
    expect(resolveLocale(undefined, '', 'not a locale')).toBe('en-US');
  });
});
