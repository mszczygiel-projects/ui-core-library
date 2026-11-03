'use client';

import { iconChevronLeft, iconChevronRight } from '@mszczygiel-projects/ui-core-icons';
import { pageBounds, paginate } from '@mszczygiel-projects/ui-core-shared/paginate';
import type {
  PaginationChangeReason,
  PaginationPageChangeDetails,
  PaginationProps as SharedPaginationProps,
} from '@mszczygiel-projects/ui-core-shared/pagination';
import { type ComponentPropsWithRef, useLayoutEffect, useRef, useState } from 'react';

import { IconButton } from '../icon-button/IconButton.tsx';
import { classNames } from '../internal/class-names.ts';
import { useUiCoreConfig } from '../internal/use-ui-core-config.ts';
import { NumberField } from '../number-field/NumberField.tsx';

/** The props of Pagination. Other attributes of a `nav`, the ref among them, go to its root. */
export interface PaginationProps
  extends
    SharedPaginationProps,
    Omit<ComponentPropsWithRef<'nav'>, keyof SharedPaginationProps | 'onChange'> {
  /** The controlled current page, from 1. Pair it with onPageChange to accept moves. */
  page?: number;
  /**
   * The first page of an uncontrolled control.
   * @default 1
   */
  defaultPage?: number;
  /**
   * Called with the new page when a user moves to it. Call `preventDefault()` on the original
   * event to keep the page, and in link mode to keep the browser from loading the address, as a
   * page with client-side routing does. A move from the jump field passes a cancelable copy of
   * its key or focus event, since the field has already handled the key and a focus event cannot
   * be canceled.
   */
  onPageChange?: (page: number, details: PaginationPageChangeDetails<Event>) => void;
}

/**
 * A cancelable copy of an event that the jump field has handled: the Enter key, whose default it
 * prevents so that a form around it does not submit, or a focus event, which cannot be canceled.
 */
function cancelableCopy(event: Event): Event {
  if (event instanceof KeyboardEvent) {
    return new KeyboardEvent(event.type, { key: event.key, code: event.code, cancelable: true });
  }
  if (event instanceof FocusEvent) {
    return new FocusEvent(event.type, { relatedTarget: event.relatedTarget, cancelable: true });
  }
  return new Event(event.type, { cancelable: true });
}

/**
 * Buttons or links that move between the pages of a long list.
 *
 * A navigation landmark holds the previous and next buttons and a list of the pages, with an
 * ellipsis where pages are left out. The current page carries `aria-current="page"`. Without
 * `getPageHref` the pages are buttons; with it they are links that a crawler can follow, and the
 * previous, next and jump controls load the address of their page. It is controlled with `page`
 * or uncontrolled with `defaultPage`. The optional status reads such as "Page 5 of 10", and the
 * optional jump field moves to a typed page on Enter or when it loses the focus. In a container
 * narrower than `breakpoint/sm` the pages give way to the status, or to the jump field when it
 * is shown. An `aria-label` names the navigation instead of the label.
 */
export function Pagination({
  page,
  defaultPage = 1,
  pageCount = 1,
  siblingCount = 1,
  boundaryCount = 1,
  disabled = false,
  showStatus = false,
  showJump = false,
  getPageHref,
  label,
  previousLabel,
  nextLabel,
  jumpLabel,
  getPageLabel,
  getStatusLabel,
  getTotalLabel,
  onPageChange,
  className,
  'aria-label': ariaLabel,
  ...rest
}: PaginationProps) {
  const labels = useUiCoreConfig().labels.pagination;
  const [uncontrolled, setUncontrolled] = useState(defaultPage);
  // What a user typed in the jump field since the last commit; undefined shows the current page.
  const [typed, setTyped] = useState<number | null>();
  // A new key shows the current page again in place of text that holds no number, such as "-",
  // which the field keeps as an unfinished draft.
  const [jumpKey, setJumpKey] = useState(0);
  const jumpInput = useRef<HTMLInputElement | null>(null);
  const refocusJump = useRef(false);
  useLayoutEffect(() => {
    if (refocusJump.current) {
      refocusJump.current = false;
      jumpInput.current?.focus();
    }
  }, [jumpKey]);
  const { page: current, pageCount: count } = pageBounds(page ?? uncontrolled, pageCount);
  const jumpName = jumpLabel ?? labels.jump;

  /**
   * Moves to a page unless the event is canceled. A link follows its own address; in link mode
   * a control without one loads the address of its page.
   */
  function move(next: number, reason: PaginationChangeReason, event: Event, load: boolean) {
    if (disabled) {
      event.preventDefault();
      return;
    }
    const href = getPageHref?.(next);
    onPageChange?.(next, { reason, ...(href === undefined ? {} : { href }), originalEvent: event });
    if (event.defaultPrevented) {
      return;
    }
    setUncontrolled(next);
    if (load && href !== undefined) {
      window.location.assign(href);
    }
  }

  /** Moves to the typed page, kept within the pages, and shows the current page again. */
  function commitJump(event: Event, keepFocus: boolean) {
    setTyped(undefined);
    if (typed === null) {
      refocusJump.current = keepFocus;
      setJumpKey((key) => key + 1);
    }
    if (typed !== undefined && typed !== null) {
      const next = pageBounds(Math.round(typed), count).page;
      if (next !== current) {
        move(next, 'jump', event, true);
      }
    }
  }

  return (
    <nav
      className={classNames(
        'ui-pagination',
        'ui-pagination__base',
        showStatus && 'ui-pagination--with-status',
        showJump && 'ui-pagination--with-jump',
        className,
      )}
      aria-label={ariaLabel ?? label ?? labels.label}
      {...rest}
    >
      <IconButton
        className="ui-pagination__previous"
        variant="ghost"
        label={previousLabel ?? labels.previous}
        disabled={disabled || current <= 1}
        icon={
          <span
            className="ui-pagination__chevron"
            dangerouslySetInnerHTML={{ __html: iconChevronLeft }}
          />
        }
        onClick={(event) => {
          move(current - 1, 'previous', event.nativeEvent, true);
        }}
      />
      <ol className="ui-pagination__list">
        {paginate(current, count, { siblings: siblingCount, boundaries: boundaryCount }).map(
          (entry, index) => {
            if (entry === 'ellipsis') {
              return (
                // An ellipsis has no number, and its place in the list names it.
                <li key={`ellipsis-${String(index)}`} className="ui-pagination__item">
                  <span className="ui-pagination__ellipsis" aria-hidden="true" />
                </li>
              );
            }
            const isCurrent = entry === current;
            const pageClass = classNames(
              'ui-pagination__page',
              isCurrent && 'ui-pagination__page--current',
            );
            const name = getPageLabel?.(entry) ?? labels.page(entry);
            return (
              <li key={entry} className="ui-pagination__item">
                {getPageHref === undefined ? (
                  <button
                    className={pageClass}
                    type="button"
                    disabled={disabled}
                    aria-current={isCurrent ? 'page' : undefined}
                    aria-label={name}
                    onClick={(event) => {
                      move(entry, 'page', event.nativeEvent, false);
                    }}
                  >
                    {entry}
                  </button>
                ) : disabled ? (
                  // A disabled link has no address, so no pointer, key or menu can follow it.
                  <span
                    className={classNames(pageClass, 'ui-pagination__page--disabled')}
                    role="link"
                    aria-disabled="true"
                    aria-current={isCurrent ? 'page' : undefined}
                    aria-label={name}
                  >
                    {entry}
                  </span>
                ) : (
                  <a
                    className={pageClass}
                    href={getPageHref(entry)}
                    aria-current={isCurrent ? 'page' : undefined}
                    aria-label={name}
                    onClick={(event) => {
                      move(entry, 'page', event.nativeEvent, false);
                    }}
                  >
                    {entry}
                  </a>
                )}
              </li>
            );
          },
        )}
      </ol>
      <IconButton
        className="ui-pagination__next"
        variant="ghost"
        label={nextLabel ?? labels.next}
        disabled={disabled || current >= count}
        icon={
          <span
            className="ui-pagination__chevron"
            dangerouslySetInnerHTML={{ __html: iconChevronRight }}
          />
        }
        onClick={(event) => {
          move(current + 1, 'next', event.nativeEvent, true);
        }}
      />
      {/* Without the jump field, a narrow container shows the status in place of the pages. */}
      {(showStatus || !showJump) && (
        <span
          className={classNames(
            'ui-pagination__status',
            !showStatus && 'ui-pagination__status--fallback',
          )}
        >
          {getStatusLabel?.(current, count) ?? labels.status(current, count)}
        </span>
      )}
      {showJump && (
        <span className="ui-pagination__jump">
          {/* The field takes its name from aria-label, so the visible text stays out of it. */}
          <span className="ui-pagination__jump-label" aria-hidden="true">
            {jumpName}
          </span>
          <NumberField
            key={jumpKey}
            ref={jumpInput}
            className="ui-pagination__jump-field"
            aria-label={jumpName}
            value={typed === undefined ? current : typed}
            min={1}
            max={count}
            disabled={disabled}
            onValueChange={(value) => {
              setTyped(value);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                event.preventDefault();
                commitJump(cancelableCopy(event.nativeEvent), true);
              }
            }}
            onBlur={(event) => {
              commitJump(cancelableCopy(event.nativeEvent), false);
            }}
          />
          <span className="ui-pagination__jump-total">
            {getTotalLabel?.(count) ?? labels.total(count)}
          </span>
        </span>
      )}
    </nav>
  );
}
