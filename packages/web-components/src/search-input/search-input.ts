import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { svgMap } from '@ui-core/icons';
import { textInputStyles } from '../text-input/text-input.styles.js';
import { searchInputStyles } from './search-input.styles.js';
import { motionStyles } from '../styles/motion.styles.js';
import { resetStyles } from '../styles/reset.styles.js';

export type SearchInputVariant = 'outline' | 'filled' | 'underlined';
export type SearchInputSize = 'small' | 'default' | 'large';
export type SearchInputState = 'default' | 'success' | 'error' | 'disabled';

@customElement('ui-search-input')
export class UiSearchInput extends LitElement {
  static override shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };
  static override styles = [resetStyles, motionStyles, textInputStyles, searchInputStyles];

  @property({ type: String, reflect: true }) variant: SearchInputVariant = 'outline';
  @property({ type: String, reflect: true, attribute: 'data-size' }) size: SearchInputSize =
    'default';
  @property({ type: String, reflect: true }) value = '';
  @property({ type: String, reflect: true }) placeholder = 'Search...';
  @property({ type: String, reflect: true }) hint?: string;
  @property({ type: String, reflect: true }) state: SearchInputState = 'default';
  @property({ type: String }) name?: string;
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) required = false;
  @property({ type: Boolean, reflect: true }) readonly = false;

  private get _isDisabled(): boolean {
    return this.disabled || this.state === 'disabled';
  }

  protected override updated(): void {
    this.setAttribute('has-leading-icon', '');
    this.setAttribute('has-trailing-icon', '');
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

  private _onClear() {
    this.value = '';
    this.shadowRoot?.querySelector('input')?.focus();
    this.dispatchEvent(new CustomEvent('ui-clear', { bubbles: true, composed: true }));
    this.dispatchEvent(
      new CustomEvent('ui-input', { detail: { value: '' }, bubbles: true, composed: true }),
    );
  }

  override render() {
    const isDisabled = this._isDisabled;
    const hintId = 'hint';
    const hasValue = this.value !== '';

    return html`
      <div class="field-wrapper">
        <span class="icon icon--leading" aria-hidden="true">
          ${unsafeSVG(svgMap['icon-search'])}
        </span>
        <input
          id="input"
          class="input"
          type="search"
          name=${this.name ?? nothing}
          .value=${this.value}
          placeholder=${this.placeholder}
          ?disabled=${isDisabled}
          ?required=${this.required}
          ?readonly=${this.readonly}
          aria-describedby=${this.hint ? hintId : nothing}
          @input=${this._onInput}
          @change=${this._onChange}
        />
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
    'ui-search-input': UiSearchInput;
  }
}
