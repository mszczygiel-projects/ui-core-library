import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { svgMap } from '@mszczygiel-projects/ui-core-icons';
import { paginationStyles } from './pagination.styles.js';
import { focusStyles } from '../styles/focus.styles.js';
import { resetStyles } from '../styles/reset.styles.js';
import { paginate } from './paginate.js';
import '../icon-button/icon-button.js';

export type { PaginationEntry } from './paginate.js';

export interface PaginationChangeDetail {
  /** Target page, already clamped to `[1, totalPages]`. */
  page: number;
  /** Which control requested the change. */
  source: 'prev' | 'next' | 'item' | 'jump';
}

/**
 * Controlled pagination bar: prev/next arrows, numbered page items with
 * ellipsis truncation, an optional consumer-controlled page label, and a
 * jump-to-page field. Controlled-only: the component never changes the page
 * itself — it fires `ui-change` and waits for a new `current-page` value.
 * Below the `48rem` breakpoint the number strip and the jump field collapse
 * and the `page-label` slot is centered between the arrows.
 *
 * The jump field mirrors TextField's outline styling via control tokens; once
 * a NumberField component exists it will swap in without any consumer-facing
 * API change.
 *
 * @element ui-pagination
 *
 * @example
 * ```html
 * <ui-pagination current-page="5" total-pages="42">
 *   <span slot="page-label">Page 5 of 42</span>
 * </ui-pagination>
 * ```
 *
 * @slot page-label - Optional label content; the only element shown between the arrows on mobile.
 *
 * @fires {CustomEvent} ui-change - A page was requested; `detail.page` carries the target page, `detail.source` one of `prev | next | item | jump`.
 */
@customElement('ui-pagination')
export class UiPagination extends LitElement {
  static override styles = [resetStyles, focusStyles, paginationStyles];

  /**
   * Current page, 1-based.
   * @default 1
   */
  @property({ type: Number, reflect: true, attribute: 'current-page' }) currentPage = 1;

  /**
   * Total number of pages.
   * @default 1
   */
  @property({ type: Number, reflect: true, attribute: 'total-pages' }) totalPages = 1;

  /**
   * Pages shown on each side of the current page.
   * @default 1
   */
  @property({ type: Number, reflect: true, attribute: 'sibling-count' }) siblingCount = 1;

  /**
   * Hides the jump-to-page field.
   * @default false
   */
  @property({ type: Boolean, reflect: true, attribute: 'hide-jump-to-page' })
  hideJumpToPage = false;

  /**
   * Visible caption and accessible name of the jump-to-page field.
   * @default 'Go to page'
   */
  @property({ type: String, attribute: 'jump-label' }) jumpLabel = 'Go to page';

  /**
   * Accessible name of the previous-page button.
   * @default 'Previous page'
   */
  @property({ type: String, attribute: 'prev-label' }) prevLabel = 'Previous page';

  /**
   * Accessible name of the next-page button.
   * @default 'Next page'
   */
  @property({ type: String, attribute: 'next-label' }) nextLabel = 'Next page';

  /**
   * Accessible name of the root `<nav>`.
   * @default 'Pagination'
   */
  @property({ type: String }) label = 'Pagination';

  /**
   * Builds the accessible name of a page item. Property-only (function type).
   * @default page => `Page ${page}`
   */
  @property({ attribute: false }) itemAriaLabel: (page: number) => string = (page) =>
    `Page ${page}`;

  /** Draft value of the jump field; `null` mirrors `currentPage`. */
  @state() private _draft: string | null = null;

  @state() private _hasPageLabel = false;

  private get _total(): number {
    return Math.max(1, Math.floor(this.totalPages));
  }

  private get _current(): number {
    return Math.min(Math.max(1, Math.floor(this.currentPage)), this._total);
  }

  private _emitChange(page: number, source: PaginationChangeDetail['source']) {
    this.dispatchEvent(
      new CustomEvent<PaginationChangeDetail>('ui-change', {
        detail: { page, source },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _onItemClick(page: number) {
    if (page !== this._current) this._emitChange(page, 'item');
  }

  private _onPrevClick() {
    if (this._current > 1) this._emitChange(this._current - 1, 'prev');
  }

  private _onNextClick() {
    if (this._current < this._total) this._emitChange(this._current + 1, 'next');
  }

  private _onJumpInput(event: Event) {
    this._draft = (event.target as HTMLInputElement).value;
  }

  private _onJumpKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') this._commitJump();
  }

  private _commitJump() {
    if (this._draft === null) return;
    const parsed = Number.parseInt(this._draft.trim(), 10);
    this._draft = null;
    if (!Number.isNaN(parsed)) {
      const page = Math.min(Math.max(1, parsed), this._total);
      if (page !== this._current) this._emitChange(page, 'jump');
    }
    // Rapid input + commit can coalesce into one update, so the draft never
    // reaches the template binding and Lit's dirty-check would skip resetting
    // the input — sync the DOM value imperatively (after the change event, so
    // a synchronous currentPage update is already reflected).
    const input = this.shadowRoot?.querySelector<HTMLInputElement>('.jump-input');
    if (input) input.value = String(this._current);
  }

  private _onPageLabelSlotChange(event: Event) {
    const slot = event.target as HTMLSlotElement;
    this._hasPageLabel = slot
      .assignedNodes({ flatten: true })
      .some(
        (node) =>
          node.nodeType === Node.ELEMENT_NODE || (node.textContent ?? '').trim() !== '',
      );
  }

  override render() {
    const current = this._current;
    const total = this._total;
    const entries = paginate(current, total, this.siblingCount);

    return html`
      <nav class="root" aria-label=${this.label}>
        <ui-icon-button
          class="prev"
          variant="ghost"
          label=${this.prevLabel}
          ?disabled=${current <= 1}
          @click=${this._onPrevClick}
        >
          ${unsafeSVG(svgMap['icon-chevron-left'])}
        </ui-icon-button>
        <ul class="items">
          ${entries.map((entry) =>
            entry === 'ellipsis'
              ? html`
                  <li class="cell" aria-hidden="true"><span class="ellipsis">…</span></li>
                `
              : html`
                  <li class="cell">
                    <button
                      type="button"
                      class="item ${entry === current ? 'item--current' : ''}"
                      aria-label=${this.itemAriaLabel(entry)}
                      aria-current=${entry === current ? 'page' : nothing}
                      @click=${() => this._onItemClick(entry)}
                    >
                      ${entry}
                    </button>
                  </li>
                `,
          )}
        </ul>
        <ui-icon-button
          class="next"
          variant="ghost"
          label=${this.nextLabel}
          ?disabled=${current >= total}
          @click=${this._onNextClick}
        >
          ${unsafeSVG(svgMap['icon-chevron-right'])}
        </ui-icon-button>
        <div class="meta">
          <span class="page-label ${this._hasPageLabel ? '' : 'empty'}">
            <slot name="page-label" @slotchange=${this._onPageLabelSlotChange}></slot>
          </span>
          ${this.hideJumpToPage
            ? nothing
            : html`
                <div class="jump">
                  <span class="jump-label" aria-hidden="true">${this.jumpLabel}</span>
                  <input
                    class="jump-input"
                    type="text"
                    inputmode="numeric"
                    autocomplete="off"
                    aria-label=${this.jumpLabel}
                    .value=${this._draft ?? String(current)}
                    @input=${this._onJumpInput}
                    @keydown=${this._onJumpKeydown}
                    @blur=${this._commitJump}
                  />
                </div>
              `}
        </div>
      </nav>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-pagination': UiPagination;
  }
}
