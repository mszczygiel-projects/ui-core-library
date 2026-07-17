import { LitElement, html, nothing, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { classMap } from 'lit/directives/class-map.js';
import { svgMap } from '@mszczygiel-projects/ui-core-icons';
import { selectFieldStyles } from './select-field.styles.js';
import { motionStyles } from '../styles/motion.styles.js';
import { resetStyles } from '../styles/reset.styles.js';

export type SelectFieldVariant = 'outline' | 'filled' | 'underlined';
export type SelectFieldSize = 'small' | 'default' | 'large';
export type SelectFieldState = 'default' | 'success' | 'error' | 'disabled';
export type SelectFieldLabelPlacement = 'top' | 'inner';

/** Single option in a ui-select-field list. */
export interface SelectOption {
  /** Value submitted with the form when this option is selected. */
  value: string;
  /** Text shown in the trigger and the dropdown list. */
  label: string;
  /** Renders the option grayed out and unselectable. */
  disabled?: boolean;
}

/**
 * Form-associated custom dropdown select with keyboard navigation.
 *
 * @element ui-select-field
 *
 * @example
 * ```html
 * <ui-select-field label="Country"></ui-select-field>
 * <script>
 *   document.querySelector('ui-select-field').options = [
 *     { value: 'pl', label: 'Poland' },
 *     { value: 'de', label: 'Germany' },
 *   ];
 * </script>
 * ```
 *
 * @slot leading-icon - Icon rendered inside the trigger, at the start.
 *
 * @fires {Event} input - Native-like input event when the value changes.
 * @fires {Event} change - Native-like change event when the value changes.
 * @fires {CustomEvent} ui-change - Same moment as `change`; `detail.value` carries the selected value.
 */
@customElement('ui-select-field')
export class UiSelectField extends LitElement {
  static readonly formAssociated = true;
  static override shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };
  static override styles = [resetStyles, motionStyles, selectFieldStyles];

  /**
   * Container style: bordered, filled background, or bottom border only.
   * @default 'outline'
   */
  @property({ type: String, reflect: true }) variant: SelectFieldVariant = 'outline';

  /**
   * Field height and typography scale.
   * @default 'default'
   */
  @property({ type: String, reflect: true, attribute: 'data-size' }) size: SelectFieldSize =
    'default';

  /**
   * Label position: above the field or inline inside it.
   * @default 'top'
   */
  @property({ type: String, reflect: true, attribute: 'label-placement' })
  labelPlacement: SelectFieldLabelPlacement = 'top';

  /** Label text. */
  @property({ type: String, reflect: true }) label?: string;

  /** Helper text rendered below the field, linked via `aria-describedby`. */
  @property({ type: String, reflect: true }) hint?: string;

  /**
   * Validation state; `disabled` also disables the trigger.
   * @default 'default'
   */
  @property({ type: String, reflect: true }) state: SelectFieldState = 'default';

  /**
   * Text shown while no option is selected.
   * @default 'Select option...'
   */
  @property({ type: String, reflect: true }) placeholder = 'Select option...';

  /** Selected value; the attribute also sets the initial value restored on form reset. */
  @property({ type: String, reflect: true }) value = '';

  /** Options rendered in the dropdown list — set as a property, not an attribute. */
  @property({ type: Array }) options: SelectOption[] = [];

  /** Disables the select. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Shows a clear affordance when a value is selected (also Delete/Backspace). */
  @property({ type: Boolean, reflect: true }) clearable = false;

  /** Form field name used on submission. */
  @property({ type: String }) name?: string;

  @state() private _open = false;
  @state() private _activeIndex = -1;
  @state() private _formDisabled = false;

  private _defaultValue = '';
  private _internals: ElementInternals;
  private _clickOutsideHandler?: (e: MouseEvent) => void;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  private get _isDisabled(): boolean {
    return this.disabled || this.state === 'disabled' || this._formDisabled;
  }

  private get _selectedOption(): SelectOption | undefined {
    return this.options?.find((o) => o.value === this.value);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._removeClickOutside();
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this._defaultValue = this.value;
    this._syncFormValue();
  }

  override updated(changedProperties: PropertyValues<this>): void {
    super.updated(changedProperties);
    if (
      changedProperties.has('value') ||
      changedProperties.has('disabled') ||
      changedProperties.has('state')
    ) {
      this._syncFormValue();
    }
  }

  formDisabledCallback(disabled: boolean): void {
    this._formDisabled = disabled;
  }

  formResetCallback(): void {
    this.value = this._defaultValue;
    this._closeDropdown();
  }

  formStateRestoreCallback(state: FormData | File | string | null): void {
    if (typeof state === 'string') {
      this.value = state;
    }
  }

  private _syncFormValue() {
    this._internals.setFormValue(this._isDisabled ? null : this.value);
  }

  private _dispatchValueChange() {
    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    this.dispatchEvent(
      new CustomEvent('ui-change', {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _openDropdown() {
    if (this._isDisabled) return;
    this._open = true;
    this.toggleAttribute('open', true);
    this._activeIndex = (this.options ?? []).findIndex((o) => o.value === this.value);
    this._addClickOutside();
  }

  private _closeDropdown() {
    this._open = false;
    this.toggleAttribute('open', false);
    this._activeIndex = -1;
    this._removeClickOutside();
  }

  private _addClickOutside() {
    this._clickOutsideHandler = (e: MouseEvent) => {
      if (!this.contains(e.target as Node) && !this.shadowRoot?.contains(e.target as Node)) {
        this._closeDropdown();
      }
    };
    document.addEventListener('mousedown', this._clickOutsideHandler);
  }

  private _removeClickOutside() {
    if (this._clickOutsideHandler) {
      document.removeEventListener('mousedown', this._clickOutsideHandler);
      this._clickOutsideHandler = undefined;
    }
  }

  private _selectOption(option: SelectOption) {
    if (option.disabled) return;
    const prev = this.value;
    this.value = option.value;
    this._closeDropdown();
    this.shadowRoot?.querySelector<HTMLButtonElement>('.trigger')?.focus();
    if (prev !== this.value) {
      this._dispatchValueChange();
    }
  }

  private _handleTriggerClick() {
    if (this._open) {
      this._closeDropdown();
    } else {
      this._openDropdown();
    }
  }

  private _handleKeyDown(e: KeyboardEvent) {
    if (this._isDisabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (!this._open) {
          this._openDropdown();
        } else if (this._activeIndex >= 0 && this.options?.[this._activeIndex]) {
          this._selectOption(this.options[this._activeIndex]);
        }
        break;
      case 'Escape':
        if (this._open) {
          e.preventDefault();
          this._closeDropdown();
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!this._open) {
          this._openDropdown();
        } else {
          this._activeIndex = this._nextEnabledIndex(this._activeIndex, 1);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!this._open) {
          this._openDropdown();
        } else {
          this._activeIndex = this._nextEnabledIndex(this._activeIndex, -1);
        }
        break;
      case 'Delete':
      case 'Backspace':
        if (!this._open && this.clearable && this.value) {
          e.preventDefault();
          this._handleClear(e);
        }
        break;
      case 'Tab':
        if (this._open) this._closeDropdown();
        break;
    }
  }

  private _nextEnabledIndex(current: number, direction: 1 | -1): number {
    const opts = this.options ?? [];
    let next = current + direction;
    while (next >= 0 && next < opts.length) {
      if (!opts[next].disabled) return next;
      next += direction;
    }
    return current;
  }

  private _handleClear(e: Event) {
    e.stopPropagation();
    e.preventDefault();
    const prev = this.value;
    this.value = '';
    if (prev !== '') {
      this._dispatchValueChange();
    }
  }

  private _handleClearKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      this._handleClear(e);
    }
  }

  private _handleLeadingSlotChange(e: Event) {
    const slot = e.target as HTMLSlotElement;
    this.toggleAttribute('has-leading-icon', slot.assignedElements().length > 0);
  }

  override render() {
    const isDisabled = this._isDisabled;
    const selected = this._selectedOption;
    const hasValue = !!this.value;
    const labelId = 'label';
    const triggerId = 'trigger';
    const listboxId = 'listbox';
    const hintId = 'hint';

    const isInner = this.labelPlacement === 'inner';

    return html`
      ${this.label && !isInner
        ? html`<label id=${labelId} class="label" for=${triggerId}>${this.label}</label>`
        : nothing}
      <div class="field-container">
        <button
          id=${triggerId}
          class="trigger"
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded=${this._open ? 'true' : 'false'}
          aria-controls=${listboxId}
          aria-describedby=${this.hint ? hintId : nothing}
          ?disabled=${isDisabled}
          @click=${this._handleTriggerClick}
          @keydown=${this._handleKeyDown}
        >
          <slot
            name="leading-icon"
            class="icon icon--leading"
            @slotchange=${this._handleLeadingSlotChange}
          ></slot>
          ${this.label && isInner
            ? html`<span id=${labelId} class="inner-label">${this.label}</span>`
            : nothing}
          <span
            class=${classMap({
              value: true,
              'value--placeholder': !selected,
            })}
          >
            ${selected?.label ?? this.placeholder}
          </span>
          <span class="trailing">
            ${this.clearable && hasValue
              ? html`<span
                  class="clear"
                  role="button"
                  aria-label="Clear selection"
                  tabindex="0"
                  @mousedown=${this._handleClear}
                  @keydown=${this._handleClearKeyDown}
                >
                  ${unsafeSVG(svgMap['icon-close'])}
                </span>`
              : nothing}
            <span class="chevron" aria-hidden="true">
              ${this._open
                ? unsafeSVG(svgMap['icon-chevron-up'])
                : unsafeSVG(svgMap['icon-chevron-down'])}
            </span>
          </span>
        </button>
        ${this._open
          ? html`
              <ul
                id=${listboxId}
                class="dropdown"
                role="listbox"
                aria-labelledby=${this.label ? labelId : nothing}
                aria-label=${this.label ? nothing : this.placeholder}
              >
                ${(this.options ?? []).map(
                  (opt, i) => html`
                    <li
                      class=${classMap({
                        option: true,
                        'option--selected': opt.value === this.value,
                        'option--focused': i === this._activeIndex,
                        'option--disabled': !!opt.disabled,
                      })}
                      role="option"
                      aria-selected=${opt.value === this.value ? 'true' : 'false'}
                      aria-disabled=${opt.disabled ? 'true' : nothing}
                      @mousedown=${(e: MouseEvent) => {
                        e.preventDefault();
                        this._selectOption(opt);
                      }}
                      @mousemove=${() => {
                        if (!opt.disabled) this._activeIndex = i;
                      }}
                    >
                      ${opt.label}
                    </li>
                  `,
                )}
              </ul>
            `
          : nothing}
      </div>
      ${this.hint ? html`<p id=${hintId} class="hint">${this.hint}</p>` : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-select-field': UiSelectField;
  }
}
