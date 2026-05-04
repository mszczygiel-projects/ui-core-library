import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { iconButtonStyles } from './icon-button.styles.js';
import { focusStyles } from '../styles/focus.styles.js';
import { resetStyles } from '../styles/reset.styles.js';
import '../loader/loader.js';

export type IconButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type IconButtonSize = 'small' | 'default' | 'large';

@customElement('ui-icon-button')
export class UiIconButton extends LitElement {
  static override shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };
  static override styles = [resetStyles, focusStyles, iconButtonStyles];

  @property({ type: String, reflect: true }) variant: IconButtonVariant = 'primary';
  @property({ type: String, reflect: true, attribute: 'data-size' }) size: IconButtonSize =
    'default';
  @property({ type: Boolean, reflect: true }) loading = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: String }) type: 'button' | 'submit' | 'reset' = 'button';
  @property({ type: String }) label?: string;

  private get loaderSize(): 'small' | 'default' {
    return this.size === 'large' ? 'default' : 'small';
  }

  override render() {
    return html`
      <button
        type=${this.type}
        ?disabled=${this.disabled || this.loading}
        aria-busy=${this.loading ? 'true' : nothing}
        aria-label=${this.label ?? nothing}
      >
        ${this.loading
          ? html`<ui-loader data-size=${this.loaderSize} label="Loading"></ui-loader>`
          : html`<slot></slot>`}
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-icon-button': UiIconButton;
  }
}
