import { useId, useState, type AriaAttributes, type CSSProperties, type ReactNode } from 'react';
import { IconChevronLeft, IconChevronRight } from '@mszczygiel-projects/ui-core-icons/react';
import { IconButton } from '../IconButton/IconButton.js';
import { TextField } from '../TextField/TextField.js';
import { pickAriaProps } from '../aria.js';
import { paginate } from './paginate.js';
import './Pagination.css';
import { getUiCoreConfig } from '@mszczygiel-projects/ui-core-foundations';

export type { PaginationEntry } from './paginate.js';

/**
 * Controlled pagination bar: prev/next arrows, numbered page items with
 * ellipsis truncation, an optional consumer-controlled page label, and a
 * jump-to-page field.
 *
 * Controlled-only: the component never changes the page itself — it calls
 * `onChange` (or `onJumpToPage` for jump commits) and waits for a new
 * `currentPage` prop. Below the `48rem` breakpoint the number strip and the
 * jump field collapse and `pageLabel` is centered between the arrows.
 *
 * The jump field is a `TextField` internally; once a NumberField component
 * exists it will swap in without any consumer-facing API change.
 *
 * @example
 * <Pagination
 *   currentPage={page}
 *   totalPages={42}
 *   onChange={setPage}
 *   pageLabel={`Page ${page} of 42`}
 * />
 */
export interface PaginationProps extends AriaAttributes {
  /** Current page, 1-based. */
  currentPage: number;
  /** Total number of pages. */
  totalPages: number;
  /** Called with the target page on prev/next/item clicks (and jump commits unless `onJumpToPage` is set). */
  onChange: (page: number) => void;
  /** Called instead of `onChange` when the jump-to-page field commits a value. */
  onJumpToPage?: (page: number) => void;
  /**
   * Pages shown on each side of the current page.
   * @default 1
   */
  siblingCount?: number;
  /** Optional label content (e.g. "Page 5 of 42"); the only element shown between the arrows on mobile. */
  pageLabel?: ReactNode;
  /**
   * Hides the jump-to-page field.
   * @default false
   */
  hideJumpToPage?: boolean;
  /**
   * Visible caption and accessible name of the jump-to-page field.
   * @default `getUiCoreConfig().labels.pagination.jumpToPage`
   */
  jumpLabel?: string;
  /**
   * Accessible name of the previous-page button.
   * @default `getUiCoreConfig().labels.pagination.previousPage`
   */
  prevLabel?: string;
  /**
   * Accessible name of the next-page button.
   * @default `getUiCoreConfig().labels.pagination.nextPage`
   */
  nextLabel?: string;
  /**
   * Builds the accessible name of a page item.
   * @default page => `Page ${page}`
   */
  getItemAriaLabel?: (page: number) => string;
  /** Extra class names appended to the root element. */
  className?: string;
  /** Inline styles forwarded to the root element (positioning only — never visual styles). */
  style?: CSSProperties;
}

export function Pagination({
  currentPage,
  totalPages,
  onChange,
  onJumpToPage,
  siblingCount = 1,
  pageLabel,
  hideJumpToPage = false,
  jumpLabel,
  prevLabel,
  nextLabel,
  getItemAriaLabel,
  className,
  style,
  'aria-label': ariaLabel,
  ...aria
}: PaginationProps) {
  const total = Math.max(1, Math.floor(totalPages));
  const current = Math.min(Math.max(1, Math.floor(currentPage)), total);
  const entries = paginate(current, total, siblingCount);
  const labels = getUiCoreConfig().labels.pagination;
  const resolvedJumpLabel = jumpLabel ?? labels.jumpToPage;
  const itemAriaLabel = getItemAriaLabel ?? labels.item;
  const jumpLabelId = useId();
  const [draft, setDraft] = useState<string | null>(null);

  const commitJump = () => {
    if (draft === null) return;
    setDraft(null);
    const parsed = Number.parseInt(draft.trim(), 10);
    if (Number.isNaN(parsed)) return;
    const page = Math.min(Math.max(1, parsed), total);
    if (page !== current) (onJumpToPage ?? onChange)(page);
  };

  return (
    <nav
      {...pickAriaProps(aria)}
      aria-label={ariaLabel ?? labels.label}
      className={['ui-pagination', className].filter(Boolean).join(' ')}
      style={style}
    >
      <IconButton
        className="ui-pagination__prev"
        variant="ghost"
        icon={<IconChevronLeft />}
        aria-label={prevLabel ?? labels.previousPage}
        disabled={current <= 1}
        onClick={() => onChange(current - 1)}
      />
      <ul className="ui-pagination__items">
        {entries.map((entry, index) =>
          entry === 'ellipsis' ? (
            <li key={`ellipsis-${index}`} className="ui-pagination__cell" aria-hidden="true">
              <span className="ui-pagination__ellipsis">…</span>
            </li>
          ) : (
            <li key={entry} className="ui-pagination__cell">
              <button
                type="button"
                className={[
                  'ui-pagination__item',
                  entry === current && 'ui-pagination__item--current',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-label={itemAriaLabel(entry)}
                aria-current={entry === current ? 'page' : undefined}
                onClick={() => {
                  if (entry !== current) onChange(entry);
                }}
              >
                {entry}
              </button>
            </li>
          ),
        )}
      </ul>
      <IconButton
        className="ui-pagination__next"
        variant="ghost"
        icon={<IconChevronRight />}
        aria-label={nextLabel ?? labels.nextPage}
        disabled={current >= total}
        onClick={() => onChange(current + 1)}
      />
      {(pageLabel != null || !hideJumpToPage) && (
        <div className="ui-pagination__meta">
          {pageLabel != null && <span className="ui-pagination__label">{pageLabel}</span>}
          {!hideJumpToPage && (
            <div className="ui-pagination__jump">
              <span id={jumpLabelId} className="ui-pagination__jump-label">
                {resolvedJumpLabel}
              </span>
              <TextField
                className="ui-pagination__jump-field"
                value={draft ?? String(current)}
                onChange={setDraft}
                inputMode="numeric"
                autoComplete="off"
                aria-labelledby={jumpLabelId}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') commitJump();
                }}
                onBlur={commitJump}
              />
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
