import { LitElement, html, nothing } from 'lit';
import type { PropertyValues, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { datePickerStyles } from './date-picker.styles.js';
import { resetStyles } from '../styles/reset.styles.js';
import '../popover/popover.js';
import '../calendar/calendar.js';
import '../button/button.js';
import type { PopoverPlacement, PopoverOpenChangeDetail } from '../popover/popover.js';
import type { CalendarSelectionMode, CalendarDateSelectDetail } from '../calendar/calendar.js';
import { getUiCoreConfig } from '@mszczygiel-projects/ui-core-foundations';

export interface DatePickerDateChangeDetail {
  /** Committed date, ISO `YYYY-MM-DD`. */
  date: string;
}

export interface DatePickerRangeChangeDetail {
  /** Committed range, ISO `YYYY-MM-DD`; both null after Clear + Apply. */
  startDate: string | null;
  endDate: string | null;
}

export type DatePickerOpenChangeReason = PopoverOpenChangeDetail['reason'] | 'select' | 'apply';

export interface DatePickerOpenChangeDetail {
  open: boolean;
  reason: DatePickerOpenChangeReason;
}

/**
 * Date picker: composes `ui-popover` (`trigger="manual"`, focus trap) with
 * `ui-calendar` and — in range mode — a Clear/Apply footer.
 *
 * Commit model is mode-dependent: `single` auto-commits on day click
 * (`date-change` + close request), `range` collects a pending selection and
 * commits only on Apply (`range-change` + close request). Clear resets the
 * pending selection without committing.
 *
 * Fully controlled: `open` and the committed dates are set by the consumer;
 * the component dispatches `open-change` (own interactions plus forwarded
 * popover dismissals) and never mutates its own properties.
 *
 * @element ui-date-picker
 *
 * @fires date-change - `{ date }` single mode commit.
 * @fires range-change - `{ startDate, endDate }` range mode commit (Apply).
 * @fires open-change - `{ open, reason }` — apply/select close requests and
 *   forwarded popover dismissals (escape / outside click).
 *
 * @slot trigger - Anchor element (e.g. the future DateField input).
 *
 * @example
 * ```html
 * <ui-date-picker selection-mode="range" open start-date="2026-07-08" end-date="2026-07-14">
 *   <button slot="trigger">Pick dates</button>
 * </ui-date-picker>
 * ```
 */
@customElement('ui-date-picker')
export class UiDatePicker extends LitElement {
  static override styles = [resetStyles, datePickerStyles];

  /**
   * Selection behavior — also switches the commit model (single: auto-commit
   * on click, range: Apply/Clear footer).
   * @default 'single'
   */
  @property({ type: String, reflect: true, attribute: 'selection-mode' })
  selectionMode: CalendarSelectionMode = 'single';

  /** Controlled open state of the popover. */
  @property({ type: Boolean, reflect: true }) open = false;

  /**
   * Preferred panel position relative to the trigger.
   * @default 'bottom-start'
   */
  @property({ type: String, reflect: true }) placement: PopoverPlacement = 'bottom-start';

  /** Committed date (single) or range start, ISO `YYYY-MM-DD`. */
  @property({ type: String, attribute: 'start-date' }) startDate?: string;

  /** Committed range end, ISO `YYYY-MM-DD` (range mode only). */
  @property({ type: String, attribute: 'end-date' }) endDate?: string;

  /** Earliest selectable date, ISO `YYYY-MM-DD`. */
  @property({ type: String, attribute: 'min-date' }) minDate?: string;

  /** Latest selectable date, ISO `YYYY-MM-DD`. */
  @property({ type: String, attribute: 'max-date' }) maxDate?: string;

  /** Disabled dates: array of ISO strings or a predicate. Property-only. */
  @property({ attribute: false }) disabledDates?: string[] | ((iso: string) => boolean);

  /** First day of week, ISO 1-7; defaults to the locale's week info. */
  @property({ type: Number, attribute: 'first-day-of-week' }) firstDayOfWeek?: number;

  /** BCP 47 locale tag; defaults to the runtime locale. */
  @property({ type: String }) locale?: string;

  /** Override of "today" (ISO) — deterministic rendering for tests/SSR. */
  @property({ type: String }) today?: string;

  /** Label of the Apply button (range mode). */
  @property({ type: String, attribute: 'apply-label' }) applyLabel?: string;

  /** Label of the Clear button (range mode). */
  @property({ type: String, attribute: 'clear-label' }) clearLabel?: string;

  /** Accessible name of the previous-month button. */
  @property({ type: String, attribute: 'prev-month-label' }) prevMonthLabel?: string;

  /** Accessible name of the next-month button. */
  @property({ type: String, attribute: 'next-month-label' }) nextMonthLabel?: string;

  @state() private pendingStart: string | null = null;
  @state() private pendingEnd: string | null = null;

  protected override willUpdate(changed: PropertyValues<this>): void {
    // (Re)opening seeds the pending range from the committed values.
    if (changed.has('open') && this.open && this.selectionMode === 'range') {
      this.pendingStart = this.startDate ?? null;
      this.pendingEnd = this.endDate ?? null;
    }
  }

  private dispatch<T>(name: string, detail: T): void {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  private requestClose(reason: DatePickerOpenChangeReason): void {
    this.dispatch<DatePickerOpenChangeDetail>('open-change', { open: false, reason });
  }

  private handleDateSelect(e: CustomEvent<CalendarDateSelectDetail>): void {
    e.stopPropagation();
    if (this.selectionMode === 'single') {
      this.dispatch<DatePickerDateChangeDetail>('date-change', { date: e.detail.date });
      this.requestClose('select');
      return;
    }
    this.pendingStart = e.detail.startDate;
    this.pendingEnd = e.detail.endDate;
  }

  private handleApply(): void {
    this.dispatch<DatePickerRangeChangeDetail>('range-change', {
      startDate: this.pendingStart,
      endDate: this.pendingEnd,
    });
    this.requestClose('apply');
  }

  private handleClear(): void {
    this.pendingStart = null;
    this.pendingEnd = null;
  }

  private forwardOpenChange(e: CustomEvent<PopoverOpenChangeDetail>): void {
    e.stopPropagation();
    this.dispatch<DatePickerOpenChangeDetail>('open-change', e.detail);
  }

  override render(): TemplateResult {
    const range = this.selectionMode === 'range';
    return html`
      <ui-popover
        .open=${this.open}
        trigger="manual"
        trap-focus
        placement=${this.placement}
        @open-change=${this.forwardOpenChange}
      >
        <slot name="trigger" slot="trigger"></slot>
        <div class="content">
          <ui-calendar
            selection-mode=${this.selectionMode}
            start-date=${(range ? this.pendingStart : this.startDate) ?? nothing}
            end-date=${(range ? this.pendingEnd : this.endDate) ?? nothing}
            min-date=${this.minDate ?? nothing}
            max-date=${this.maxDate ?? nothing}
            first-day-of-week=${this.firstDayOfWeek ?? nothing}
            locale=${this.locale ?? nothing}
            today=${this.today ?? nothing}
            prev-month-label=${ifDefined(this.prevMonthLabel)}
            next-month-label=${ifDefined(this.nextMonthLabel)}
            .disabledDates=${this.disabledDates}
            @date-select=${this.handleDateSelect}
          ></ui-calendar>
          ${range
            ? html`
                <div class="footer">
                  <ui-button variant="ghost" data-size="small" @click=${this.handleClear}>
                    ${this.clearLabel ?? getUiCoreConfig().labels.datePicker.clear}
                  </ui-button>
                  <ui-button variant="primary" data-size="small" @click=${this.handleApply}>
                    ${this.applyLabel ?? getUiCoreConfig().labels.datePicker.apply}
                  </ui-button>
                </div>
              `
            : nothing}
        </div>
      </ui-popover>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-date-picker': UiDatePicker;
  }
}
