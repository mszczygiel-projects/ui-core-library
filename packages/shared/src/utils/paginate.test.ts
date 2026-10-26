import { describe, expect, it } from 'vitest';

import { type PageItem, paginate } from './paginate.ts';

/** The pages an item list hides: for each ellipsis, the pages between its neighbours. */
function hiddenRuns(items: readonly PageItem[]): number[] {
  const runs: number[] = [];
  items.forEach((item, index) => {
    const before = items[index - 1];
    const after = items[index + 1];
    if (item === 'ellipsis' && typeof before === 'number' && typeof after === 'number') {
      runs.push(after - before - 1);
    }
  });
  return runs;
}

describe('paginate', () => {
  it('shows every page while they fit', () => {
    expect(paginate(3, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(paginate(1, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('replaces the gaps around the current page with an ellipsis', () => {
    expect(paginate(5, 10)).toEqual([1, 'ellipsis', 4, 5, 6, 'ellipsis', 10]);
    expect(paginate(10, 20, { siblings: 2 })).toEqual([
      1,
      'ellipsis',
      8,
      9,
      10,
      11,
      12,
      'ellipsis',
      20,
    ]);
    expect(paginate(5, 10, { siblings: 0 })).toEqual([1, 'ellipsis', 5, 'ellipsis', 10]);
  });

  it('shows a single hidden page as its number instead of an ellipsis', () => {
    expect(paginate(4, 10)).toEqual([1, 2, 3, 4, 5, 'ellipsis', 10]);
    expect(paginate(7, 10)).toEqual([1, 'ellipsis', 6, 7, 8, 9, 10]);
  });

  it('keeps the same length wherever the current page is, and every ellipsis hides two pages or more', () => {
    for (let siblings = 0; siblings <= 3; siblings++) {
      const length = 2 * siblings + 5;
      for (let count = 1; count <= 30; count++) {
        for (let page = 1; page <= count; page++) {
          const items = paginate(page, count, { siblings });
          const pages = items.filter((item) => item !== 'ellipsis');
          expect(items).toHaveLength(Math.min(count, length));
          expect(pages).toContain(page);
          expect(pages[0]).toBe(1);
          expect(pages.at(-1)).toBe(count);
          expect(pages).toEqual([...pages].sort((a, b) => a - b));
          for (const run of hiddenRuns(items)) {
            expect(run).toBeGreaterThanOrEqual(2);
          }
        }
      }
    }
  });

  it('treats a page outside the range, or a fraction, as the nearest page', () => {
    expect(paginate(0, 10)).toEqual(paginate(1, 10));
    expect(paginate(99, 10)).toEqual(paginate(10, 10));
    expect(paginate(4.7, 10)).toEqual(paginate(4, 10));
    expect(paginate(3, 9.5, { siblings: 1.5 })).toEqual(paginate(3, 9));
  });

  it('shows one page when there are none, and ignores what is not a number', () => {
    expect(paginate(1, 0)).toEqual([1]);
    expect(paginate(Number.NaN, Number.POSITIVE_INFINITY)).toEqual([1]);
    expect(paginate(5, 10, { siblings: Number.NaN })).toEqual(paginate(5, 10));
  });
});
