import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
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

  private internals: ElementInternals;

  constructor() {
    super();
    this.internals = this.attachInternals();
  }

  private get loaderSize(): 'small' | 'default' {
    return this.size === 'large' ? 'default' : 'small';
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

  override render() {
    return html`
      <button
        type=${this.type}
        name=${this.name ?? nothing}
        value=${this.value}
        ?disabled=${this.disabled || this.loading}
        aria-busy=${this.loading ? 'true' : nothing}
        aria-label=${this.label ?? nothing}
        @click=${this.handleClick}
      >
        ${this.loading
          ? html`<ui-loader data-size=${this.loaderSize} label="Loading"></ui-loader>`
          : html`<slot name="icon-left"></slot>`}
        <span class="label"><slot></slot></span>
        ${this.loading ? nothing : html`<slot name="icon-right"></slot>`}
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-button': UiButton;
  }
}
