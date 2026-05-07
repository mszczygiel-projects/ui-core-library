import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { svgMap } from '@ui-core/icons';
import { textFieldStyles } from '../text-field/text-field.styles.js';
import { passwordFieldStyles } from './password-field.styles.js';
import { motionStyles } from '../styles/motion.styles.js';
import { resetStyles } from '../styles/reset.styles.js';

export type PasswordFieldVariant = 'outline' | 'filled' | 'underlined';
export type PasswordFieldSize = 'small' | 'default' | 'large';
export type PasswordFieldState = 'default' | 'success' | 'error' | 'disabled';
export type PasswordFieldLabelPlacement = 'top' | 'floating';

@customElement('ui-password-field')
export class UiPasswordField extends LitElement {
  static override shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };
  static override styles = [resetStyles, motionStyles, textFieldStyles, passwordFieldStyles];

  @property({ type: String, reflect: true }) variant: PasswordFieldVariant = 'outline';
  @property({ type: String, reflect: true, attribute: 'data-size' }) size: PasswordFieldSize =
    'default';
  @property({ type: String, reflect: true }) label?: string;
  @property({ type: String, reflect: true, attribute: 'label-placement' })
  labelPlacement: PasswordFieldLabelPlacement = 'top';
  @property({ type: String, reflect: true }) placeholder = '';
  @property({ type: String, reflect: true }) value = '';
  @property({ type: String, reflect: true }) hint?: string;
  @property({ type: String, reflect: true }) state: PasswordFieldState = 'default';
  @property({ type: String }) name?: string;
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) required = false;
  @property({ type: Boolean, reflect: true }) readonly = false;
  @property({ type: Boolean, reflect: true, attribute: 'show-password' }) showPassword = false;

  private get _isFloating(): boolean {
    if (this.variant === 'filled') return false;
    if (this.variant === 'underlined') return true;
    return this.labelPlacement === 'floating';
  }

  private get _isDisabled(): boolean {
    return this.disabled || this.state === 'disabled';
  }

  protected override updated(): void {
    this.setAttribute('has-trailing-icon', '');
    this.removeAttribute('has-leading-icon');
  }

  private _onInput(e: Event) {
    const input = e.target as HTMLInputElement;
    this.value = input.value;
    this.dispatchEvent(
      new CustomEvent('ui-input', { detail: { value: this.value }, bubbles: true, composed: true }),
    );
  }

  private _onChange(e: Event) {
    const input = e.target as HTMLInputElement;
    this.value = input.value;
    this.dispatchEvent(
      new CustomEvent('ui-change', {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _onToggle() {
    this.showPassword = !this.showPassword;
    this.dispatchEvent(
      new CustomEvent('ui-toggle', {
        detail: { showPassword: this.showPassword },
        bubbles: true,
        composed: true,
      }),
    );
  }

  override render() {
    const isFloating = this._isFloating;
    const isDisabled = this._isDisabled;
    const hintId = 'hint';
    const inputType = this.showPassword ? 'text' : 'password';
    const toggleLabel = this.showPassword ? 'Hide password' : 'Show password';
    const toggleIcon = this.showPassword ? svgMap['icon-eye'] : svgMap['icon-eye-slash'];

    return html`
      ${!isFloating && this.label
        ? html`<label class="label" for="input">${this.label}</label>`
        : nothing}
      <div class="field-wrapper">
        <input
          id="input"
          class="input"
          type=${inputType}
          name=${this.name ?? nothing}
          .value=${this.value}
          placeholder=${isFloating ? ' ' : this.placeholder}
          ?disabled=${isDisabled}
          ?required=${this.required}
          ?readonly=${this.readonly}
          aria-invalid=${this.state === 'error' ? 'true' : nothing}
          aria-required=${this.required ? 'true' : nothing}
          aria-describedby=${this.hint ? hintId : nothing}
          @input=${this._onInput}
          @change=${this._onChange}
        />
        ${isFloating && this.label
          ? html`<label class="label" for="input">${this.label}</label>`
          : nothing}
        <button
          class="toggle icon icon--trailing"
          type="button"
          aria-label=${toggleLabel}
          aria-pressed=${this.showPassword}
          ?disabled=${isDisabled}
          @click=${this._onToggle}
        >
          ${unsafeSVG(toggleIcon)}
        </button>
      </div>
      ${this.hint ? html`<p id=${hintId} class="hint">${this.hint}</p>` : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-password-field': UiPasswordField;
  }
}
