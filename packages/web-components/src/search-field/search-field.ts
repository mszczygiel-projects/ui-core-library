import { LitElement, html, nothing, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { svgMap } from '@mszczygiel-projects/ui-core-icons';
import { textFieldStyles } from '../text-field/text-field.styles.js';
import { searchFieldStyles } from './search-field.styles.js';
import { motionStyles } from '../styles/motion.styles.js';
import { resetStyles } from '../styles/reset.styles.js';

export type SearchFieldVariant = 'outline' | 'filled' | 'underlined';
export type SearchFieldSize = 'small' | 'default' | 'large';
export type SearchFieldState = 'default' | 'success' | 'error' | 'disabled';
export type SearchFieldLabelPlacement = 'top' | 'floating' | 'inner';

/**
 * Form-associated search input with a leading search icon and a clear button.
 *
 * @element ui-search-field
 *
 * @example
 * ```html
 * <ui-search-field label="Search products" placeholder="Search products..."></ui-search-field>
 * ```
 *
 * @fires {Event} input - Native-like input event on every keystroke and on clear.
 * @fires {CustomEvent} ui-input - Same moment as `input`; `detail.value` carries the current value.
 * @fires {Event} change - Native-like change event when the value is committed.
 * @fires {CustomEvent} ui-change - Same moment as `change`; `detail.value` carries the current value.
 * @fires {CustomEvent} ui-clear - Dispatched when the clear button empties the field.
 */
@customElement('ui-search-field')
export class UiSearchField extends LitElement {
  static readonly formAssociated = true;
  static override shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };
  static override styles = [resetStyles, motionStyles, textFieldStyles, searchFieldStyles];

  /**
   * Container style: bordered, filled background, or bottom border only.
   * @default 'outline'
   */
  @property({ type: String, reflect: true }) variant: SearchFieldVariant = 'outline';

  /**
   * Field height and typography scale.
   * @default 'default'
   */
  @property({ type: String, reflect: true, attribute: 'data-size' }) size: SearchFieldSize =
    'default';

  /** Label text. */
  @property({ type: String, reflect: true }) label?: string;

  /**
   * Label position: above the field, floating over it, or inline inside it.
   * @default 'top'
   */
  @property({ type: String, reflect: true, attribute: 'label-placement' })
  labelPlacement: SearchFieldLabelPlacement = 'top';

  /** Current value; the attribute also sets the initial value restored on form reset. */
  @property({ type: String, reflect: true }) value = '';

  /**
   * Placeholder text shown while empty.
   * @default 'Search...'
   */
  @property({ type: String, reflect: true }) placeholder = 'Search...';

  /** Helper text rendered below the field, linked via `aria-describedby`. */
  @property({ type: String, reflect: true }) hint?: string;

  /**
   * Validation state; `disabled` also disables the input.
   * @default 'default'
   */
  @property({ type: String, reflect: true }) state: SearchFieldState = 'default';

  /** Form field name used on submission. */
  @property({ type: String }) name?: string;

  /** Disables the input and the clear button. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Marks the field as required for form submission. */
  @property({ type: Boolean, reflect: true }) required = false;

  /** Makes the input read-only. */
  @property({ type: Boolean, reflect: true }) readonly = false;

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

  private get _isDisabled(): boolean {
    return this.disabled || this.state === 'disabled' || this._formDisabled;
  }

  private get _isFloating(): boolean {
    return this.labelPlacement === 'floating';
  }

  private get _isInner(): boolean {
    return this.labelPlacement === 'inner';
  }

  protected override updated(changedProperties: PropertyValues<this>): void {
    if (
      changedProperties.has('value') ||
      changedProperties.has('disabled') ||
      changedProperties.has('state')
    ) {
      this._syncFormValue();
    }
    this.setAttribute('has-leading-icon', '');
    this.setAttribute('has-trailing-icon', '');
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

  private _onClear() {
    this.value = '';
    this.shadowRoot?.querySelector('input')?.focus();
    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    this.dispatchEvent(new CustomEvent('ui-clear', { bubbles: true, composed: true }));
    this.dispatchEvent(
      new CustomEvent('ui-input', { detail: { value: '' }, bubbles: true, composed: true }),
    );
  }

  override render() {
    const isFloating = this._isFloating;
    const isInner = this._isInner;
    const isDisabled = this._isDisabled;
    const hintId = 'hint';
    const hasValue = this.value !== '';

    return html`
      ${!isFloating && !isInner && this.label
        ? html`<label class="label" for="input">${this.label}</label>`
        : nothing}
      <div class="field-wrapper">
        <span class="icon icon--leading" aria-hidden="true">
          ${unsafeSVG(svgMap['icon-search'])}
        </span>
        ${isInner && this.label
          ? html`<label class="label" for="input">${this.label}</label>`
          : nothing}
        <input
          id="input"
          class="input"
          type="search"
          name=${this.name ?? nothing}
          .value=${this.value}
          placeholder=${isFloating ? ' ' : this.placeholder}
          ?disabled=${isDisabled}
          ?required=${this.required}
          ?readonly=${this.readonly}
          aria-describedby=${this.hint ? hintId : nothing}
          @input=${this._onInput}
          @change=${this._onChange}
        />
        ${isFloating && this.label
          ? html`<label class="label" for="input">${this.label}</label>`
          : nothing}
        <button
          class="clear icon icon--trailing"
          type="button"
          aria-label="Clear search"
          aria-hidden=${hasValue ? nothing : 'true'}
          tabindex=${hasValue ? '0' : '-1'}
          ?disabled=${isDisabled}
          @click=${this._onClear}
        >
          ${unsafeSVG(svgMap['icon-close'])}
        </button>
      </div>
      ${this.hint ? html`<p id=${hintId} class="hint">${this.hint}</p>` : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-search-field': UiSearchField;
  }
}
