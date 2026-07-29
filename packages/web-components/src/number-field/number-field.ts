import { LitElement, html, nothing, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { svgMap } from '@mszczygiel-projects/ui-core-icons';
import { textFieldStyles } from '../text-field/text-field.styles.js';
import { numberFieldStyles } from './number-field.styles.js';
import { motionStyles } from '../styles/motion.styles.js';
import { resetStyles } from '../styles/reset.styles.js';
import { commitValue, formatValue, parseValue, stepValue } from './numeric.js';
import { getUiCoreConfig } from '@mszczygiel-projects/ui-core-foundations';

export type NumberFieldVariant = 'outline' | 'filled' | 'underlined';
export type NumberFieldSize = 'small' | 'default' | 'large';
export type NumberFieldState = 'default' | 'success' | 'error' | 'disabled';
export type NumberFieldLabelPlacement = 'top' | 'floating' | 'inner';
export type NumberFieldControls = 'none' | 'inline';

/** Delay before a held stepper starts repeating. The first tick already fired on press. */
const INITIAL_DELAY_MS = 500;
/** Fixed cadence once repeating — no acceleration curve. */
const REPEAT_INTERVAL_MS = 100;

/**
 * Form-associated numeric input with optional flanking stepper buttons.
 *
 * Omitting `label` and `hint` renders a bare field with no surrounding chrome,
 * which suits compact contexts such as a table-cell quantity editor.
 *
 * @element ui-number-field
 *
 * @example
 * ```html
 * <ui-number-field label="Quantity" controls="inline" min="1" max="99"></ui-number-field>
 * ```
 *
 * @fires {Event} input - Native-like input event on every keystroke.
 * @fires {CustomEvent} ui-input - Same moment as `input`; `detail.value` carries the raw text.
 * @fires {Event} change - Native-like change event when the value is committed.
 * @fires {CustomEvent} ui-change - Fired on commit (blur, Enter, arrow key, stepper tick); `detail.value` carries the committed number or `null`.
 */
@customElement('ui-number-field')
export class UiNumberField extends LitElement {
  static readonly formAssociated = true;
  static override shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };
  static override styles = [resetStyles, motionStyles, textFieldStyles, numberFieldStyles];

  /**
   * Container style: bordered, filled background, or bottom border only.
   * @default 'outline'
   */
  @property({ type: String, reflect: true }) variant: NumberFieldVariant = 'outline';

  /**
   * Field height and typography scale.
   * @default 'default'
   */
  @property({ type: String, reflect: true, attribute: 'data-size' }) size: NumberFieldSize =
    'default';

  /**
   * `inline` adds decrement/increment buttons flanking the value.
   * @default 'none'
   */
  @property({ type: String, reflect: true }) controls: NumberFieldControls = 'none';

  /** Current value; `null` means empty. Also the value restored on form reset. */
  @property({ type: Number }) value: number | null = null;

  /**
   * Lower bound, applied on commit.
   * @default -Infinity
   */
  @property({ type: Number }) min = -Infinity;

  /**
   * Upper bound, applied on commit.
   * @default Infinity
   */
  @property({ type: Number }) max = Infinity;

  /**
   * Amount added or removed per step. Independent of `precision`.
   * @default 1
   */
  @property({ type: Number }) step = 1;

  /**
   * Decimal places kept on commit; `0` gives integer behaviour.
   * @default 0
   */
  @property({ type: Number }) precision = 0;

  /** Label text; omit for a bare field. */
  @property({ type: String, reflect: true }) label?: string;

  /**
   * Label position. Forced to `top` when `controls` is `inline`, because the
   * steppers occupy the space a floating or inner label would need.
   * @default 'top'
   */
  @property({ type: String, reflect: true, attribute: 'label-placement' })
  labelPlacement: NumberFieldLabelPlacement = 'top';

  /** Placeholder shown while empty. */
  @property({ type: String, reflect: true }) placeholder = '';

  /** Helper text rendered below the field, linked via `aria-describedby`. */
  @property({ type: String, reflect: true }) hint?: string;

  /**
   * Validation state; `disabled` also disables the input and steppers.
   * @default 'default'
   */
  @property({ type: String, reflect: true }) state: NumberFieldState = 'default';

  /** Form field name used on submission. */
  @property({ type: String }) name?: string;

  /** Disables the input and both steppers. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Marks the field as required for form submission. */
  @property({ type: Boolean, reflect: true }) required = false;

  /** Makes the input read-only; steppers are disabled too. */
  @property({ type: Boolean, reflect: true }) readonly = false;

  /**
   * Accessible name for the decrement button.
   * @default `getUiCoreConfig().labels.numberField.decrement`
   */
  @property({ type: String, attribute: 'decrement-label' }) decrementLabel?: string;

  /**
   * Accessible name for the increment button.
   * @default `getUiCoreConfig().labels.numberField.increment`
   */
  @property({ type: String, attribute: 'increment-label' }) incrementLabel?: string;

  @state() private _text = '';
  @state() private _formDisabled = false;

  private _editing = false;
  private _defaultValue: number | null = null;
  private _holdTimeout?: number;
  private _holdInterval?: number;
  private _internals: ElementInternals;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  override connectedCallback() {
    super.connectedCallback();
    this._defaultValue = this.value;
    this._text = formatValue(this.value, this.precision);
    this._syncFormValue();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    // Unmounting mid-hold must not leave a live timer behind.
    this._stopHold();
  }

  private get _isInline(): boolean {
    return this.controls === 'inline';
  }

  private get _isDisabled(): boolean {
    return this.disabled || this.state === 'disabled' || this._formDisabled;
  }

  /** Disabled or read-only — either way the value must not move. */
  private get _isInert(): boolean {
    return this._isDisabled || this.readonly;
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    // Mirror external value changes into the input, but never while the user is
    // typing — a transient "1." must survive until blur.
    if ((changed.has('value') || changed.has('precision')) && !this._editing) {
      this._text = formatValue(this.value, this.precision);
    }
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has('value') || changed.has('disabled') || changed.has('state')) {
      this._syncFormValue();
    }
    // `.icon` is hidden unless the host advertises the slot.
    this.toggleAttribute('has-leading-icon', this._isInline);
    this.toggleAttribute('has-trailing-icon', this._isInline);
  }

  formDisabledCallback(disabled: boolean) {
    this._formDisabled = disabled;
    this._syncFormValue();
  }

  formResetCallback() {
    this.value = this._defaultValue;
    this._editing = false;
    this._text = formatValue(this.value, this.precision);
  }

  formStateRestoreCallback(state: unknown) {
    if (typeof state === 'string') this.value = parseValue(state);
  }

  private _syncFormValue() {
    const serialised = this.value === null ? null : String(this.value);
    this._internals.setFormValue(this._isDisabled ? null : serialised);
  }

  /** Commits a value, updates the input text and notifies listeners when it moved. */
  private _applyValue(next: number | null) {
    const changed = next !== this.value;
    this._editing = false;
    this.value = next;
    this._text = formatValue(next, this.precision);
    if (!changed) return;
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    this.dispatchEvent(
      new CustomEvent('ui-change', {
        detail: { value: next },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _commitText() {
    const parsed = parseValue(this._text);
    this._applyValue(
      parsed === null ? null : commitValue(parsed, this.min, this.max, this.precision),
    );
  }

  /** Performs one step; reports whether the value actually moved. */
  private _step(direction: 1 | -1): boolean {
    if (this._isInert) return false;
    // Step from whatever is currently typed, so a hold continues from there.
    const base = parseValue(this._text) ?? this.value;
    const next = stepValue(base, direction, this.step, this.min, this.max, this.precision);
    const moved = next !== this.value;
    this._applyValue(next);
    return moved;
  }

  private _startHold(direction: 1 | -1) {
    this._stopHold();
    if (!this._step(direction)) return;
    // Release may land outside the button, so the listeners live on the window.
    window.addEventListener('pointerup', this._stopHold);
    window.addEventListener('pointercancel', this._stopHold);
    this._holdTimeout = window.setTimeout(() => {
      this._holdInterval = window.setInterval(() => {
        if (!this._step(direction)) this._stopHold();
      }, REPEAT_INTERVAL_MS);
    }, INITIAL_DELAY_MS);
  }

  private _stopHold = () => {
    if (this._holdTimeout !== undefined) window.clearTimeout(this._holdTimeout);
    if (this._holdInterval !== undefined) window.clearInterval(this._holdInterval);
    this._holdTimeout = undefined;
    this._holdInterval = undefined;
    window.removeEventListener('pointerup', this._stopHold);
    window.removeEventListener('pointercancel', this._stopHold);
  };

  private _onInput(e: Event) {
    const input = e.target as HTMLInputElement;
    this._editing = true;
    this._text = input.value;
    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    this.dispatchEvent(
      new CustomEvent('ui-input', { detail: { value: this._text }, bubbles: true, composed: true }),
    );
  }

  private _onKeyDown(e: KeyboardEvent) {
    // Holding an arrow key repeats via native OS key-repeat — no timer needed.
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      this._step(1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      this._step(-1);
    } else if (e.key === 'Enter') {
      this._commitText();
    }
  }

  private _renderStepper(direction: 1 | -1) {
    const isDecrement = direction === -1;
    const atBound =
      this.value !== null && (isDecrement ? this.value <= this.min : this.value >= this.max);
    return html`
      <button
        class=${`stepper icon icon--${isDecrement ? 'leading' : 'trailing'}`}
        type="button"
        aria-label=${isDecrement
          ? (this.decrementLabel ?? getUiCoreConfig().labels.numberField.decrement)
          : (this.incrementLabel ?? getUiCoreConfig().labels.numberField.increment)}
        ?disabled=${this._isInert || atBound}
        @pointerdown=${(e: PointerEvent) => {
          // Keep focus on the input so typing can continue after a click.
          e.preventDefault();
          this._startHold(direction);
        }}
        @pointerup=${this._stopHold}
        @pointerleave=${this._stopHold}
        @pointercancel=${this._stopHold}
      >
        ${unsafeSVG(svgMap[isDecrement ? 'icon-minus' : 'icon-plus'])}
      </button>
    `;
  }

  override render() {
    const isInline = this._isInline;
    // Steppers occupy the space a floating or inner label would need.
    const placement = isInline ? 'top' : this.labelPlacement;
    const isFloating = placement === 'floating';
    const isInner = placement === 'inner';
    const isDisabled = this._isDisabled;
    const hintId = 'hint';

    const labelEl = this.label
      ? html`<label class="label" for="input">${this.label}</label>`
      : nothing;

    return html`
      ${!isFloating && !isInner ? labelEl : nothing}
      <div class="field-wrapper">
        ${isInner ? labelEl : nothing} ${isInline ? this._renderStepper(-1) : nothing}
        <input
          id="input"
          class="input"
          type="text"
          role="spinbutton"
          inputmode=${this.precision > 0 ? 'decimal' : 'numeric'}
          pattern=${this.precision > 0 ? '[0-9]*[.,]?[0-9]*' : '[0-9]*'}
          autocomplete="off"
          name=${this.name ?? nothing}
          .value=${this._text}
          placeholder=${isFloating ? ' ' : this.placeholder}
          ?disabled=${isDisabled}
          ?required=${this.required}
          ?readonly=${this.readonly}
          aria-invalid=${this.state === 'error' ? 'true' : nothing}
          aria-required=${this.required ? 'true' : nothing}
          aria-describedby=${this.hint ? hintId : nothing}
          aria-valuenow=${this.value ?? nothing}
          aria-valuemin=${Number.isFinite(this.min) ? this.min : nothing}
          aria-valuemax=${Number.isFinite(this.max) ? this.max : nothing}
          @input=${this._onInput}
          @change=${(e: Event) => e.stopPropagation()}
          @blur=${() => this._commitText()}
          @keydown=${this._onKeyDown}
        />
        ${isFloating ? labelEl : nothing} ${isInline ? this._renderStepper(1) : nothing}
      </div>
      ${this.hint ? html`<p id=${hintId} class="hint">${this.hint}</p>` : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-number-field': UiNumberField;
  }
}
