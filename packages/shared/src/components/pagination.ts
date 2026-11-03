import { defineComponent } from './component.ts';

/** The specification of Pagination. */
export const pagination = defineComponent({
  name: 'Pagination',
  tag: 'ui-pagination',
  category: 'Navigation',
  status: 'in-progress',
  figma: '2157:126',
  design: {
    flags: ['disabled'],
    booleans: ['showStatus', 'showJump'],
    codeOnly: [
      'page',
      'pageCount',
      'siblingCount',
      'boundaryCount',
      'getPageHref',
      'label',
      'previousLabel',
      'nextLabel',
      'jumpLabel',
      'getPageLabel',
      'getStatusLabel',
      'getTotalLabel',
    ],
    previews: {
      layout: {
        options: ['wide', 'narrow'],
        default: 'wide',
        note: 'Previews a container at least breakpoint/sm wide, or a narrower one. In a narrow one the pages give way to the status, or to the jump field when it is shown, between the previous and next buttons. Code follows the width of the container.',
      },
    },
  },
  summary: 'Buttons or links that move between the pages of a long list.',
  options: {},
  labels: ['label', 'previous', 'next', 'page', 'status', 'jump', 'total'],
  parts: [
    'base',
    'list',
    'item',
    'page',
    'ellipsis',
    'previous',
    'next',
    'status',
    'jump',
    'jump-label',
    'jump-field',
    'jump-total',
  ],
  slots: [],
  events: ['ui-page-change'],
  stories: ['Playground', 'WithStatus', 'WithJump', 'WithLinks', 'OnSurfaces'],
  exceptions: [
    {
      items: ['size'],
      reason: 'The page buttons have the one size of a hit area, so the control has no size prop.',
    },
    {
      items: ['page', 'defaultPage'],
      reason:
        'The current page is a number from 1, not a string. React pairs page with defaultPage and onPageChange. The web component takes its first page from the page attribute and holds the current one in the page property.',
    },
    {
      items: ['ui-page-change'],
      reason:
        'The change is cancelable in the web component, and React passes the native event, so that a page with client-side routing can keep a link from loading a new page.',
    },
  ],
});

/** What moved to a new page: a page button, the previous or next button, or the jump field. */
export type PaginationChangeReason = 'page' | 'previous' | 'next' | 'jump';

/**
 * What accompanies a new page: the reason, its address with `getPageHref`, and the native event.
 * The package knows no browser types, so each implementation names the type of the event.
 */
export interface PaginationPageChangeDetails<OriginalEvent> {
  readonly reason: PaginationChangeReason;
  /** The address of the page, when `getPageHref` gives one. */
  readonly href?: string;
  readonly originalEvent: OriginalEvent;
}

/** The detail of `ui-page-change`: the new page, the reason and the native event. */
export interface PaginationPageChangeDetail<
  OriginalEvent,
> extends PaginationPageChangeDetails<OriginalEvent> {
  readonly page: number;
}

/** The props both implementations of Pagination share. */
export interface PaginationProps {
  /**
   * The number of pages, at least 1.
   * @default 1
   */
  pageCount?: number;
  /**
   * How many pages to show on each side of the current page.
   * @default 1
   */
  siblingCount?: number;
  /**
   * How many pages to show at each end, at least 1.
   * @default 1
   */
  boundaryCount?: number;
  /** Prevents every move between pages. */
  disabled?: boolean;
  /** Shows the status text, such as "Page 5 of 10", after the pages. */
  showStatus?: boolean;
  /** Shows a field that moves to a page whose number a user types. */
  showJump?: boolean;
  /**
   * The address of a page. With it the pages are links that a crawler can follow, and without it
   * they are buttons.
   */
  getPageHref?: (page: number) => string;
  /** The accessible name of the navigation, falling back to `labels.pagination.label`. */
  label?: string;
  /** The name of the previous button, falling back to `labels.pagination.previous`. */
  previousLabel?: string;
  /** The name of the next button, falling back to `labels.pagination.next`. */
  nextLabel?: string;
  /** The label of the jump field, falling back to `labels.pagination.jump`. */
  jumpLabel?: string;
  /** The name of a page button, falling back to `labels.pagination.page(page)`. */
  getPageLabel?: (page: number) => string;
  /** The status text, falling back to `labels.pagination.status(page, pageCount)`. */
  getStatusLabel?: (page: number, pageCount: number) => string;
  /**
   * The text after the jump field in a narrow container, such as "of 10", falling back to
   * `labels.pagination.total(pageCount)`.
   */
  getTotalLabel?: (pageCount: number) => string;
}
