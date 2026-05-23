import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { type ButtonVariant, type ButtonSize } from '../button/button.js';
import { buttonStyles } from '../button/button.styles.js';
import { linkButtonStyles } from './link-button.styles.js';
import { focusStyles } from '../styles/focus.styles.js';
import { resetStyles } from '../styles/reset.styles.js';
import '../loader/loader.js';

export type { ButtonVariant as LinkButtonVariant, ButtonSize as LinkButtonSize };

@customElement('ui-link-button')
export class UiLinkButton extends LitElement {
  static override shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };
  static override styles = [resetStyles, focusStyles, buttonStyles, linkButtonStyles];

  @property({ type: String, reflect: true }) variant: ButtonVariant = 'primary';
  @property({ type: String, reflect: true, attribute: 'data-size' }) size: ButtonSize = 'default';
  @property({ type: Boolean, reflect: true }) loading = false;
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: String, reflect: true }) href = '';
  @property({ type: String, reflect: true }) target?: string;
  @property({ type: String, reflect: true }) rel?: string;
  @property({ type: String }) label?: string;
  @property({ type: Boolean, reflect: true, attribute: 'has-leading-icon' })
  hasLeadingIcon = false;
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
            ? html`<ui-loader data-size=${this.loaderSize} label="Loading"></ui-loader>`
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
