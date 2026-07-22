import { LitElement, html, nothing, type PropertyValues } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { repeat } from 'lit/directives/repeat.js';
import { svgMap } from '@mszczygiel-projects/ui-core-icons';
import { comboboxStyles } from './combobox.styles.js';
import { listboxStyles } from '../listbox/listbox.styles.js';
import {
  buildRows,
  firstEnabledRow,
  flattenOptions,
  isGroupedItems,
  listboxOptionId,
  nextEnabledRow,
  renderListbox,
  rowIndexOfValue,
  scrollRowIntoView,
  toggleValue,
} from '../listbox/listbox.js';
import type { ListboxItems, ListboxOption, ListboxRow } from '../listbox/listbox.js';
import { controlFieldStyles } from '../styles/control-field.styles.js';
import { motionStyles } from '../styles/motion.styles.js';
import { resetStyles } from '../styles/reset.styles.js';
import '../popover/popover.js';
import '../chip/chip.js';
import type { PopoverPlacement, PopoverOpenChangeDetail } from '../popover/popover.js';
import { getUiCoreConfig } from '@mszczygiel-projects/ui-core-foundations';

export type ComboboxVariant = 'outline' | 'filled' | 'underlined';
export type ComboboxSize = 'small' | 'default' | 'large';
export type ComboboxState = 'default' | 'success' | 'error' | 'disabled';

/** Where the option list comes from: filtered here, or supplied pre-filtered. */
export type ComboboxFilterMode = 'local' | 'remote';

export interface ComboboxChangeDetail {
  /** Selected value in single mode; empty string when cleared. */
  value: string;
  /** Selected values in `multiple` mode. */
  values: string[];
}

export interface ComboboxFilterDetail {
  /** Current query text, debounced. */
  query: string;
}

export interface ComboboxCreateDetail {
  /** Query text the user asked to turn into a new option. */
  label: string;
}

const LISTBOX_ID = 'listbox';
const DEFAULT_FILTER_DEBOUNCE_MS = 200;

/**
 * Text input that filters a large option list as you type.
 *
 * Implements the WAI-ARIA combobox pattern: the input itself carries
 * `role="combobox"` with `aria-expanded`, `aria-controls` and
 * `aria-activedescendant`, while focus never leaves it. Options come from the
 * shared listbox module rendered into this component's own shadow root, which
 * is what lets those id references resolve.
 *
 * @element ui-combobox
 *
 * @example
 * ```html
 * <ui-combobox label="Season" placeholder="Search seasons"></ui-combobox>
 * <script>
 *   const el = document.querySelector('ui-combobox');
 *   el.options = [
 *     { value: '2025', label: '2025/26' },
 *     { value: '2024', label: '2024/25' },
 *   ];
 *   el.addEventListener('ui-change', (e) => console.log(e.detail.value));
 * </script>
 * ```
 *
 * @slot leading-icon - Icon rendered inside the field, at the start.
 *
 * @fires {CustomEvent} ui-change - Selection changed; `detail: { value, values }`.
 * @fires {CustomEvent} ui-filter - Debounced query change, for `filter-mode="remote"`; `detail: { query }`.
 * @fires {CustomEvent} ui-create - Create affordance chosen; `detail: { label }`.
 *
 * @cssprop --listbox-max-height - Scroll height of the dropdown; falls back to `--select-dropdown-max-height`.
 */
@customElement('ui-combobox')
export class UiCombobox extends LitElement {
  static readonly formAssociated = true;
  static override shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };
  static override styles = [
    resetStyles,
    motionStyles,
    controlFieldStyles,
    listboxStyles,
    comboboxStyles,
  ];

  /**
   * Container style: bordered, filled background, or bottom border only.
   * @default 'outline'
   */
  @property({ type: String, reflect: true }) variant: ComboboxVariant = 'outline';

  /**
   * Field height and typography scale.
   * @default 'default'
   */
  @property({ type: String, reflect: true, attribute: 'data-size' }) size: ComboboxSize = 'default';

  /**
   * Validation state; `disabled` also disables the input.
   * @default 'default'
   */
  @property({ type: String, reflect: true }) state: ComboboxState = 'default';

  /** Label text rendered above the field. */
  @property({ type: String, reflect: true }) label?: string;

  /** Helper text rendered below the field, linked via `aria-describedby`. */
  @property({ type: String, reflect: true }) hint?: string;

  /** Text shown in the empty input. */
  @property({ type: String, reflect: true }) placeholder = 'Search...';

  /** Selected value in single mode. */
  @property({ type: String, reflect: true }) value = '';

  /** Selected values in `multiple` mode — set as a property, not an attribute. */
  @property({ type: Array }) values: string[] = [];

  /** Allows selecting more than one option, shown as chips inside the field. */
  @property({ type: Boolean, reflect: true }) multiple = false;

  /** Options to choose from — a flat array or an array of `{ label, options }` groups. */
  @property({ type: Array }) options: ListboxItems = [];

  /**
   * `local` filters `options` by label; `remote` renders them as given and
   * emits `ui-filter` so the consumer can fetch.
   * @default 'local'
   */
  @property({ type: String, reflect: true, attribute: 'filter-mode' })
  filterMode: ComboboxFilterMode = 'local';

  /** Shows the loading message in place of the list. */
  @property({ type: Boolean, reflect: true }) loading = false;

  /** Offers a "create" row when the query matches no option. */
  @property({ type: Boolean, reflect: true, attribute: 'allow-create' }) allowCreate = false;

  /**
   * Delay before `ui-filter` fires, in ms.
   * @default 200
   */
  @property({ type: Number, attribute: 'filter-debounce' })
  filterDebounce = DEFAULT_FILTER_DEBOUNCE_MS;

  /**
   * Preferred dropdown position; flips automatically when there is no room.
   * @default 'bottom-start'
   */
  @property({ type: String, reflect: true }) placement: PopoverPlacement = 'bottom-start';

  /** Disables the combobox. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Shows a clear affordance once there is a selection or a query. */
  @property({ type: Boolean, reflect: true }) clearable = false;

  /** Form field name used on submission. */
  @property({ type: String }) name?: string;

  /**
   * Text shown when nothing matches.
   * @default `getUiCoreConfig().labels.listbox.empty`
   */
  @property({ type: String, attribute: 'empty-label' }) emptyLabel?: string;

  /**
   * Accessible name of the clear button.
   * @default `getUiCoreConfig().labels.combobox.clear`
   */
  @property({ type: String, attribute: 'clear-label' }) clearLabel?: string;

  /**
   * Builds the accessible name of a selected chip's dismiss button, in `multiple`
   * mode. Property-only (function type).
   * @default `getUiCoreConfig().labels.combobox.removeChip`
   */
  @property({ attribute: false }) removeChipLabel?: (optionLabel: string) => string;

  /**
   * Text shown while `loading`.
   * @default `getUiCoreConfig().labels.listbox.loading`
   */
  @property({ type: String, attribute: 'loading-label' }) loadingLabel?: string;

  /**
   * Prefix of the create row; the query is appended in quotes.
   * @default `getUiCoreConfig().labels.listbox.create`
   */
  @property({ type: String, attribute: 'create-label' }) createLabel?: string;

  @state() private _open = false;
  @state() private _query = '';
  @state() private _activeIndex = -1;
  @state() private _formDisabled = false;

  @query('.input') private _inputEl?: HTMLInputElement;

  private _internals: ElementInternals;
  private _resizeObserver?: ResizeObserver;
  private _filterTimer?: ReturnType<typeof setTimeout>;
  private _defaultValue = '';
  private _defaultValues: string[] = [];

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  private get _isDisabled(): boolean {
    return this.disabled || this.state === 'disabled' || this._formDisabled;
  }

  /** Options after local filtering; remote mode trusts what it was given. */
  private get _visibleOptions(): ListboxItems {
    const query = this._query.trim().toLowerCase();
    if (this.filterMode === 'remote' || !query) return this.options;

    const matches = (option: ListboxOption) => option.label.toLowerCase().includes(query);

    if (isGroupedItems(this.options)) {
      return this.options
        .map((group) => ({ ...group, options: (group.options ?? []).filter(matches) }))
        .filter((group) => group.options.length > 0);
    }
    return (this.options as ListboxOption[]).filter(matches);
  }

  /** Query offered by the create row, or undefined when it does not apply. */
  private get _createQuery(): string | undefined {
    const query = this._query.trim();
    if (!this.allowCreate || !query) return undefined;
    const exists = flattenOptions(this.options).some(
      (option) => option.label.toLowerCase() === query.toLowerCase(),
    );
    return exists ? undefined : query;
  }

  private get _rows(): ListboxRow[] {
    return buildRows(this._visibleOptions, this._createQuery);
  }

  private get _selectedOptions(): ListboxOption[] {
    const all = flattenOptions(this.options);
    return this.values
      .map((v) => all.find((o) => o.value === v))
      .filter(Boolean) as ListboxOption[];
  }

  private get _selectedOption(): ListboxOption | undefined {
    return flattenOptions(this.options).find((o) => o.value === this.value);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this._defaultValue = this.value;
    this._defaultValues = [...this.values];
    this._syncFormValue();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._resizeObserver?.disconnect();
    this._resizeObserver = undefined;
    clearTimeout(this._filterTimer);
  }

  override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    if (
      changed.has('value') ||
      changed.has('values') ||
      changed.has('disabled') ||
      changed.has('state')
    ) {
      this._syncFormValue();
    }
    if (this._open) {
      scrollRowIntoView(this.shadowRoot, LISTBOX_ID, this._activeIndex);
    }
  }

  formDisabledCallback(disabled: boolean): void {
    this._formDisabled = disabled;
  }

  formResetCallback(): void {
    this.value = this._defaultValue;
    this.values = [...this._defaultValues];
    this._query = '';
    this._close();
  }

  formStateRestoreCallback(state: FormData | File | string | null): void {
    if (typeof state === 'string') this.value = state;
  }

  private _syncFormValue() {
    if (this._isDisabled) {
      this._internals.setFormValue(null);
      return;
    }
    if (this.multiple) {
      const data = new FormData();
      if (this.name) for (const v of this.values) data.append(this.name, v);
      this._internals.setFormValue(data);
    } else {
      this._internals.setFormValue(this.value);
    }
  }

  private _dispatchChange() {
    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    this.dispatchEvent(
      new CustomEvent<ComboboxChangeDetail>('ui-change', {
        detail: { value: this.value, values: [...this.values] },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /**
   * Keeps the floating list as wide as the field. Observes the host — a node
   * that survives every re-render — and reads the field fresh on each callback.
   */
  private _observeFieldWidth() {
    if (typeof ResizeObserver !== 'function') return;
    const sync = () => {
      const field = this.shadowRoot?.querySelector<HTMLElement>('.field');
      if (!field) return;
      this.style.setProperty('--_dropdown-width', `${field.getBoundingClientRect().width}px`);
    };
    sync();
    this._resizeObserver?.disconnect();
    this._resizeObserver = new ResizeObserver(sync);
    this._resizeObserver.observe(this);
  }

  private _open_() {
    if (this._isDisabled || this._open) return;
    this._open = true;
    this.toggleAttribute('open', true);
    this._activeIndex = firstEnabledRow(this._rows);
    void this.updateComplete.then(() => {
      if (this._open) this._observeFieldWidth();
    });
  }

  private _close() {
    this._open = false;
    this.toggleAttribute('open', false);
    this._activeIndex = -1;
    this._resizeObserver?.disconnect();
    this._resizeObserver = undefined;
  }

  private _scheduleFilterEvent() {
    clearTimeout(this._filterTimer);
    this._filterTimer = setTimeout(() => {
      this.dispatchEvent(
        new CustomEvent<ComboboxFilterDetail>('ui-filter', {
          detail: { query: this._query },
          bubbles: true,
          composed: true,
        }),
      );
    }, this.filterDebounce);
  }

  private _handleInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this._query = input.value;
    this._open_();
    this._activeIndex = firstEnabledRow(this._rows);
    this._scheduleFilterEvent();
  }

  private _selectRow(row: ListboxRow) {
    if (row.kind === 'create') {
      const label = this._query.trim();
      this.dispatchEvent(
        new CustomEvent<ComboboxCreateDetail>('ui-create', {
          detail: { label },
          bubbles: true,
          composed: true,
        }),
      );
      this._query = '';
      this._close();
      this._inputEl?.focus();
      return;
    }

    if (row.option.disabled) return;

    if (this.multiple) {
      this.values = toggleValue(this.values, row.option.value);
      this._query = '';
      /*
       * The list stays open so more options can be picked. Clearing the query
       * re-expands the list, so the highlight has to be re-found by value —
       * keeping the old index would silently move it to a different option,
       * and resetting it would throw the user back to the top of the list.
       */
      const rows = this._rows;
      const index = rowIndexOfValue(rows, row.option.value);
      this._activeIndex = index >= 0 ? index : firstEnabledRow(rows);
    } else {
      this.value = row.option.value;
      this._query = '';
      this._close();
    }
    this._inputEl?.focus();
    this._dispatchChange();
  }

  private _removeValue(value: string) {
    if (this._isDisabled) return;
    this.values = this.values.filter((v) => v !== value);
    this._dispatchChange();
    this._inputEl?.focus();
  }

  private _handleClear(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    const had = this.multiple ? this.values.length > 0 : this.value !== '';
    this.value = '';
    this.values = [];
    this._query = '';
    if (had) this._dispatchChange();
    this._inputEl?.focus();
  }

  private _handleKeyDown(event: KeyboardEvent) {
    if (this._isDisabled) return;
    const rows = this._rows;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!this._open) this._open_();
        else this._activeIndex = nextEnabledRow(rows, this._activeIndex, 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (!this._open) this._open_();
        else this._activeIndex = nextEnabledRow(rows, this._activeIndex, -1);
        break;
      case 'Home':
        if (this._open) {
          event.preventDefault();
          this._activeIndex = firstEnabledRow(rows);
        }
        break;
      case 'End':
        if (this._open) {
          event.preventDefault();
          this._activeIndex = nextEnabledRow(rows, rows.length, -1);
        }
        break;
      case 'Enter':
        if (this._open && rows[this._activeIndex]) {
          event.preventDefault();
          this._selectRow(rows[this._activeIndex]);
        }
        break;
      case 'Escape':
        if (this._open) {
          event.preventDefault();
          this._close();
        }
        break;
      case 'Backspace':
        // Empty query: peel the last chip, the usual multi-select shortcut.
        if (this.multiple && this._query === '' && this.values.length > 0) {
          this._removeValue(this.values[this.values.length - 1]);
        }
        break;
      case 'Tab':
        if (this._open) this._close();
        break;
    }
  }

  /*
   * Opens on pointer and keyboard interaction rather than on focus: selecting
   * an option refocuses the input, and a focus-to-open rule would immediately
   * reopen the list the selection just closed. It also stops the list from
   * popping open while tabbing through a form.
   */
  private _handleFieldClick() {
    this._inputEl?.focus();
    this._open_();
  }

  private _handlePopoverOpenChange(event: CustomEvent<PopoverOpenChangeDetail>) {
    event.stopPropagation();
    if (!event.detail.open) this._close();
  }

  private _handleLeadingSlotChange(event: Event) {
    const slot = event.target as HTMLSlotElement;
    this.toggleAttribute('has-leading-icon', slot.assignedElements().length > 0);
  }

  /** Input text: the live query while typing, otherwise the selected label. */
  private get _inputValue(): string {
    if (this._query) return this._query;
    if (this.multiple) return '';
    return this._selectedOption?.label ?? '';
  }

  override render() {
    const isDisabled = this._isDisabled;
    const labelId = 'label';
    const inputId = 'input';
    const hintId = 'hint';
    const hasSelection = this.multiple ? this.values.length > 0 : this.value !== '';
    const activeId =
      this._open && this._activeIndex >= 0
        ? listboxOptionId(LISTBOX_ID, this._activeIndex)
        : nothing;

    return html`
      ${this.label
        ? html`<label id=${labelId} class="label" for=${inputId}>${this.label}</label>`
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
          <div slot="trigger" class="field" @click=${this._handleFieldClick}>
            <slot
              name="leading-icon"
              class="icon icon--leading"
              @slotchange=${this._handleLeadingSlotChange}
            ></slot>
            <div class="content">
              ${this.multiple
                ? html`<div class="chips">
                    ${repeat(
                      this._selectedOptions,
                      (option) => option.value,
                      (option) => html`
                        <ui-chip
                          appearance="subtle"
                          data-size="small"
                          dismissible
                          ?disabled=${isDisabled}
                          dismiss-label=${(
                            this.removeChipLabel ?? getUiCoreConfig().labels.combobox.removeChip
                          )(option.label)}
                          @dismiss=${() => this._removeValue(option.value)}
                          >${option.label}</ui-chip
                        >
                      `,
                    )}
                  </div>`
                : nothing}
              <input
                id=${inputId}
                class="input"
                type="text"
                role="combobox"
                autocomplete="off"
                spellcheck="false"
                aria-autocomplete="list"
                aria-expanded=${this._open ? 'true' : 'false'}
                aria-controls=${LISTBOX_ID}
                aria-activedescendant=${activeId}
                aria-describedby=${this.hint ? hintId : nothing}
                aria-labelledby=${this.label ? labelId : nothing}
                placeholder=${this.multiple && hasSelection ? '' : this.placeholder}
                .value=${this._inputValue}
                ?disabled=${isDisabled}
                @input=${this._handleInput}
                @keydown=${this._handleKeyDown}
              />
            </div>
            <span class="trailing">
              ${this.clearable && (hasSelection || this._query)
                ? html`<span
                    class="clear"
                    role="button"
                    aria-label=${this.clearLabel ?? getUiCoreConfig().labels.combobox.clear}
                    tabindex="0"
                    @mousedown=${this._handleClear}
                    @keydown=${(e: KeyboardEvent) => {
                      if (e.key === 'Enter' || e.key === ' ') this._handleClear(e);
                    }}
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
          </div>
          ${this._open
            ? renderListbox({
                idPrefix: LISTBOX_ID,
                items: this._visibleOptions,
                value: this.multiple ? this.values : this.value,
                multiple: this.multiple,
                activeIndex: this._activeIndex,
                loading: this.loading,
                loadingLabel: this.loadingLabel,
                emptyLabel: this.emptyLabel,
                createLabel: this.createLabel,
                createValue: this._createQuery,
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
    'ui-combobox': UiCombobox;
  }
}
