import type { UiCoreConfig } from '@mszczygiel-projects/ui-core-foundations/config';
import { getUiCoreConfig } from '@mszczygiel-projects/ui-core-foundations/config';
import { iconChevronLeft, iconChevronRight } from '@mszczygiel-projects/ui-core-icons';
import { pageBounds, paginate } from '@mszczygiel-projects/ui-core-shared/paginate';
import type {
  PaginationChangeReason,
  PaginationProps,
} from '@mszczygiel-projects/ui-core-shared/pagination';
import {
  Component,
  Element,
  Event,
  type EventEmitter,
  h,
  Prop,
  State,
  type VNode,
} from '@stencil/core';

import { followConfig } from '../internal/config.ts';
import { followAttribute } from '../internal/follow-attribute.ts';
import type { NumberFieldValueChange } from '../number-field/events.ts';
import type { PaginationPageChange } from './events.ts';

declare global {
  interface HTMLElementEventMap {
    'ui-page-change': CustomEvent<PaginationPageChange>;
  }
}

/**
 * Buttons or links that move between the pages of a long list.
 *
 * A navigation landmark holds the previous and next buttons and a list of the pages, with an
 * ellipsis where pages are left out. The current page carries `aria-current="page"`. Without
 * `getPageHref` the pages are buttons; with it they are links that a crawler can follow. Every
 * move dispatches the cancelable `ui-page-change` with the new page and its reason. Unless the
 * page cancels it, the element takes the new page and a link follows its address. In link mode
 * the previous and next controls are links too, so that a crawler reaches every page, and the
 * jump field loads the address of its page. The `page` attribute is the first page and the
 * property the current one. The optional status reads such as "Page 5 of 10", and the optional
 * jump field moves to a typed page on Enter or when it loses the focus. In a container narrower
 * than `breakpoint/sm` the pages give way to the status, or to the jump field when it is shown.
 * An `aria-label` that the page writes on the host names the navigation instead of the label.
 *
 * @part base - The navigation landmark, which is the container of the width queries.
 * @part previous - The button or link that moves to the previous page.
 * @part next - The button or link that moves to the next page.
 * @part list - The list of the pages.
 * @part item - One entry of the list.
 * @part page - The button or link of a page.
 * @part ellipsis - The mark where pages are left out.
 * @part status - The status text.
 * @part jump - The jump field with its texts.
 * @part jump-label - The visible label of the jump field in a wide container.
 * @part jump-field - The NumberField that takes the page to move to.
 * @part jump-total - The text after the jump field in a narrow container.
 */
@Component({
  tag: 'ui-pagination',
  styleUrls: ['../internal/action.css', 'pagination.css'],
  shadow: true,
})
export class UiPagination implements PaginationProps {
  @Element() host!: HTMLUiPaginationElement;

  /** The current page, from 1. The attribute is the first page and the property the current one. */
  @Prop({ mutable: true }) page = 1;

  /** The number of pages, at least 1. */
  @Prop() pageCount = 1;

  /** How many pages to show on each side of the current page. */
  @Prop() siblingCount = 1;

  /** How many pages to show at each end, at least 1. */
  @Prop() boundaryCount = 1;

  /** Prevents every move between pages. */
  @Prop({ reflect: true }) disabled = false;

  /** Shows the status text, such as "Page 5 of 10", after the pages. */
  @Prop() showStatus = false;

  /** Shows a field that moves to a page whose number a user types. */
  @Prop() showJump = false;

  /** The address of a page. With it the pages are links, and without it they are buttons. */
  @Prop({ attribute: null }) getPageHref?: (page: number) => string;

  /** The accessible name of the navigation, falling back to `labels.pagination.label`. */
  @Prop() label?: string;

  /** The name of the previous button, falling back to `labels.pagination.previous`. */
  @Prop() previousLabel?: string;

  /** The name of the next button, falling back to `labels.pagination.next`. */
  @Prop() nextLabel?: string;

  /** The label of the jump field, falling back to `labels.pagination.jump`. */
  @Prop() jumpLabel?: string;

  /** The name of a page button, falling back to `labels.pagination.page(page)`. */
  @Prop({ attribute: null }) getPageLabel?: (page: number) => string;

  /** The status text, falling back to `labels.pagination.status(page, pageCount)`. */
  @Prop({ attribute: null }) getStatusLabel?: (page: number, pageCount: number) => string;

  /** The text after the jump field, falling back to `labels.pagination.total(pageCount)`. */
  @Prop({ attribute: null }) getTotalLabel?: (pageCount: number) => string;

  // Stencil events are cancelable by default.
  /**
   * A user moved to another page. Cancel it to keep the page, and in link mode to keep the
   * browser from loading the address, as a page with client-side routing does.
   */
  @Event({ eventName: 'ui-page-change' }) pageChange!: EventEmitter<PaginationPageChange>;

  @State() private config: UiCoreConfig = getUiCoreConfig();

  /** The `aria-label` that the page wrote on the host. */
  @State() private authorLabel: string | null = null;

  /** The number in the jump field since its last commit, or null while it holds none. */
  private draft: number | null = null;

  /** The page the jump field shows, so a new page reaches it and a typed number stays. */
  private shownPage?: number;

  private jumpField?: HTMLUiNumberFieldElement;

  private stopFollowing: (() => void)[] = [];

  connectedCallback(): void {
    this.stopFollowing = [
      followConfig((config) => {
        this.config = config;
      }),
      followAttribute(this.host, 'aria-label', (value) => {
        this.authorLabel = value;
      }),
    ];
  }

  disconnectedCallback(): void {
    for (const stop of this.stopFollowing) {
      stop();
    }
    this.stopFollowing = [];
  }

  componentDidRender(): void {
    const { page } = pageBounds(this.page, this.pageCount);
    if (this.jumpField !== undefined && this.shownPage !== page) {
      this.shownPage = page;
      this.jumpField.value = page;
    }
  }

  render(): VNode {
    const labels = this.config.labels.pagination;
    const { page: current, pageCount: count } = pageBounds(this.page, this.pageCount);
    const { disabled } = this;
    const href = this.getPageHref;
    const total = this.getTotalLabel?.(count) ?? labels.total(count);
    const jumpLabel = this.jumpLabel ?? labels.jump;
    return (
      <nav
        part="base"
        class={`base${this.showStatus ? ' with-status' : ''}${this.showJump ? ' with-jump' : ''}`}
        aria-label={this.authorLabel ?? this.label ?? labels.label}
      >
        {this.renderStep('previous', current - 1, current <= 1, href)}
        <ol part="list" class="list">
          {paginate(current, count, {
            siblings: this.siblingCount,
            boundaries: this.boundaryCount,
          }).map((entry) => (
            <li part="item" class="item">
              {entry === 'ellipsis' ? (
                <span part="ellipsis" class="ellipsis" aria-hidden="true" />
              ) : (
                this.renderPage(entry, current, href)
              )}
            </li>
          ))}
        </ol>
        {this.renderStep('next', current + 1, current >= count, href)}
        {/* Without the jump field, a narrow container shows the status in place of the pages. */}
        {(this.showStatus || !this.showJump) && (
          <span part="status" class={`status${this.showStatus ? '' : ' fallback'}`}>
            {this.getStatusLabel?.(current, count) ?? labels.status(current, count)}
          </span>
        )}
        {this.showJump && (
          <span part="jump" class="jump">
            {/* The field takes its name from aria-label, so the visible text stays out of it. */}
            <span part="jump-label" class="jump-label" aria-hidden="true">
              {jumpLabel}
            </span>
            <ui-number-field
              part="jump-field"
              class="jump-field"
              aria-label={jumpLabel}
              min={1}
              max={count}
              disabled={disabled}
              ref={(element?: HTMLUiNumberFieldElement) => {
                if (element !== this.jumpField) {
                  this.shownPage = undefined;
                }
                this.jumpField = element;
              }}
              onUi-value-change={(event: CustomEvent<NumberFieldValueChange>) => {
                event.stopPropagation();
                this.draft = event.detail.value;
              }}
              onKeyDown={(event: KeyboardEvent) => {
                if (event.key === 'Enter' && !event.isComposing) {
                  // Enter commits the page, so it never submits a form as well.
                  event.preventDefault();
                  this.commitJump(event);
                }
              }}
              onFocusout={(event: FocusEvent) => {
                this.commitJump(event);
              }}
            />
            <span part="jump-total" class="jump-total">
              {total}
            </span>
          </span>
        )}
      </nav>
    );
  }

  /**
   * The previous or next control. In link mode it is a link with the address of its page, which a
   * crawler follows, and at either end a link without an address.
   */
  private renderStep(
    step: 'previous' | 'next',
    page: number,
    atEnd: boolean,
    href?: (page: number) => string,
  ): VNode {
    const labels = this.config.labels.pagination;
    const label =
      step === 'previous'
        ? (this.previousLabel ?? labels.previous)
        : (this.nextLabel ?? labels.next);
    const chevron = step === 'previous' ? iconChevronLeft : iconChevronRight;
    const onClick = (event: MouseEvent) => {
      this.move(page, step, event, false);
    };
    if (href === undefined) {
      return (
        <ui-icon-button
          part={step}
          class={step}
          variant="ghost"
          label={label}
          disabled={this.disabled || atEnd}
          onClick={onClick}
        >
          <span slot="icon" class="chevron" innerHTML={chevron} />
        </ui-icon-button>
      );
    }
    const className = `${step} step action ghost`;
    const icon = (
      <span class="step-icon" aria-hidden="true">
        <span class="chevron" innerHTML={chevron} />
      </span>
    );
    if (this.disabled || atEnd) {
      // A link without an address, as a disabled page is, so no pointer, key or menu follows it.
      return (
        <span
          part={step}
          class={`${className} disabled`}
          role="link"
          aria-disabled="true"
          aria-label={label}
        >
          {icon}
        </span>
      );
    }
    return (
      <a
        part={step}
        class={className}
        href={href(page)}
        rel={step === 'previous' ? 'prev' : 'next'}
        aria-label={label}
        onClick={onClick}
      >
        {icon}
      </a>
    );
  }

  private renderPage(page: number, current: number, href?: (page: number) => string): VNode {
    const name = this.getPageLabel?.(page) ?? this.config.labels.pagination.page(page);
    const isCurrent = page === current;
    const className = `page${isCurrent ? ' current' : ''}`;
    if (href !== undefined && this.disabled) {
      // A disabled link has no address, so no pointer, key or menu can follow it.
      return (
        <span
          part="page"
          class={`${className} disabled`}
          role="link"
          aria-disabled="true"
          aria-current={isCurrent ? 'page' : undefined}
          aria-label={name}
        >
          {page}
        </span>
      );
    }
    if (href !== undefined) {
      return (
        <a
          part="page"
          class={className}
          href={href(page)}
          aria-current={isCurrent ? 'page' : undefined}
          aria-label={name}
          onClick={(event) => {
            this.move(page, 'page', event, false);
          }}
        >
          {page}
        </a>
      );
    }
    return (
      <button
        part="page"
        class={className}
        type="button"
        disabled={this.disabled}
        aria-current={isCurrent ? 'page' : undefined}
        aria-label={name}
        onClick={(event) => {
          this.move(page, 'page', event, false);
        }}
      >
        {page}
      </button>
    );
  }

  /**
   * Moves to a page unless the event is canceled. A link follows its own address; in link mode
   * the jump field, which has none, loads the address of its page.
   */
  private move(page: number, reason: PaginationChangeReason, event: Event, load: boolean): void {
    if (this.disabled) {
      event.preventDefault();
      return;
    }
    const href = this.getPageHref?.(page);
    const emitted = this.pageChange.emit({
      page,
      reason,
      ...(href === undefined ? {} : { href }),
      originalEvent: event,
    });
    if (emitted.defaultPrevented) {
      event.preventDefault();
      return;
    }
    this.page = page;
    if (load && href !== undefined) {
      window.location.assign(href);
    }
  }

  /** Moves to the typed page, kept within the pages, and shows the current page again. */
  private commitJump(event: Event): void {
    const typed = this.draft;
    this.draft = null;
    const { page: current, pageCount } = pageBounds(this.page, this.pageCount);
    if (typed !== null) {
      const page = pageBounds(Math.round(typed), pageCount).page;
      if (page !== current) {
        this.move(page, 'jump', event, true);
      }
    }
    // A number outside the pages, or one the page refused, gives way to the current page.
    if (this.jumpField !== undefined) {
      this.shownPage = pageBounds(this.page, this.pageCount).page;
      this.jumpField.value = this.shownPage;
    }
  }
}

/**
 * Every prop of the specification is a prop of the component. `implements` alone accepts a class
 * that leaves out an optional prop, so a prop added to the specification would go unnoticed.
 */
type _DeclaresEveryProp = Pick<UiPagination, keyof PaginationProps>;
