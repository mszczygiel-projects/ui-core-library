import { LitElement, html, nothing, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { switchFieldStyles } from './switch-field.styles.js';
import { resetStyles } from '../styles/reset.styles.js';
import { motionStyles } from '../styles/motion.styles.js';

export type SwitchFieldState = 'default' | 'error' | 'disabled';
export type SwitchFieldLabelPosition = 'left' | 'right';

/**
 * Form-associated on/off switch with an optional label and description.
 *
 * @element ui-switch-field
 *
 * @example
 * ```html
 * <ui-switch-field
 *   label="Email notifications"
 *   description="Receive notifications at your email address"
 *   label-position="left"
 * ></ui-switch-field>
 * ```
 *
 * @slot icon-on - Icon shown inside the thumb while the switch is on.
 * @slot icon-off - Icon shown inside the thumb while the switch is off.
 *
 * @fires {Event} change - Native-like change event after user interaction.
 * @fires {CustomEvent} ui-change - Same moment as `change`; `detail.checked` carries the new state.
 */
@customElement('ui-switch-field')
export class UiSwitchField extends LitElement {
  static readonly formAssociated = true;
  static override shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };
  static override styles = [resetStyles, motionStyles, switchFieldStyles];

  /** Label text rendered next to the switch. */
  @property({ type: String, reflect: true }) label = '';

  /** Secondary text rendered under the label, linked via `aria-describedby`. */
  @property({ type: String, reflect: true }) description?: string;

  /**
   * Which side the label and description sit on. `left` renders a full-width
   * settings row with the switch pushed to the trailing edge.
   * @default 'right'
   */
  @property({ type: String, reflect: true, attribute: 'label-position' })
  labelPosition: SwitchFieldLabelPosition = 'right';

  /** On/off state; the attribute also sets the initial state restored on form reset. */
  @property({ type: Boolean, reflect: true }) checked = false;

  /**
   * Validation state; `disabled` also disables the input.
   * @default 'default'
   */
  @property({ type: String, reflect: true }) state: SwitchFieldState = 'default';

  /** Disables the switch. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Form field name used on submission. */
  @property({ type: String, reflect: true }) name?: string;

  /**
   * Value submitted with the form when the switch is on.
   * @default 'on'
   */
  @property({ type: String }) value = 'on';

  /** Marks the switch as required for form submission. */
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
    const descriptionId = 'description';

    return html`
      <label class="row">
        <span class="control">
          <span class="track">
            <span class="thumb">
              <span class="icon icon--off"><slot name="icon-off"></slot></span>
              <span class="icon icon--on"><slot name="icon-on"></slot></span>
            </span>
          </span>
          <input
            class="input"
            type="checkbox"
            role="switch"
            .checked=${this.checked}
            ?disabled=${this._isDisabled}
            ?required=${this.required}
            name=${this.name ?? nothing}
            value=${this.value}
            aria-invalid=${this.state === 'error' ? 'true' : nothing}
            aria-describedby=${this.description ? descriptionId : nothing}
            @change=${this._onChange}
          />
        </span>
        <span class="text">
          ${this.label ? html`<span class="label">${this.label}</span>` : nothing}
          ${this.description
            ? html`<span id=${descriptionId} class="description">${this.description}</span>`
            : nothing}
        </span>
      </label>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-switch-field': UiSwitchField;
  }
}
