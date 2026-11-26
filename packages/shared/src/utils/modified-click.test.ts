import { describe, expect, it } from 'vitest';

import { isModifiedClick } from './modified-click.ts';

const PLAIN = { metaKey: false, ctrlKey: false, shiftKey: false, altKey: false };

describe('isModifiedClick', () => {
  it('is false for a plain click', () => {
    expect(isModifiedClick(PLAIN)).toBe(false);
  });

  it.each(['metaKey', 'ctrlKey', 'shiftKey', 'altKey'] as const)('is true with %s', (key) => {
    expect(isModifiedClick({ ...PLAIN, [key]: true })).toBe(true);
  });
});
