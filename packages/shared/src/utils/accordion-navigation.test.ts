import { describe, expect, it } from 'vitest';

import { nextAccordionHeading } from './accordion-navigation.ts';

describe('nextAccordionHeading', () => {
  const all = [true, true, true];

  it('moves down and up, wrapping at the ends', () => {
    expect(nextAccordionHeading('ArrowDown', 0, all)).toBe(1);
    expect(nextAccordionHeading('ArrowDown', 2, all)).toBe(0);
    expect(nextAccordionHeading('ArrowUp', 0, all)).toBe(2);
    expect(nextAccordionHeading('ArrowUp', 2, all)).toBe(1);
  });

  it('skips disabled headings', () => {
    const enabled = [true, false, true, false];
    expect(nextAccordionHeading('ArrowDown', 0, enabled)).toBe(2);
    expect(nextAccordionHeading('ArrowDown', 2, enabled)).toBe(0);
    expect(nextAccordionHeading('ArrowUp', 0, enabled)).toBe(2);
  });

  it('goes to the first and last enabled heading with Home and End', () => {
    const enabled = [false, true, true, false];
    expect(nextAccordionHeading('Home', 2, enabled)).toBe(1);
    expect(nextAccordionHeading('End', 1, enabled)).toBe(2);
  });

  it('ignores the horizontal arrows and other keys', () => {
    expect(nextAccordionHeading('ArrowRight', 0, all)).toBeUndefined();
    expect(nextAccordionHeading('Enter', 0, all)).toBeUndefined();
  });

  it('returns nothing when no other heading is enabled', () => {
    expect(nextAccordionHeading('ArrowDown', 0, [true, false])).toBeUndefined();
    expect(nextAccordionHeading('Home', 0, [false, false])).toBeUndefined();
  });
});
