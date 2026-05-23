import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { buttonStyles } from './button.styles.js';
import { focusStyles } from '../styles/focus.styles.js';
import { resetStyles } from '../styles/reset.styles.js';
import '../loader/loader.js';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'small' | 'default' | 'large';

@customElement('ui-button')
export class UiButton extends LitElement {
  static override shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };
  static override styles = [resetStyles, focusStyles, buttonStyles];
  static formAssociated = true;

  @property({ type: String, reflect: true }) variant: ButtonVariant = 'primary';
  @property({ type: String, reflect: true, attribute: 'data-size' }) size: ButtonSize = 'default';
  @property({ type: Boolean, reflect: true }) loading = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: String }) type: 'button' | 'submit' | 'reset' = 'button';
  @property({ type: String }) name?: string;
  @property({ type: String }) value = '';
  @property({ type: String }) label?: string;
  @property({ type: Boolean, reflect: true, attribute: 'has-leading-icon' })
  hasLeadingIcon = false;
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
