import { LitElement, html, nothing, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { svgMap } from '@mszczygiel-projects/ui-core-icons';
import { textFieldStyles } from '../text-field/text-field.styles.js';
import { dateFieldStyles } from './date-field.styles.js';
import { motionStyles } from '../styles/motion.styles.js';
import { resetStyles } from '../styles/reset.styles.js';
import {
  formatDateDisplay,
  formatRangeDisplay,
  parseDateText,
  parseRangeText,
} from './date-format.js';
import { resolveLocale } from '../calendar/date-utils.js';
import '../date-picker/date-picker.js';
import type {
  DatePickerDateChangeDetail,
  DatePickerOpenChangeDetail,
  DatePickerRangeChangeDetail,
} from '../date-picker/date-picker.js';
import type { PopoverPlacement } from '../popover/popover.js';
import type { CalendarSelectionMode } from '../calendar/calendar.js';
import { getUiCoreConfig } from '@mszczygiel-projects/ui-core-foundations';

export type DateFieldVariant = 'outline' | 'filled' | 'underlined';
export type DateFieldSize = 'small' | 'default' | 'large';
export type DateFieldState = 'default' | 'success' | 'error' | 'disabled';
export type DateFieldLabelPlacement = 'top' | 'floating' | 'inner';

export interface DateFieldChangeDetail {
  startDate: string | null;
  endDate: string | null;
}

/**
 * Date input built on the TextField shell (SearchField pattern): one combined
 * text input in both modes, a trailing calendar button opening `ui-date-picker`,
 * and a locale-aware `Intl` parser/formatter — no i18n library.
 *
 * - `single` mode holds one formatted date (medium style, e.g. "Jan 5, 2026");
 *   picking a day auto-commits and closes.
 * - `range` mode holds a combined string ("Jan 5, 2026 – Jan 12, 2026");
 *   picking commits on Apply. The input always shows the committed value —
 *   pending selection lives in the panel.
 *
 * Typed input is parsed on blur/Enter (ISO, locale numeric, or month-name
 * forms) and validated against `min-date`/`max-date`/`disabledDates`; invalid
 * text keeps the field in a `data-invalid` error treatment and dispatches
 * `ui-invalid` without committing.
 *
 * @element ui-date-field
 *
 * @fires {CustomEvent} ui-change - `{ startDate, endDate }` after a commit (picker or typed).
 * @fires {CustomEvent} ui-input - `{ value }` raw text on every keystroke.
 * @fires {CustomEvent} ui-invalid - `{ value }` when typed text fails parsing/validation.
 *
 * @example
 * ```html
 * <ui-date-field mode="range" label="Date range" locale="pl-PL"></ui-date-field>
 * ```
 */
@customElement('ui-date-field')
export class UiDateField extends LitElement {
  static readonly formAssociated = true;
  static override shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };
  static override styles = [resetStyles, motionStyles, textFieldStyles, dateFieldStyles];

  /**
   * Selection mode; drives display format and the picker's commit model.
   * @default 'single'
   */
  @property({ type: String, reflect: true }) mode: CalendarSelectionMode = 'single';

  /** Committed date (single) or range start, ISO `YYYY-MM-DD`. */
  @property({ type: String, reflect: true, attribute: 'start-date' }) startDate?: string;

  /** Committed range end, ISO `YYYY-MM-DD` (range mode). */
  @property({ type: String, reflect: true, attribute: 'end-date' }) endDate?: string;

  /**
   * Container style: bordered, filled background, or bottom border only.
   * @default 'outline'
   */
  @property({ type: String, reflect: true }) variant: DateFieldVariant = 'outline';

  /**
   * Field height and typography scale.
   * @default 'default'
   */
  @property({ type: String, reflect: true, attribute: 'data-size' }) size: DateFieldSize =
    'default';

  /** Label text. */
  @property({ type: String, reflect: true }) label?: string;

  /**
   * Label position: above the field, floating over it, or inline inside it.
   * @default 'top'
   */
  @property({ type: String, reflect: true, attribute: 'label-placement' })
  labelPlacement: DateFieldLabelPlacement = 'top';

  /** Placeholder text shown while empty. */
  @property({ type: String, reflect: true }) placeholder?: string;

  /** Helper text rendered below the field, linked via `aria-describedby`. */
  @property({ type: String, reflect: true }) hint?: string;

  /**
   * Validation state; `disabled` also disables the input.
   * @default 'default'
   */
  @property({ type: String, reflect: true }) state: DateFieldState = 'default';

  /** Form field name used on submission (single: ISO; range: `start/end`). */
  @property({ type: String, reflect: true }) name?: string;

  /** Disables the input and the calendar button. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Marks the field as required for form submission. */
  @property({ type: Boolean, reflect: true }) required = false;

  /** Makes the input read-only (typing blocked; the picker still works). */
  @property({ type: Boolean, reflect: true }) readonly = false;

  /** Earliest selectable date, ISO `YYYY-MM-DD`. */
  @property({ type: String, attribute: 'min-date' }) minDate?: string;

  /** Latest selectable date, ISO `YYYY-MM-DD`. */
  @property({ type: String, attribute: 'max-date' }) maxDate?: string;

  /** Disabled dates: array of ISO strings or a predicate. Property-only. */
  @property({ attribute: false }) disabledDates?: string[] | ((iso: string) => boolean);

  /** First day of week, ISO 1-7; defaults to the locale's week info. */
  @property({ type: Number, attribute: 'first-day-of-week' }) firstDayOfWeek?: number;

  /** BCP 47 locale tag for formatting and parsing; defaults to the runtime locale. */
  @property({ type: String }) locale?: string;

  /** Override of "today" (ISO) — deterministic rendering for tests/SSR. */
  @property({ type: String }) today?: string;

  /**
   * Preferred panel position.
   * @default 'bottom-start'
   */
  @property({ type: String }) placement: PopoverPlacement = 'bottom-start';

  /** Accessible name of the calendar toggle button. */
  @property({ type: String, attribute: 'calendar-button-label' })
  calendarButtonLabel?: string;

  /** Label of the Apply button (range mode). */
  @property({ type: String, attribute: 'apply-label' }) applyLabel?: string;

  /** Label of the Clear button (range mode). */
  @property({ type: String, attribute: 'clear-label' }) clearLabel?: string;

  @state() private _open = false;
  @state() private _editing = false;
  @state() private _text = '';
  @state() private _invalid = false;
  @state() private _formDisabled = false;

  private _defaultStart?: string;
  private _defaultEnd?: string;
  private _internals: ElementInternals;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  override connectedCallback() {
    super.connectedCallback();
    this._defaultStart = this.startDate;
    this._defaultEnd = this.endDate;
    this._syncFormValue();
  }

  private get _resolvedLocale(): string {
    return resolveLocale(this.locale);
  }

  private get _isDisabled(): boolean {
    return this.disabled || this.state === 'disabled' || this._formDisabled;
  }

  private get _displayValue(): string {
    if (this._editing) return this._text;
    return this.mode === 'range'
      ? formatRangeDisplay(this._resolvedLocale, this.startDate, this.endDate)
      : this.startDate
        ? formatDateDisplay(this._resolvedLocale, this.startDate)
        : '';
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (
      changed.has('startDate') ||
      changed.has('endDate') ||
      changed.has('mode') ||
      changed.has('disabled') ||
      changed.has('state')
    ) {
      this._syncFormValue();
    }
    this.toggleAttribute('data-invalid', this._invalid);
    this.setAttribute('has-trailing-icon', '');
    // textFieldStyles keys floating/inner behavior off the value attribute.
    this.setAttribute('value', this._displayValue);
  }

  formDisabledCallback(disabled: boolean) {
    // Fires for our own reflected `disabled` attribute as well as for an ancestor
    // <fieldset disabled>. The first case is redundant — `disabled` is already a
    // reactive property — and it arrives mid-update, after render() has read its
    // values, so the write is dropped and leaves the control stale. Track only the
    // ancestor case; `_isDisabled` already ORs in `disabled` itself.
    this._formDisabled = disabled && !this.disabled;
    this._syncFormValue();
  }

  formResetCallback() {
    this.startDate = this._defaultStart;
    this.endDate = this._defaultEnd;
    this._editing = false;
    this._invalid = false;
  }

  private _syncFormValue() {
    if (this._isDisabled) {
      this._internals.setFormValue(null);
      return;
    }
    const value =
      this.mode === 'range'
        ? this.startDate
          ? `${this.startDate}/${this.endDate ?? ''}`
          : ''
        : (this.startDate ?? '');
    this._internals.setFormValue(value || null);
  }

  private _isDateBlocked(iso: string): boolean {
    if (this.minDate && iso < this.minDate) return true;
    if (this.maxDate && iso > this.maxDate) return true;
    const dd = this.disabledDates;
    if (Array.isArray(dd)) return dd.includes(iso);
    if (typeof dd === 'function') return dd(iso);
    return false;
  }

  private _commit(start: string | null, end: string | null): void {
    this.startDate = start ?? undefined;
    this.endDate = end ?? undefined;
    this._editing = false;
    this._invalid = false;
    this._syncFormValue();
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    this.dispatchEvent(
      new CustomEvent<DateFieldChangeDetail>('ui-change', {
        detail: { startDate: start, endDate: end },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _markInvalid(): void {
    this._invalid = true;
    this._editing = true;
    this.dispatchEvent(
      new CustomEvent('ui-invalid', {
        detail: { value: this._text },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _commitFromText(): void {
    const locale = this._resolvedLocale;
    const text = this._text.trim();
    if (!this._editing) return;
    if (!text) {
      this._commit(null, null);
      return;
    }
    if (this.mode === 'range') {
      const range = parseRangeText(locale, text);
      if (
        !range ||
        !range.start ||
        this._isDateBlocked(range.start) ||
        (range.end && this._isDateBlocked(range.end))
      ) {
        this._markInvalid();
        return;
      }
      this._commit(range.start, range.end);
      return;
    }
    const date = parseDateText(locale, text);
    if (!date || this._isDateBlocked(date)) {
      this._markInvalid();
      return;
    }
    this._commit(date, null);
  }

  private _onInput(e: Event) {
    const input = e.target as HTMLInputElement;
    this._editing = true;
    this._invalid = false;
    this._text = input.value;
    this.dispatchEvent(
      new CustomEvent('ui-input', {
        detail: { value: this._text },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _onKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') this._commitFromText();
  }

  private _toggleOpen() {
    if (this._isDisabled) return;
    this._open = !this._open;
  }

  private _onPickerDateChange(e: CustomEvent<DatePickerDateChangeDetail>) {
    e.stopPropagation();
    this._commit(e.detail.date, null);
    this._open = false;
  }

  private _onPickerRangeChange(e: CustomEvent<DatePickerRangeChangeDetail>) {
    e.stopPropagation();
    this._commit(e.detail.startDate, e.detail.endDate);
    this._open = false;
  }

  private _onPickerOpenChange(e: CustomEvent<DatePickerOpenChangeDetail>) {
    e.stopPropagation();
    this._open = e.detail.open;
  }

  override render() {
    const isFloating = this.labelPlacement === 'floating';
    const isInner = this.labelPlacement === 'inner';
    const isDisabled = this._isDisabled;
    const hintId = 'hint';

    return html`
      ${!isFloating && !isInner && this.label
        ? html`<label class="label" for="input">${this.label}</label>`
        : nothing}
      <ui-date-picker
        selection-mode=${this.mode}
        .open=${this._open}
        placement=${this.placement}
        start-date=${this.startDate ?? nothing}
        end-date=${this.endDate ?? nothing}
        min-date=${this.minDate ?? nothing}
        max-date=${this.maxDate ?? nothing}
        first-day-of-week=${this.firstDayOfWeek ?? nothing}
        locale=${this.locale ?? nothing}
        today=${this.today ?? nothing}
        apply-label=${ifDefined(this.applyLabel)}
        clear-label=${ifDefined(this.clearLabel)}
        .disabledDates=${this.disabledDates}
        @date-change=${this._onPickerDateChange}
        @range-change=${this._onPickerRangeChange}
        @open-change=${this._onPickerOpenChange}
      >
        <div slot="trigger" class="field-wrapper">
          ${isInner && this.label
            ? html`<label class="label" for="input">${this.label}</label>`
            : nothing}
          <input
            id="input"
            class="input"
            type="text"
            autocomplete="off"
            name=${this.name ?? nothing}
            .value=${this._displayValue}
            placeholder=${isFloating ? ' ' : (this.placeholder ?? nothing)}
            ?disabled=${isDisabled}
            ?required=${this.required}
            ?readonly=${this.readonly}
            aria-invalid=${this._invalid ? 'true' : nothing}
            aria-describedby=${this.hint ? hintId : nothing}
            @input=${this._onInput}
            @keydown=${this._onKeydown}
            @blur=${this._commitFromText}
          />
          ${isFloating && this.label
            ? html`<label class="label" for="input">${this.label}</label>`
            : nothing}
          <button
            class="calendar-toggle icon icon--trailing"
            type="button"
            aria-label=${this.calendarButtonLabel ??
            getUiCoreConfig().labels.dateField.openCalendar}
            aria-expanded=${this._open ? 'true' : 'false'}
            aria-haspopup="dialog"
            ?disabled=${isDisabled}
            @click=${this._toggleOpen}
          >
            ${unsafeSVG(svgMap['icon-calendar'])}
          </button>
        </div>
      </ui-date-picker>
      ${this.hint ? html`<p id=${hintId} class="hint">${this.hint}</p>` : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-date-field': UiDateField;
  }
}
