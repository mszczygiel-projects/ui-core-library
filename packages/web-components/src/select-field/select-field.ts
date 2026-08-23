import { LitElement, html, nothing, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { classMap } from 'lit/directives/class-map.js';
import { svgMap } from '@mszczygiel-projects/ui-core-icons';
import { selectFieldStyles } from './select-field.styles.js';
import { listboxStyles } from '../listbox/listbox.styles.js';
import {
  buildRows,
  firstEnabledRow,
  flattenOptions,
  listboxOptionId,
  nextEnabledRow,
  renderListbox,
  rowIndexOfValue,
  scrollRowIntoView,
} from '../listbox/listbox.js';
import type { ListboxItems, ListboxOption, ListboxRow } from '../listbox/listbox.js';
import { controlFieldStyles } from '../styles/control-field.styles.js';
import { motionStyles } from '../styles/motion.styles.js';
import { resetStyles } from '../styles/reset.styles.js';
import '../popover/popover.js';
import type { PopoverPlacement, PopoverOpenChangeDetail } from '../popover/popover.js';
import { getUiCoreConfig } from '@mszczygiel-projects/ui-core-foundations';

export type SelectFieldVariant = 'outline' | 'filled' | 'underlined';
export type SelectFieldSize = 'small' | 'default' | 'large';
export type SelectFieldState = 'default' | 'success' | 'error' | 'disabled';
export type SelectFieldLabelPlacement = 'top' | 'inner' | 'inline';

/** Single option in a ui-select-field list. */
export type SelectOption = ListboxOption;
/** Named set of options rendered under a sticky header. */
export type { ListboxOptionGroup as SelectOptionGroup } from '../listbox/listbox.js';

const LISTBOX_ID = 'listbox';

/**
 * Form-associated custom dropdown select with keyboard navigation.
 *
 * The list floats through `ui-popover`, so it flips above the field when there
 * is no room below and escapes any `overflow: hidden` ancestor. Options are
 * rendered by the shared listbox module into this component's own shadow root,
 * which is what lets `aria-controls` and `aria-activedescendant` resolve.
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
 *
 * @cssprop --listbox-max-height - Scroll height of the dropdown; falls back to `--select-dropdown-max-height`.
 */
@customElement('ui-select-field')
export class UiSelectField extends LitElement {
  static readonly formAssociated = true;
  static override shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };
  static override styles = [
    resetStyles,
    motionStyles,
    controlFieldStyles,
    listboxStyles,
    selectFieldStyles,
  ];

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
   * Label position: above the field, stacked inside it, or inline with the
   * value (`Season: 2025/26`).
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

  /**
   * Options rendered in the dropdown — a flat array or an array of
   * `{ label, options }` groups. Set as a property, not an attribute.
   */
  @property({ type: Array }) options: ListboxItems = [];

  /**
   * Preferred dropdown position; flips automatically when there is no room.
   * @default 'bottom-start'
   */
  @property({ type: String, reflect: true }) placement: PopoverPlacement = 'bottom-start';

  /** Disables the select. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Shows a clear affordance when a value is selected (also Delete/Backspace). */
  @property({ type: Boolean, reflect: true }) clearable = false;

  /** Form field name used on submission. */
  @property({ type: String, reflect: true }) name?: string;

  /**
   * Text shown when there are no options.
   * @default `getUiCoreConfig().labels.listbox.empty`
   */
  @property({ type: String, attribute: 'empty-label' }) emptyLabel?: string;

  /**
   * Accessible name of the clear button.
   * @default `getUiCoreConfig().labels.selectField.clear`
   */
  @property({ type: String, attribute: 'clear-label' }) clearLabel?: string;

  @state() private _open = false;
  @state() private _activeIndex = -1;
  @state() private _formDisabled = false;

  private _defaultValue = '';
  private _internals: ElementInternals;
  private _triggerResizeObserver?: ResizeObserver;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  private get _isDisabled(): boolean {
    return this.disabled || this.state === 'disabled' || this._formDisabled;
  }

  private get _rows(): ListboxRow[] {
    return buildRows(this.options);
  }

  private get _selectedOption(): ListboxOption | undefined {
    return flattenOptions(this.options).find((o) => o.value === this.value);
  }

  private get _triggerEl(): HTMLButtonElement | null {
    return this.shadowRoot?.querySelector<HTMLButtonElement>('.trigger') ?? null;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this._defaultValue = this.value;
    this._syncFormValue();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._triggerResizeObserver?.disconnect();
    this._triggerResizeObserver = undefined;
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
    // Cheap when already visible, so no need to diff the active index.
    if (this._open) {
      scrollRowIntoView(this.shadowRoot, LISTBOX_ID, this._activeIndex);
    }
  }

  formDisabledCallback(disabled: boolean): void {
    // Fires for our own reflected `disabled` attribute as well as for an ancestor
    // <fieldset disabled>. The first case is redundant — `disabled` is already a
    // reactive property — and it arrives mid-update, after render() has read its
    // values, so the write is dropped and leaves the control stale. Track only the
    // ancestor case; `_isDisabled` already ORs in `disabled` itself.
    this._formDisabled = disabled && !this.disabled;
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

  /**
   * Keeps the floating list as wide as the field. Observes the host — a node
   * that survives every re-render — and reads the trigger fresh on each
   * callback, so a re-rendered trigger cannot leave a stale observer behind.
   */
  private _observeTriggerWidth() {
    if (typeof ResizeObserver !== 'function') return;
    const sync = () => {
      const trigger = this._triggerEl;
      if (!trigger) return;
      this.style.setProperty('--_dropdown-width', `${trigger.getBoundingClientRect().width}px`);
    };
    sync();
    this._triggerResizeObserver?.disconnect();
    this._triggerResizeObserver = new ResizeObserver(sync);
    this._triggerResizeObserver.observe(this);
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
    const rows = this._rows;
    const selected = rowIndexOfValue(rows, this.value);
    this._activeIndex = selected >= 0 ? selected : firstEnabledRow(rows);
    /*
     * Measure after the render settles: on first open ui-popover may not be
     * upgraded yet, so the trigger would still be shrink-to-fit and the panel
     * would flash at the wrong width.
     */
    void this.updateComplete.then(() => {
      if (this._open) this._observeTriggerWidth();
    });
  }

  private _closeDropdown() {
    this._open = false;
    this.toggleAttribute('open', false);
    this._activeIndex = -1;
    this._triggerResizeObserver?.disconnect();
    this._triggerResizeObserver = undefined;
  }

  private _selectRow(row: ListboxRow) {
    if (row.kind !== 'option' || row.option.disabled) return;
    const prev = this.value;
    this.value = row.option.value;
    this._closeDropdown();
    this._triggerEl?.focus();
    if (prev !== this.value) this._dispatchValueChange();
  }

  private _handleTriggerClick() {
    if (this._open) this._closeDropdown();
    else this._openDropdown();
  }

  private _handlePopoverOpenChange(event: CustomEvent<PopoverOpenChangeDetail>) {
    event.stopPropagation();
    if (!event.detail.open) this._closeDropdown();
  }

  private _handleKeyDown(e: KeyboardEvent) {
    if (this._isDisabled) return;
    const rows = this._rows;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (!this._open) this._openDropdown();
        else if (rows[this._activeIndex]) this._selectRow(rows[this._activeIndex]);
        break;
      case 'Escape':
        if (this._open) {
          e.preventDefault();
          this._closeDropdown();
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!this._open) this._openDropdown();
        else this._activeIndex = nextEnabledRow(rows, this._activeIndex, 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!this._open) this._openDropdown();
        else this._activeIndex = nextEnabledRow(rows, this._activeIndex, -1);
        break;
      case 'Home':
        if (this._open) {
          e.preventDefault();
          this._activeIndex = firstEnabledRow(rows);
        }
        break;
      case 'End':
        if (this._open) {
          e.preventDefault();
          this._activeIndex = nextEnabledRow(rows, rows.length, -1);
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

  private _handleClear(e: Event) {
    e.stopPropagation();
    e.preventDefault();
    const prev = this.value;
    this.value = '';
    if (prev !== '') this._dispatchValueChange();
  }

  private _handleClearKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') this._handleClear(e);
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
    const hintId = 'hint';

    const isInner = this.labelPlacement === 'inner';
    const isInline = this.labelPlacement === 'inline';
    const activeId =
      this._open && this._activeIndex >= 0
        ? listboxOptionId(LISTBOX_ID, this._activeIndex)
        : nothing;

    return html`
      ${this.label && !isInner && !isInline
        ? html`<label id=${labelId} class="label" for=${triggerId}>${this.label}</label>`
        : nothing}
      <div class="field-container">
        <ui-popover
          class="popover"
          trigger="manual"
          placement=${this.placement}
          ?open=${this._open}
          dismiss-on="both"
          @open-change=${this._handlePopoverOpenChange}
        >
          <button
            slot="trigger"
            id=${triggerId}
            class="trigger"
            type="button"
            role="combobox"
            aria-haspopup="listbox"
            aria-expanded=${this._open ? 'true' : 'false'}
            aria-controls=${LISTBOX_ID}
            aria-activedescendant=${activeId}
            aria-describedby=${this.hint ? hintId : nothing}
            aria-labelledby=${this.label ? labelId : nothing}
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
            <span class="content">
              ${this.label && isInline
                ? html`<span id=${labelId} class="inline-label">${this.label}:</span>`
                : nothing}
              <span
                class=${classMap({
                  value: true,
                  'value--placeholder': !selected,
                })}
              >
                ${selected?.label ?? this.placeholder}
              </span>
            </span>
            <span class="trailing">
              ${this.clearable && hasValue
                ? html`<span
                    class="clear"
                    role="button"
                    aria-label=${this.clearLabel ?? getUiCoreConfig().labels.selectField.clear}
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
            ? renderListbox({
                idPrefix: LISTBOX_ID,
                items: this.options,
                value: this.value,
                activeIndex: this._activeIndex,
                emptyLabel: this.emptyLabel,
                labelledBy: this.label ? labelId : undefined,
                label: this.label ? undefined : this.placeholder,
                onSelect: (row) => this._selectRow(row),
                onActivate: (index) => {
                  this._activeIndex = index;
                },
              })
            : nothing}
        </ui-popover>
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
