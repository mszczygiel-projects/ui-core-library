import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { textInputStyles } from './text-input.styles.js';
import { motionStyles } from '../styles/motion.styles.js';
import { resetStyles } from '../styles/reset.styles.js';

export type TextInputVariant = 'outline' | 'filled' | 'underlined';
export type TextInputSize = 'small' | 'default' | 'large';
export type TextInputState = 'default' | 'success' | 'error' | 'disabled';
export type TextInputLabelPlacement = 'top' | 'floating';

@customElement('ui-text-input')
export class UiTextInput extends LitElement {
  static override shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };
  static override styles = [resetStyles, motionStyles, textInputStyles];

  @property({ type: String, reflect: true }) variant: TextInputVariant = 'outline';
  @property({ type: String, reflect: true, attribute: 'data-size' }) size: TextInputSize = 'default';
  @property({ type: String, reflect: true }) label?: string;
  @property({ type: String, reflect: true, attribute: 'label-placement' })
  labelPlacement: TextInputLabelPlacement = 'top';
  @property({ type: String, reflect: true }) placeholder = '';
  @property({ type: String, reflect: true }) value = '';
  @property({ type: String, reflect: true }) hint?: string;
  @property({ type: String, reflect: true }) state: TextInputState = 'default';
  @property({ type: String }) name?: string;
  @property({ type: String }) type: 'text' | 'email' | 'tel' | 'url' = 'text';
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) required = false;
  @property({ type: Boolean, reflect: true }) readonly = false;

  private get _isFloating(): boolean {
    if (this.variant === 'filled') return false;
    if (this.variant === 'underlined') return true;
    return this.labelPlacement === 'floating';
  }

  private get _isDisabled(): boolean {
    return this.disabled || this.state === 'disabled';
  }

  private _onLeadingSlotChange(e: Event) {
    const slot = e.target as HTMLSlotElement;
    this.toggleAttribute('has-leading-icon', slot.assignedElements().length > 0);
  }

  private _onTrailingSlotChange(e: Event) {
    const slot = e.target as HTMLSlotElement;
    this.toggleAttribute('has-trailing-icon', slot.assignedElements().length > 0);
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
      new CustomEvent('ui-change', { detail: { value: this.value }, bubbles: true, composed: true }),
    );
  }

  override render() {
    const isFloating = this._isFloating;
    const isDisabled = this._isDisabled;
    const hintId = 'hint';

    return html`
      ${!isFloating && this.label
        ? html`<label class="label" for="input">${this.label}</label>`
        : nothing}
      <div class="field-wrapper">
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
        ></slot>
      </div>
      ${this.hint ? html`<p id=${hintId} class="hint">${this.hint}</p>` : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-text-input': UiTextInput;
  }
}
