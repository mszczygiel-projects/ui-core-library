import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { checkboxFieldStyles } from './checkbox-field.styles.js';
import { resetStyles } from '../styles/reset.styles.js';
import { motionStyles } from '../styles/motion.styles.js';

export type CheckboxFieldState = 'default' | 'error' | 'disabled';

@customElement('ui-checkbox-field')
export class UiCheckboxField extends LitElement {
  static override shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };
  static override styles = [resetStyles, motionStyles, checkboxFieldStyles];

  @property({ type: String, reflect: true }) label = '';
  @property({ type: String, reflect: true }) hint?: string;
  @property({ type: Boolean, reflect: true }) checked = false;
  @property({ type: Boolean, reflect: true }) indeterminate = false;
  @property({ type: String, reflect: true }) state: CheckboxFieldState = 'default';
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: String }) name?: string;
  @property({ type: String }) value = 'on';
  @property({ type: Boolean, reflect: true }) required = false;

  private get _isDisabled(): boolean {
    return this.disabled || this.state === 'disabled';
  }

  protected override updated(): void {
    const input = this.shadowRoot?.querySelector<HTMLInputElement>('.input');
    if (input) {
      input.indeterminate = this.indeterminate;
    }
  }

  private _onChange(e: Event): void {
    const input = e.target as HTMLInputElement;
    this.checked = input.checked;
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
        <span class="box">
          <input
            class="input"
            type="checkbox"
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
    'ui-checkbox-field': UiCheckboxField;
  }
}
