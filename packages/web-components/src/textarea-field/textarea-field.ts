import { LitElement, html, nothing, type PropertyValues } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { textareaFieldStyles } from './textarea-field.styles.js';
import { motionStyles } from '../styles/motion.styles.js';
import { resetStyles } from '../styles/reset.styles.js';

export type TextareaFieldVariant = 'outline' | 'filled' | 'underlined';
export type TextareaFieldSize = 'small' | 'default' | 'large';
export type TextareaFieldState = 'default' | 'success' | 'error' | 'disabled';
export type TextareaFieldLabelPlacement = 'top' | 'floating' | 'inner';
export type TextareaFieldResize = 'none' | 'vertical' | 'auto';

/**
 * Form-associated multi-line text input with label, hint, validation states, and a resize mode.
 *
 * @element ui-textarea-field
 *
 * @example
 * ```html
 * <ui-textarea-field
 *   label="Message"
 *   placeholder="Tell us what happened"
 *   hint="Max 500 characters"
 *   resize="auto"
 * ></ui-textarea-field>
 * ```
 *
 * @fires {Event} input - Native-like input event on every keystroke.
 * @fires {CustomEvent} ui-input - Same moment as `input`; `detail.value` carries the current value.
 * @fires {Event} change - Native-like change event when the value is committed.
 * @fires {CustomEvent} ui-change - Same moment as `change`; `detail.value` carries the current value.
 */
@customElement('ui-textarea-field')
export class UiTextareaField extends LitElement {
  static readonly formAssociated = true;
  static override shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };
  static override styles = [resetStyles, motionStyles, textareaFieldStyles];

  /**
   * Container style: bordered, filled background, or bottom border only.
   * @default 'outline'
   */
  @property({ type: String, reflect: true }) variant: TextareaFieldVariant = 'outline';

  /**
   * Minimum field height and typography scale.
   * @default 'default'
   */
  @property({ type: String, reflect: true, attribute: 'data-size' }) size: TextareaFieldSize =
    'default';

  /** Label text. */
  @property({ type: String, reflect: true }) label?: string;

  /**
   * Label position: above the field, floating over it, or inline inside it.
   * @default 'top'
   */
  @property({ type: String, reflect: true, attribute: 'label-placement' })
  labelPlacement: TextareaFieldLabelPlacement = 'top';

  /** Placeholder text shown while empty. */
  @property({ type: String, reflect: true }) placeholder = '';

  /** Current value; the attribute also sets the initial value restored on form reset. */
  @property({ type: String, reflect: true }) value = '';

  /** Helper text rendered below the field, linked via `aria-describedby`. */
  @property({ type: String, reflect: true }) hint?: string;

  /**
   * Validation state; `error` also sets `aria-invalid`, `disabled` also disables the textarea.
   * @default 'default'
   */
  @property({ type: String, reflect: true }) state: TextareaFieldState = 'default';

  /**
   * How the field may grow: fixed, draggable by the user, or auto-grown to fit its content.
   * `auto` has no maximum — the field keeps growing as the user types.
   * @default 'vertical'
   */
  @property({ type: String, reflect: true }) resize: TextareaFieldResize = 'vertical';

  /** Form field name used on submission. */
  @property({ type: String }) name?: string;

  /** Disables the textarea. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Marks the field as required for form submission. */
  @property({ type: Boolean, reflect: true }) required = false;

  /** Makes the textarea read-only. */
  @property({ type: Boolean, reflect: true }) readonly = false;

  @state() private _formDisabled = false;

  @query('.textarea') private _textareaEl!: HTMLTextAreaElement | null;

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
    this._syncAutoHeight();
  }

  formDisabledCallback(disabled: boolean) {
    this._formDisabled = disabled;
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

  /**
   * Feeds the measured content height to CSS as `--_auto-height`.
   *
   * The height itself is applied by the stylesheet — this only supplies the measurement,
   * which cannot be expressed in CSS alone. Resetting the property to `auto` and then
   * reading `scrollHeight` forces a layout flush, so the value read back is the height
   * the content actually wants rather than the height it currently has.
   */
  private _syncAutoHeight() {
    const el = this._textareaEl;
    if (!el) return;

    if (this.resize !== 'auto') {
      el.style.removeProperty('--_auto-height');
      return;
    }

    el.style.setProperty('--_auto-height', 'auto');
    const contentHeight = el.scrollHeight;
    el.style.setProperty('--_auto-height', `${contentHeight}px`);
  }

  private _onInput(e: Event) {
    const textarea = e.target as HTMLTextAreaElement;
    this.value = textarea.value;
    this._syncAutoHeight();
    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    this.dispatchEvent(
      new CustomEvent('ui-input', { detail: { value: this.value }, bubbles: true, composed: true }),
    );
  }

  private _onChange(e: Event) {
    const textarea = e.target as HTMLTextAreaElement;
    this.value = textarea.value;
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    this.dispatchEvent(
      new CustomEvent('ui-change', {
        detail: { value: this.value },
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

    return html`
      ${!isFloating && !isInner && this.label
        ? html`<label class="label" for="textarea">${this.label}</label>`
        : nothing}
      <div class="field-wrapper">
        ${isInner && this.label
          ? html`<label class="label" for="textarea">${this.label}</label>`
          : nothing}
        <textarea
          id="textarea"
          class="textarea"
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
        ></textarea>
        ${isFloating && this.label
          ? html`<label class="label" for="textarea">${this.label}</label>`
          : nothing}
      </div>
      ${this.hint ? html`<p id=${hintId} class="hint">${this.hint}</p>` : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-textarea-field': UiTextareaField;
  }
}
