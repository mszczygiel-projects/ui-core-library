/**
 * The pages a pagination control shows: the pages at each end, the current page with its
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
  /**
   * How many pages to show at each end of the range.
   * @default 1
   */
  readonly boundaries?: number;
}

/** A whole number of at least `min`; anything that is not a finite number becomes `fallback`. */
function whole(value: number, min: number, fallback: number): number {
  return Number.isFinite(value) ? Math.max(min, Math.floor(value)) : fallback;
}

/**
 * The current page and the number of pages as a control counts them: the count is a whole number
 * of at least 1, and the page a whole number from 1 to the count.
 */
export function pageBounds(page: number, pageCount: number): { page: number; pageCount: number } {
  const count = whole(pageCount, 1, 1);
  return { page: Math.min(whole(page, 1, 1), count), pageCount: count };
}

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, index) => from + index);
}

/**
 * The items of a pagination control for page `page` of `pageCount`.
 *
 * While all pages fit, every page is shown. Beyond that the list always has
 * `2 × siblings + 2 × boundaries + 3` items, wherever the current page is, so the control keeps its
 * width. An ellipsis always stands
 * for two or more pages: a single hidden page is shown as its number, which takes the same place.
 * Pages are counted from 1, and a page outside the range counts as the nearest one.
 */
export function paginate(
  page: number,
  pageCount: number,
  options: PaginateOptions = {},
): PageItem[] {
  const { page: current, pageCount: count } = pageBounds(page, pageCount);
  const siblings = whole(options.siblings ?? 1, 0, 1);
  const boundaries = whole(options.boundaries ?? 1, 1, 1);
  const length = 2 * siblings + 2 * boundaries + 3;
  if (count <= length) {
    return range(1, count);
  }

  // The window around the current page leaves the boundary pages at each end and one more place
  // next to them, for either the next page or an ellipsis.
  const first = boundaries + 2;
  const last = count - boundaries - 1;
  const start = Math.min(Math.max(current - siblings, first), last - 2 * siblings);
  const end = start + 2 * siblings;
  return [
    ...range(1, boundaries),
    start === first ? boundaries + 1 : 'ellipsis',
    ...range(start, end),
    end === last ? count - boundaries : 'ellipsis',
    ...range(count - boundaries + 1, count),
  ];
}
