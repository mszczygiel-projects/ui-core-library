/**
 * The pages a pagination control shows: the first and the last page, the current page with its
 * neighbours, and an ellipsis for each gap between them.
 */

/** A page number, or an ellipsis that stands for two or more pages. */
export type PageItem = number | 'ellipsis';

export interface PaginateOptions {
  /**
   * How many pages to show on each side of the current page.
   * @default 1
   */
  readonly siblings?: number;
}

/** A whole number of at least `min`; anything that is not a finite number becomes `fallback`. */
function whole(value: number, min: number, fallback: number): number {
  return Number.isFinite(value) ? Math.max(min, Math.floor(value)) : fallback;
}

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, index) => from + index);
}

/**
 * The items of a pagination control for page `page` of `pageCount`.
 *
 * While all pages fit, every page is shown. Beyond that the list always has `2 × siblings + 5`
 * items, wherever the current page is, so the control keeps its width. An ellipsis always stands
 * for two or more pages: a single hidden page is shown as its number, which takes the same place.
 * Pages are counted from 1, and a page outside the range counts as the nearest one.
 */
export function paginate(
  page: number,
  pageCount: number,
  options: PaginateOptions = {},
): PageItem[] {
  const count = whole(pageCount, 1, 1);
  const current = Math.min(whole(page, 1, 1), count);
  const siblings = whole(options.siblings ?? 1, 0, 1);
  const length = 2 * siblings + 5;
  if (count <= length) {
    return range(1, count);
  }

  // The window around the current page leaves two places at each end: the first or the last
  // page, and next to it either the second or second-to-last page or an ellipsis.
  const start = Math.min(Math.max(current - siblings, 3), count - 2 - 2 * siblings);
  const end = start + 2 * siblings;
  return [
    1,
    start === 3 ? 2 : 'ellipsis',
    ...range(start, end),
    end === count - 2 ? count - 1 : 'ellipsis',
    count,
  ];
}
