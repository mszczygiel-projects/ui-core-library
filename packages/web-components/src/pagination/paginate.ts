export type PaginationEntry = number | 'ellipsis';

const range = (from: number, to: number): number[] =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

/**
 * Computes the visible page entries for a pagination strip.
 *
 * The result always contains the first and last page. Gaps are replaced with
 * `'ellipsis'` markers, and windows near the boundaries are widened so the
 * total entry count stays constant (`2 × siblingCount + 5`) whenever the range
 * is long enough to truncate.
 */
export function paginate(
  currentPage: number,
  totalPages: number,
  siblingCount = 1,
): PaginationEntry[] {
  const total = Math.max(1, Math.floor(totalPages));
  const current = Math.min(Math.max(1, Math.floor(currentPage)), total);
  const siblings = Math.max(0, Math.floor(siblingCount));

  // first + last + current + siblings on both sides + the two ellipsis slots
  const maxLength = 2 * siblings + 5;
  if (total <= maxLength) return range(1, total);

  const leftSibling = Math.max(current - siblings, 1);
  const rightSibling = Math.min(current + siblings, total);
  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < total - 1;

  if (!showLeftEllipsis && showRightEllipsis) {
    return [...range(1, maxLength - 2), 'ellipsis', total];
  }
  if (showLeftEllipsis && !showRightEllipsis) {
    return [1, 'ellipsis', ...range(total - (maxLength - 3), total)];
  }
  return [1, 'ellipsis', ...range(leftSibling, rightSibling), 'ellipsis', total];
}
