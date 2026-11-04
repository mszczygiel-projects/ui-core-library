import { describe, expect, it } from 'vitest';

import { nextTab, selectedTabValue } from './tabs-navigation.ts';

describe('nextTab', () => {
  const all = [true, true, true];

  it('moves along a horizontal list and wraps at the ends', () => {
    expect(nextTab('ArrowRight', 0, all, 'horizontal', 'ltr')).toBe(1);
    expect(nextTab('ArrowRight', 2, all, 'horizontal', 'ltr')).toBe(0);
    expect(nextTab('ArrowLeft', 0, all, 'horizontal', 'ltr')).toBe(2);
  });

  it('turns the horizontal arrows in right-to-left text', () => {
    expect(nextTab('ArrowLeft', 0, all, 'horizontal', 'rtl')).toBe(1);
    expect(nextTab('ArrowRight', 0, all, 'horizontal', 'rtl')).toBe(2);
  });

  it('moves along a vertical list with the vertical arrows in every direction of text', () => {
    expect(nextTab('ArrowDown', 0, all, 'vertical', 'ltr')).toBe(1);
    expect(nextTab('ArrowUp', 0, all, 'vertical', 'rtl')).toBe(2);
  });

  it('ignores the arrows across the axis and other keys', () => {
    expect(nextTab('ArrowDown', 0, all, 'horizontal', 'ltr')).toBeUndefined();
    expect(nextTab('ArrowRight', 0, all, 'vertical', 'ltr')).toBeUndefined();
    expect(nextTab('Enter', 0, all, 'horizontal', 'ltr')).toBeUndefined();
  });

  it('skips disabled tabs', () => {
    const enabled = [true, false, true, false];
    expect(nextTab('ArrowRight', 0, enabled, 'horizontal', 'ltr')).toBe(2);
    expect(nextTab('ArrowRight', 2, enabled, 'horizontal', 'ltr')).toBe(0);
    expect(nextTab('ArrowLeft', 0, enabled, 'horizontal', 'ltr')).toBe(2);
  });

  it('goes to the first and last enabled tab with Home and End', () => {
    const enabled = [false, true, true, false];
    expect(nextTab('Home', 2, enabled, 'horizontal', 'ltr')).toBe(1);
    expect(nextTab('End', 1, enabled, 'vertical', 'ltr')).toBe(2);
  });

  it('finds nothing when no other tab is enabled', () => {
    expect(nextTab('ArrowRight', 0, [true, false], 'horizontal', 'ltr')).toBeUndefined();
    expect(nextTab('Home', 0, [false, false], 'horizontal', 'ltr')).toBeUndefined();
  });
});

describe('selectedTabValue', () => {
  const tabs = [
    { value: 'a', disabled: true },
    { value: 'b', disabled: false },
    { value: 'c', disabled: false },
  ];

  it('keeps a value that a tab has, even a disabled one', () => {
    expect(selectedTabValue('c', tabs)).toBe('c');
    expect(selectedTabValue('a', tabs)).toBe('a');
  });

  it('falls back to the first enabled tab', () => {
    expect(selectedTabValue(undefined, tabs)).toBe('b');
    expect(selectedTabValue('missing', tabs)).toBe('b');
  });

  it('selects nothing when every tab is disabled', () => {
    expect(selectedTabValue(undefined, [{ value: 'a', disabled: true }])).toBeUndefined();
  });
});
