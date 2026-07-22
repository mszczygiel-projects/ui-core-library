import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { svgMap } from '@mszczygiel-projects/ui-core-icons';
import { getUiCoreConfig } from '@mszczygiel-projects/ui-core-foundations';
import { breadcrumbsStyles } from './breadcrumbs.styles.js';
import { focusStyles } from '../styles/focus.styles.js';
import { resetStyles } from '../styles/reset.styles.js';

export type BreadcrumbsSize = 'small' | 'medium';
export type BreadcrumbsSeparator = 'chevron' | 'slash';

export interface BreadcrumbsItem {
  /** Visible text of the crumb. */
  label: string;
  /**
   * Target URL. A crumb without one renders as plain text — a breadcrumb that
   * navigates should always be a real link, so keyboard and middle-click work.
   */
  href?: string;
  /** Leading icon; a key of the icon set's `svgMap` (e.g. `icon-home`). */
  icon?: string;
}

export interface BreadcrumbsSelectDetail {
  /** The clicked item. */
  item: BreadcrumbsItem;
  /** Its index in `items`. */
  index: number;
}

/**
 * Hierarchical navigation trail. The last item is always the current page: it
 * renders as plain text with `aria-current="page"` and never links.
 *
 * Responsive by itself — the trail wraps when it runs out of room, and below the
 * `48rem` breakpoint it collapses to a leading `…` plus the last two crumbs. The
 * collapsed crumbs leave the layout but stay in the accessibility tree, so the
 * full path is still announced.
 *
 * @element ui-breadcrumbs
 *
 * @example
 * ```html
 * <ui-breadcrumbs
 *   .items=${[
 *     { label: 'Home', href: '/', icon: 'icon-home' },
 *     { label: 'Products', href: '/products' },
 *     { label: 'Widget' },
 *   ]}
 * ></ui-breadcrumbs>
 * ```
 *
 * @fires {CustomEvent} ui-select - A crumb was clicked; `detail` carries `item` and `index`. Cancel it to suppress the browser's navigation and route client-side instead.
 *
 * @cssprop --breadcrumbs-label-max-width - Caps a crumb's width; longer labels truncate with an ellipsis. Defaults to `none`.
 */
@customElement('ui-breadcrumbs')
export class UiBreadcrumbs extends LitElement {
  static override styles = [resetStyles, focusStyles, breadcrumbsStyles];

  /** The trail, root first. The last entry is the current page. Property-only (array type). */
  @property({ attribute: false }) items: BreadcrumbsItem[] = [];

  /**
   * Typography and icon scale.
   * @default 'medium'
   */
  @property({ type: String, reflect: true, attribute: 'data-size' }) size: BreadcrumbsSize =
    'medium';

  /**
   * Mark drawn between crumbs.
   * @default 'chevron'
   */
  @property({ type: String, reflect: true }) separator: BreadcrumbsSeparator = 'chevron';

  /**
   * Accessible name of the root `<nav>`.
   * @default `getUiCoreConfig().labels.breadcrumbs.label`
   */
  @property({ type: String }) label?: string;

  private _onSelect(event: MouseEvent, item: BreadcrumbsItem, index: number) {
    const proceed = this.dispatchEvent(
      new CustomEvent<BreadcrumbsSelectDetail>('ui-select', {
        detail: { item, index },
        bubbles: true,
        composed: true,
        cancelable: true,
      }),
    );
    // Cancelling `ui-select` is how a client-side router says "I'll take it":
    // suppress the anchor's own navigation, keeping the href for a11y.
    if (!proceed) event.preventDefault();
  }

  private _renderIcon(item: BreadcrumbsItem) {
    const svg = item.icon ? svgMap[item.icon as keyof typeof svgMap] : undefined;
    return svg ? html`<span class="icon">${unsafeSVG(svg)}</span>` : nothing;
  }

  private _renderSeparator() {
    return html`
      <span class="separator" aria-hidden="true">
        ${this.separator === 'slash' ? '/' : unsafeSVG(svgMap['icon-chevron-right'])}
      </span>
    `;
  }

  override render() {
    const items = this.items ?? [];
    if (items.length === 0) return nothing;

    const lastIndex = items.length - 1;
    const labels = getUiCoreConfig().labels.breadcrumbs;

    return html`
      <nav aria-label=${this.label ?? labels.label}>
        <ol class="list">
          ${items.length > 2
            ? html`
                <li class="ellipsis" aria-hidden="true">
                  <span class="ellipsis-mark">…</span>${this._renderSeparator()}
                </li>
              `
            : nothing}
          ${items.map((item, index) => {
            const isCurrent = index === lastIndex;
            return html`
              <li class="item">
                ${!isCurrent && item.href
                  ? html`
                      <a
                        class="link"
                        href=${ifDefined(item.href)}
                        @click=${(event: MouseEvent) => this._onSelect(event, item, index)}
                      >
                        ${this._renderIcon(item)}<span class="label">${item.label}</span>
                      </a>
                    `
                  : html`
                      <span
                        class="crumb ${isCurrent ? 'crumb--current' : ''}"
                        aria-current=${isCurrent ? 'page' : nothing}
                      >
                        ${this._renderIcon(item)}<span class="label">${item.label}</span>
                      </span>
                    `}
                ${isCurrent ? nothing : this._renderSeparator()}
              </li>
            `;
          })}
        </ol>
      </nav>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-breadcrumbs': UiBreadcrumbs;
  }
}
