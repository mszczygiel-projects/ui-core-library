import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { type ButtonVariant, type ButtonSize } from '../button/button.js';
import { buttonStyles } from '../button/button.styles.js';
import { linkButtonStyles } from './link-button.styles.js';
import { focusStyles } from '../styles/focus.styles.js';
import { resetStyles } from '../styles/reset.styles.js';
import { getUiCoreConfig } from '@mszczygiel-projects/ui-core-foundations';
import '../loader/loader.js';

export type { ButtonVariant as LinkButtonVariant, ButtonSize as LinkButtonSize };

/**
 * Anchor element styled as a button, for navigation that should look like an action.
 *
 * @element ui-link-button
 *
 * @example
 * ```html
 * <ui-link-button href="/pricing" variant="outline">See pricing</ui-link-button>
 * ```
 *
 * @slot - Link label content.
 * @slot icon-left - Icon inside the content area, before the label.
 * @slot icon-right - Icon inside the content area, after the label.
 * @slot leading-icon - Icon in a separated box at the leading edge; requires `has-leading-icon`.
 * @slot trailing-icon - Icon in a separated box at the trailing edge; requires `has-trailing-icon`.
 */
@customElement('ui-link-button')
export class UiLinkButton extends LitElement {
  static override shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };
  static override styles = [resetStyles, focusStyles, buttonStyles, linkButtonStyles];

  /**
   * Visual emphasis of the button.
   * @default 'primary'
   */
  @property({ type: String, reflect: true }) variant: ButtonVariant = 'primary';

  /**
   * Overall height and typography scale.
   * @default 'default'
   */
  @property({ type: String, reflect: true, attribute: 'data-size' }) size: ButtonSize = 'default';

  /** Replaces content with a spinner and blocks navigation. */
  @property({ type: Boolean, reflect: true }) loading = false;

  /**
   * Accessible name of the spinner shown while `loading`.
   * @default `getUiCoreConfig().labels.button.loading`
   */
  @property({ type: String, attribute: 'loading-label' }) loadingLabel?: string;

  /** Blocks navigation and applies disabled styling (`aria-disabled`). */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Destination URL. */
  @property({ type: String, reflect: true }) href = '';

  /** Native anchor target; `_blank` automatically adds `rel="noopener noreferrer"`. */
  @property({ type: String, reflect: true }) target?: string;

  /** Native anchor rel; overrides the automatic `_blank` fallback. */
  @property({ type: String, reflect: true }) rel?: string;

  /** Accessible name; use when the visible label is missing or insufficient. */
  @property({ type: String }) label?: string;

  /** Reserves the leading icon box; assign content via the `leading-icon` slot. */
  @property({ type: Boolean, reflect: true, attribute: 'has-leading-icon' })
  hasLeadingIcon = false;

  /** Reserves the trailing icon box; assign content via the `trailing-icon` slot. */
  @property({ type: Boolean, reflect: true, attribute: 'has-trailing-icon' })
  hasTrailingIcon = false;

  private get computedRel(): string | undefined {
    if (this.rel !== undefined) return this.rel;
    if (this.target === '_blank') return 'noopener noreferrer';
    return undefined;
  }

  private get isInactive(): boolean {
    return this.disabled || this.loading;
  }

  private get loaderSize(): 'small' | 'default' {
    return this.size === 'large' ? 'default' : 'small';
  }

  private handleClick(e: MouseEvent) {
    if (this.isInactive) {
      e.preventDefault();
    }
  }

  override render() {
    return html`
      <a
        href=${this.href}
        target=${this.target ?? nothing}
        rel=${this.computedRel ?? nothing}
        aria-disabled=${this.isInactive ? 'true' : nothing}
        aria-busy=${this.loading ? 'true' : nothing}
        aria-label=${this.label ?? nothing}
        tabindex=${this.isInactive ? '-1' : nothing}
        @click=${this.handleClick}
      >
        ${this.hasLeadingIcon
          ? html`
              <span class="icon-box icon-box--leading">
                <slot name="leading-icon"></slot>
              </span>
              <span class="separator" aria-hidden="true"></span>
            `
          : nothing}

        <span class="content">
          ${this.loading
            ? html`<ui-loader
                data-size=${this.loaderSize}
                label=${this.loadingLabel ?? getUiCoreConfig().labels.button.loading}
              ></ui-loader>`
            : html`<slot name="icon-left"></slot>`}
          <span class="label"><slot></slot></span>
          ${this.loading ? nothing : html`<slot name="icon-right"></slot>`}
        </span>

        ${this.hasTrailingIcon
          ? html`
              <span class="separator" aria-hidden="true"></span>
              <span class="icon-box icon-box--trailing">
                <slot name="trailing-icon"></slot>
              </span>
            `
          : nothing}
      </a>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-link-button': UiLinkButton;
  }
}
