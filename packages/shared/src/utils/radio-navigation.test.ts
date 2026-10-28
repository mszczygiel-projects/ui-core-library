import { describe, expect, it } from 'vitest';

import { nextRadio } from './radio-navigation.ts';

describe('nextRadio', () => {
  const all = [true, true, true];

  it('moves forward with the down arrow and the arrow in reading order', () => {
    expect(nextRadio('ArrowDown', 0, all, 'ltr')).toBe(1);
    expect(nextRadio('ArrowRight', 0, all, 'ltr')).toBe(1);
    expect(nextRadio('ArrowLeft', 0, all, 'rtl')).toBe(1);
  });

  it('moves back with the up arrow and the other horizontal arrow', () => {
    expect(nextRadio('ArrowUp', 2, all, 'ltr')).toBe(1);
    expect(nextRadio('ArrowLeft', 2, all, 'ltr')).toBe(1);
    expect(nextRadio('ArrowRight', 2, all, 'rtl')).toBe(1);
  });

  it('wraps around both ends', () => {
    expect(nextRadio('ArrowDown', 2, all, 'ltr')).toBe(0);
    expect(nextRadio('ArrowUp', 0, all, 'ltr')).toBe(2);
  });

  it('skips disabled options', () => {
    expect(nextRadio('ArrowDown', 0, [true, false, true], 'ltr')).toBe(2);
    expect(nextRadio('ArrowUp', 0, [true, true, false], 'ltr')).toBe(1);
  });

  it('returns undefined for other keys or when no other option is enabled', () => {
    expect(nextRadio('Home', 0, all, 'ltr')).toBeUndefined();
    expect(nextRadio('ArrowDown', 0, [true, false], 'ltr')).toBeUndefined();
    expect(nextRadio('ArrowDown', 0, [true], 'ltr')).toBeUndefined();
  });
});
