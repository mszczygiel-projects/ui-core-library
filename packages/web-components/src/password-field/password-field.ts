import { LitElement, html, nothing, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { svgMap } from '@mszczygiel-projects/ui-core-icons';
import { textFieldStyles } from '../text-field/text-field.styles.js';
import { passwordFieldStyles } from './password-field.styles.js';
import { motionStyles } from '../styles/motion.styles.js';
import { resetStyles } from '../styles/reset.styles.js';
import { getUiCoreConfig } from '@mszczygiel-projects/ui-core-foundations';

export type PasswordFieldVariant = 'outline' | 'filled' | 'underlined';
export type PasswordFieldSize = 'small' | 'default' | 'large';
export type PasswordFieldState = 'default' | 'success' | 'error' | 'disabled';
export type PasswordFieldLabelPlacement = 'top' | 'floating' | 'inner';

/**
 * Form-associated password input with a show/hide visibility toggle.
 *
 * @element ui-password-field
 *
 * @example
 * ```html
 * <ui-password-field label="Password" hint="Minimum 12 characters"></ui-password-field>
 * ```
 *
 * @fires {Event} input - Native-like input event on every keystroke.
 * @fires {CustomEvent} ui-input - Same moment as `input`; `detail.value` carries the current value.
 * @fires {Event} change - Native-like change event when the value is committed.
 * @fires {CustomEvent} ui-change - Same moment as `change`; `detail.value` carries the current value.
 * @fires {CustomEvent} ui-toggle - Visibility toggle clicked; `detail.showPassword` carries the new state.
 */
@customElement('ui-password-field')
export class UiPasswordField extends LitElement {
  static readonly formAssociated = true;
  static override shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };
  static override styles = [resetStyles, motionStyles, textFieldStyles, passwordFieldStyles];

  /**
   * Container style: bordered, filled background, or bottom border only.
   * @default 'outline'
   */
  @property({ type: String, reflect: true }) variant: PasswordFieldVariant = 'outline';

  /**
   * Field height and typography scale.
   * @default 'default'
   */
  @property({ type: String, reflect: true, attribute: 'data-size' }) size: PasswordFieldSize =
    'default';

  /** Label text. */
  @property({ type: String, reflect: true }) label?: string;

  /**
   * Label position: above the field, floating over it, or inline inside it.
   * @default 'top'
   */
  @property({ type: String, reflect: true, attribute: 'label-placement' })
  labelPlacement: PasswordFieldLabelPlacement = 'top';

  /** Placeholder text shown while empty. */
  @property({ type: String, reflect: true }) placeholder = '';

  /** Current value; the attribute also sets the initial value restored on form reset. */
  @property({ type: String, reflect: true }) value = '';

  /** Helper text rendered below the field, linked via `aria-describedby`. */
  @property({ type: String, reflect: true }) hint?: string;

  /**
   * Validation state; `disabled` also disables the input.
   * @default 'default'
   */
  @property({ type: String, reflect: true }) state: PasswordFieldState = 'default';

  /** Form field name used on submission. */
  @property({ type: String, reflect: true }) name?: string;

  /** Disables the input and the visibility toggle. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Marks the field as required for form submission. */
  @property({ type: Boolean, reflect: true }) required = false;

  /** Makes the input read-only. */
  @property({ type: Boolean, reflect: true }) readonly = false;

  /** Shows the password as plain text; toggled by the built-in eye button. */
  @property({ type: Boolean, reflect: true, attribute: 'show-password' }) showPassword = false;

  /**
   * Accessible name of the visibility toggle while the password is hidden.
   * @default `getUiCoreConfig().labels.passwordField.show`
   */
  @property({ type: String, attribute: 'show-label' }) showLabel?: string;

  /**
   * Accessible name of the visibility toggle while the password is visible.
   * @default `getUiCoreConfig().labels.passwordField.hide`
   */
  @property({ type: String, attribute: 'hide-label' }) hideLabel?: string;

  @state() private _formDisabled = false;

  private _defaultValue = '';
  private _internals: ElementInternals;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  override connectedCallback() {
    super.connectedCallback();
    this._defaultValue = this.value;
    this._syncFormValue();
  }

  private get _isFloating(): boolean {
    return this.labelPlacement === 'floating';
  }

  private get _isInner(): boolean {
    return this.labelPlacement === 'inner';
  }

  private get _isDisabled(): boolean {
    return this.disabled || this.state === 'disabled' || this._formDisabled;
  }

  protected override updated(changedProperties: PropertyValues<this>): void {
    if (
      changedProperties.has('value') ||
      changedProperties.has('disabled') ||
      changedProperties.has('state')
    ) {
      this._syncFormValue();
    }
    this.setAttribute('has-trailing-icon', '');
    this.removeAttribute('has-leading-icon');
  }

  formDisabledCallback(disabled: boolean) {
    // Fires for our own reflected `disabled` attribute as well as for an ancestor
    // <fieldset disabled>. The first case is redundant — `disabled` is already a
    // reactive property — and it arrives mid-update, after render() has read its
    // values, so the write is dropped and leaves the control stale. Track only the
    // ancestor case; `_isDisabled` already ORs in `disabled` itself.
    this._formDisabled = disabled && !this.disabled;
    this._syncFormValue();
  }

  formResetCallback() {
    this.value = this._defaultValue;
  }

  formStateRestoreCallback(state: unknown) {
    if (typeof state === 'string') this.value = state;
  }

  private _syncFormValue() {
    this._internals.setFormValue(this._isDisabled ? null : this.value);
  }

  private _onInput(e: Event) {
    const input = e.target as HTMLInputElement;
    this.value = input.value;
    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    this.dispatchEvent(
      new CustomEvent('ui-input', { detail: { value: this.value }, bubbles: true, composed: true }),
    );
  }

  private _onChange(e: Event) {
    const input = e.target as HTMLInputElement;
    this.value = input.value;
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
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
    const isInner = this._isInner;
    const isDisabled = this._isDisabled;
    const hintId = 'hint';
    const inputType = this.showPassword ? 'text' : 'password';
    const labels = getUiCoreConfig().labels.passwordField;
    const toggleLabel = this.showPassword
      ? (this.hideLabel ?? labels.hide)
      : (this.showLabel ?? labels.show);
    const toggleIcon = this.showPassword ? svgMap['icon-eye'] : svgMap['icon-eye-slash'];

    return html`
      ${!isFloating && !isInner && this.label
        ? html`<label class="label" for="input">${this.label}</label>`
        : nothing}
      <div class="field-wrapper">
        ${isInner && this.label
          ? html`<label class="label" for="input">${this.label}</label>`
          : nothing}
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
