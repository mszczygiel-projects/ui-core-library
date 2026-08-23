import { LitElement, html, nothing, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { radioFieldStyles } from './radio-field.styles.js';
import { resetStyles } from '../styles/reset.styles.js';
import { motionStyles } from '../styles/motion.styles.js';

export type RadioFieldState = 'default' | 'error' | 'disabled';

/**
 * Form-associated single radio button with label and hint; group radios by giving them the same `name`.
 *
 * @element ui-radio-field
 *
 * @example
 * ```html
 * <ui-radio-field name="plan" value="pro" label="Pro plan"></ui-radio-field>
 * ```
 *
 * @fires {Event} change - Native-like change event after user interaction.
 * @fires {CustomEvent} ui-change - Same moment as `change`; `detail.checked` carries the new state.
 */
@customElement('ui-radio-field')
export class UiRadioField extends LitElement {
  static readonly formAssociated = true;
  static override shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };
  static override styles = [resetStyles, motionStyles, radioFieldStyles];

  /** Label text rendered next to the radio. */
  @property({ type: String, reflect: true }) label = '';

  /** Helper text rendered below the radio, linked via `aria-describedby`. */
  @property({ type: String, reflect: true }) hint?: string;

  /** Checked state; the attribute also sets the initial state restored on form reset. */
  @property({ type: Boolean, reflect: true }) checked = false;

  /**
   * Validation state; `disabled` also disables the input.
   * @default 'default'
   */
  @property({ type: String, reflect: true }) state: RadioFieldState = 'default';

  /** Disables the radio. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Form field name — radios with the same name form a group. */
  @property({ type: String, reflect: true }) name?: string;

  /**
   * Value submitted with the form when selected.
   * @default 'on'
   */
  @property({ type: String }) value = 'on';

  /** Marks the radio group as required for form submission. */
  @property({ type: Boolean, reflect: true }) required = false;

  @state() private _formDisabled = false;

  private _defaultChecked = false;
  private _internals: ElementInternals;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  override connectedCallback() {
    super.connectedCallback();
    this._defaultChecked = this.checked;
    this._syncFormValue();
  }

  private get _isDisabled(): boolean {
    return this.disabled || this.state === 'disabled' || this._formDisabled;
  }

  protected override updated(changedProperties: PropertyValues<this>): void {
    if (
      changedProperties.has('checked') ||
      changedProperties.has('disabled') ||
      changedProperties.has('state') ||
      changedProperties.has('value')
    ) {
      this._syncFormValue();
    }
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
    this.checked = this._defaultChecked;
  }

  formStateRestoreCallback(state: unknown) {
    this.checked = state === 'checked';
  }

  private _syncFormValue() {
    this._internals.setFormValue(
      this._isDisabled || !this.checked ? null : this.value,
      this.checked ? 'checked' : undefined,
    );
  }

  private _onChange(e: Event): void {
    const input = e.target as HTMLInputElement;
    this.checked = input.checked;
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    this.dispatchEvent(
      new CustomEvent('ui-change', {
        detail: { checked: this.checked },
        bubbles: true,
        composed: true,
      }),
    );
  }

  override render() {
    const hintId = 'hint';

    return html`
      <label class="label-row">
        <span class="control">
          <input
            class="input"
            type="radio"
            .checked=${this.checked}
            ?disabled=${this._isDisabled}
            ?required=${this.required}
            name=${this.name ?? nothing}
            value=${this.value}
            aria-invalid=${this.state === 'error' ? 'true' : nothing}
            aria-describedby=${this.hint ? hintId : nothing}
            @change=${this._onChange}
          />
        </span>
        ${this.label ? html`<span class="label-text">${this.label}</span>` : nothing}
      </label>
      ${this.hint ? html`<p id=${hintId} class="hint">${this.hint}</p>` : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-radio-field': UiRadioField;
  }
}
