import { LitElement, html, nothing, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { svgMap } from '@mszczygiel-projects/ui-core-icons';
import { textFieldStyles } from './text-field.styles.js';
import { motionStyles } from '../styles/motion.styles.js';
import { resetStyles } from '../styles/reset.styles.js';

export type TextFieldVariant = 'outline' | 'filled' | 'underlined';
export type TextFieldSize = 'small' | 'default' | 'large';
export type TextFieldState = 'default' | 'success' | 'error' | 'disabled';
export type TextFieldLabelPlacement = 'top' | 'floating' | 'inner';

@customElement('ui-text-field')
export class UiTextField extends LitElement {
  static readonly formAssociated = true;
  static override shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };
  static override styles = [resetStyles, motionStyles, textFieldStyles];

  @property({ type: String, reflect: true }) variant: TextFieldVariant = 'outline';
  @property({ type: String, reflect: true, attribute: 'data-size' }) size: TextFieldSize =
    'default';
  @property({ type: String, reflect: true }) label?: string;
  @property({ type: String, reflect: true, attribute: 'label-placement' })
  labelPlacement: TextFieldLabelPlacement = 'top';
  @property({ type: String, reflect: true }) placeholder = '';
  @property({ type: String, reflect: true }) value = '';
  @property({ type: String, reflect: true }) hint?: string;
  @property({ type: String, reflect: true }) state: TextFieldState = 'default';
  @property({ type: String }) name?: string;
  @property({ type: String }) type: 'text' | 'email' | 'tel' | 'url' = 'text';
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) required = false;
  @property({ type: Boolean, reflect: true }) readonly = false;

  @state() private _hasLeadingIcon = false;
  @state() private _hasTrailingIcon = false;
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

  private get _showsErrorTrailingIcon(): boolean {
    return this.state === 'error' && !this._hasTrailingIcon;
  }

  protected override updated(changedProperties: PropertyValues<this>): void {
    if (
      changedProperties.has('value') ||
      changedProperties.has('disabled') ||
      changedProperties.has('state')
    ) {
      this._syncFormValue();
    }
    this.toggleAttribute('has-leading-icon', this._hasLeadingIcon);
    this.toggleAttribute(
      'has-trailing-icon',
      this._hasTrailingIcon || this._showsErrorTrailingIcon,
    );
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

  private _onLeadingSlotChange(e: Event) {
    const slot = e.target as HTMLSlotElement;
    this._hasLeadingIcon = slot.assignedElements().length > 0;
  }

  private _onTrailingSlotChange(e: Event) {
    const slot = e.target as HTMLSlotElement;
    this._hasTrailingIcon = slot.assignedElements().length > 0;
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

  override render() {
    const isFloating = this._isFloating;
    const isInner = this._isInner;
    const isDisabled = this._isDisabled;
    const hintId = 'hint';

    return html`
      ${!isFloating && !isInner && this.label
        ? html`<label class="label" for="input">${this.label}</label>`
        : nothing}
      <div class="field-wrapper">
        ${isInner && this.label
          ? html`<label class="label" for="input">${this.label}</label>`
          : nothing}
        <slot
          name="leading-icon"
          class="icon icon--leading"
          @slotchange=${this._onLeadingSlotChange}
        ></slot>
        <input
          id="input"
          class="input"
          type=${this.type}
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
        <slot
          name="trailing-icon"
          class="icon icon--trailing"
          @slotchange=${this._onTrailingSlotChange}
        >
          ${this._showsErrorTrailingIcon
            ? html`<span class="icon-content" aria-hidden="true"
                >${unsafeSVG(svgMap['icon-danger'])}</span
              >`
            : nothing}
        </slot>
      </div>
      ${this.hint ? html`<p id=${hintId} class="hint">${this.hint}</p>` : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-text-field': UiTextField;
  }
}
