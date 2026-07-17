import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { buttonStyles } from './button.styles.js';
import { focusStyles } from '../styles/focus.styles.js';
import { resetStyles } from '../styles/reset.styles.js';
import '../loader/loader.js';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'small' | 'default' | 'large';

/**
 * Primary interactive control for triggering actions, with variant, size, icon, and loading support.
 *
 * @element ui-button
 *
 * @example
 * ```html
 * <ui-button variant="secondary" data-size="large">Save changes</ui-button>
 * ```
 *
 * @slot - Button label content.
 * @slot icon-left - Icon inside the content area, before the label.
 * @slot icon-right - Icon inside the content area, after the label.
 * @slot leading-icon - Icon in a separated box at the leading edge; requires `has-leading-icon`.
 * @slot trailing-icon - Icon in a separated box at the trailing edge; requires `has-trailing-icon`.
 *
 * @fires {CustomEvent} leading-icon-click - Leading icon box clicked in split mode (`split-leading`).
 * @fires {CustomEvent} trailing-icon-click - Trailing icon box clicked in split mode (`split-trailing`).
 */
@customElement('ui-button')
export class UiButton extends LitElement {
  static override shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };
  static override styles = [resetStyles, focusStyles, buttonStyles];
  static formAssociated = true;

  /**
   * Visual emphasis of the button.
   * @default 'primary'
   */
  @property({ type: String, reflect: true }) variant: ButtonVariant = 'primary';

  /**
   * Overall button height and typography scale.
   * @default 'default'
   */
  @property({ type: String, reflect: true, attribute: 'data-size' }) size: ButtonSize = 'default';

  /** Replaces content with a spinner and disables interaction. */
  @property({ type: Boolean, reflect: true }) loading = false;

  /** Disables the button. */
  @property({ type: Boolean }) disabled = false;

  /**
   * Native button type; `submit` and `reset` act on the associated form.
   * @default 'button'
   */
  @property({ type: String }) type: 'button' | 'submit' | 'reset' = 'button';

  /** Form field name submitted together with `value` when type is `submit`. */
  @property({ type: String }) name?: string;

  /** Form value submitted under `name` when type is `submit`. */
  @property({ type: String }) value = '';

  /** Accessible name; use when the visible label is missing or insufficient. */
  @property({ type: String }) label?: string;

  /** Reserves the leading icon box; assign content via the `leading-icon` slot. */
  @property({ type: Boolean, reflect: true, attribute: 'has-leading-icon' })
  hasLeadingIcon = false;

  /** Reserves the trailing icon box; assign content via the `trailing-icon` slot. */
  @property({ type: Boolean, reflect: true, attribute: 'has-trailing-icon' })
  hasTrailingIcon = false;

  /**
   * Enables split mode for the leading icon box.
   * When true, the leading zone becomes independently interactive and dispatches
   * a `leading-icon-click` CustomEvent instead of bubbling to the button's click.
   */
  @property({ type: Boolean, reflect: true, attribute: 'split-leading' })
  splitLeading = false;

  /**
   * Enables split mode for the trailing icon box.
   * When true, the trailing zone becomes independently interactive and dispatches
   * a `trailing-icon-click` CustomEvent instead of bubbling to the button's click.
   */
  @property({ type: Boolean, reflect: true, attribute: 'split-trailing' })
  splitTrailing = false;

  private internals: ElementInternals;

  constructor() {
    super();
    this.internals = this.attachInternals();
  }

  private get loaderSize(): 'small' | 'default' {
    return this.size === 'large' ? 'default' : 'small';
  }

  private get isDisabled(): boolean {
    return this.disabled || this.loading;
  }

  private handleClick() {
    if (this.type === 'submit') {
      this.internals.setFormValue(this.name ? this.value : null);
      this.internals.form?.requestSubmit();
      queueMicrotask(() => {
        this.internals.setFormValue(null);
      });
    } else if (this.type === 'reset') {
      this.internals.form?.reset();
    }
  }

  private handleLeadingClick(e: Event) {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent('leading-icon-click', { bubbles: true, composed: true }));
  }

  private handleTrailingClick(e: Event) {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent('trailing-icon-click', { bubbles: true, composed: true }));
  }

  private makeIconKeyDownHandler(eventName: 'leading-icon-click' | 'trailing-icon-click') {
    return (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.dispatchEvent(new CustomEvent(eventName, { bubbles: true, composed: true }));
      }
    };
  }

  override render() {
    const isSplitLeading = this.splitLeading && !this.isDisabled;
    const isSplitTrailing = this.splitTrailing && !this.isDisabled;

    return html`
      <button
        type=${this.type}
        name=${this.name ?? nothing}
        value=${this.value}
        ?disabled=${this.isDisabled}
        aria-busy=${this.loading ? 'true' : nothing}
        aria-label=${this.label ?? nothing}
        @click=${this.handleClick}
      >
        ${this.hasLeadingIcon
          ? html`
              <span
                class=${classMap({
                  'icon-box': true,
                  'icon-box--leading': true,
                  'icon-box--split': isSplitLeading,
                })}
                role=${isSplitLeading ? 'button' : nothing}
                tabindex=${isSplitLeading ? '0' : nothing}
                aria-label=${isSplitLeading ? 'Leading action' : nothing}
                @click=${isSplitLeading ? this.handleLeadingClick : nothing}
                @keydown=${isSplitLeading
                  ? this.makeIconKeyDownHandler('leading-icon-click')
                  : nothing}
              >
                <slot name="leading-icon"></slot>
              </span>
              <span class="separator" aria-hidden="true"></span>
            `
          : nothing}
        <span class="content">
          ${this.loading
            ? html`<ui-loader data-size=${this.loaderSize} label="Loading"></ui-loader>`
            : html`<slot name="icon-left"></slot>`}
          <span class="label"><slot></slot></span>
          ${this.loading ? nothing : html`<slot name="icon-right"></slot>`}
        </span>
        ${this.hasTrailingIcon
          ? html`
              <span class="separator" aria-hidden="true"></span>
              <span
                class=${classMap({
                  'icon-box': true,
                  'icon-box--trailing': true,
                  'icon-box--split': isSplitTrailing,
                })}
                role=${isSplitTrailing ? 'button' : nothing}
                tabindex=${isSplitTrailing ? '0' : nothing}
                aria-label=${isSplitTrailing ? 'Trailing action' : nothing}
                @click=${isSplitTrailing ? this.handleTrailingClick : nothing}
                @keydown=${isSplitTrailing
                  ? this.makeIconKeyDownHandler('trailing-icon-click')
                  : nothing}
              >
                <slot name="trailing-icon"></slot>
              </span>
            `
          : nothing}
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-button': UiButton;
  }
}
