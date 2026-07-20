import { LitElement, html, nothing } from 'lit';
import type { PropertyValues, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { svgMap } from '@mszczygiel-projects/ui-core-icons';
import { calendarStyles } from './calendar.styles.js';
import { focusStyles } from '../styles/focus.styles.js';
import { resetStyles } from '../styles/reset.styles.js';
import {
  addDaysISO,
  addMonths,
  buildWeeks,
  dayLabel,
  daysInMonth,
  localeFirstDayOfWeek,
  monthLabel,
  parseISODate,
  todayISO,
  toISODate,
  weekdayLabels,
} from './date-utils.js';
import type { CalendarDay } from './date-utils.js';

export type CalendarSelectionMode = 'single' | 'range';

export interface CalendarDateSelectDetail {
  /** The clicked date. */
  date: string;
  /** Proposed selection after applying the click — consumer owns the state. */
  startDate: string | null;
  endDate: string | null;
}

export interface CalendarMonthChangeDetail {
  year: number;
  /** 1-12. */
  month: number;
}

/**
 * Pure date-grid component: renders one month with weekday header and
 * navigation, supports single-date and range selection.
 *
 * Fully controlled: clicking a day only dispatches `date-select` with the
 * proposed `{startDate, endDate}` — the consumer owns selection state and
 * passes it back via properties. The component itself tracks only the
 * displayed month and the roving keyboard focus.
 *
 * Locale handling uses the native `Intl` API (`weekInfo` for first day of
 * week) — no i18n library; the host app decides the BCP 47 tag.
 *
 * @element ui-calendar
 *
 * @fires date-select - `{ date, startDate, endDate }` proposed selection.
 * @fires month-change - `{ year, month }` after view-month navigation.
 *
 * @example
 * ```html
 * <ui-calendar selection-mode="range" start-date="2026-07-08" end-date="2026-07-14"></ui-calendar>
 * ```
 */
@customElement('ui-calendar')
export class UiCalendar extends LitElement {
  static override styles = [resetStyles, calendarStyles, focusStyles];

  /**
   * Selection behavior: `single` tracks one date (`start-date`), `range`
   * tracks `start-date`/`end-date` with an in-range fill between them.
   * @default 'single'
   */
  @property({ type: String, reflect: true, attribute: 'selection-mode' })
  selectionMode: CalendarSelectionMode = 'single';

  /** Selected date (single mode) or range start, ISO `YYYY-MM-DD`. */
  @property({ type: String, attribute: 'start-date' }) startDate?: string;

  /** Range end, ISO `YYYY-MM-DD` (range mode only). */
  @property({ type: String, attribute: 'end-date' }) endDate?: string;

  /** Earliest selectable date, ISO `YYYY-MM-DD`. */
  @property({ type: String, attribute: 'min-date' }) minDate?: string;

  /** Latest selectable date, ISO `YYYY-MM-DD`. */
  @property({ type: String, attribute: 'max-date' }) maxDate?: string;

  /** Disabled dates: array of ISO strings or a predicate. Property-only. */
  @property({ attribute: false }) disabledDates?: string[] | ((iso: string) => boolean);

  /**
   * First day of week, ISO 1 (Monday) … 7 (Sunday). Defaults to the locale's
   * `Intl.Locale#weekInfo` value (Monday when unavailable).
   */
  @property({ type: Number, attribute: 'first-day-of-week' }) firstDayOfWeek?: number;

  /** BCP 47 locale tag for month/weekday names; defaults to the runtime locale. */
  @property({ type: String }) locale?: string;

  /** Override of "today" (ISO) — deterministic rendering for tests/SSR. */
  @property({ type: String }) today?: string;

  /** Accessible name of the previous-month button. */
  @property({ type: String, attribute: 'prev-month-label' }) prevMonthLabel = 'Previous month';

  /** Accessible name of the next-month button. */
  @property({ type: String, attribute: 'next-month-label' }) nextMonthLabel = 'Next month';

  @state() private viewYear = 0;
  @state() private viewMonth = 0; // 1-12
  @state() private focusedISO = '';
  @state() private hoverISO: string | null = null;

  private get resolvedLocale(): string {
    return (
      this.locale || (typeof navigator !== 'undefined' ? navigator.language : '') || 'en-US'
    );
  }

  private get resolvedFirstDay(): number {
    const f = this.firstDayOfWeek;
    if (f && f >= 1 && f <= 7) return f;
    return localeFirstDayOfWeek(this.resolvedLocale);
  }

  private get todayIso(): string {
    return this.today && parseISODate(this.today) ? this.today : todayISO();
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.viewYear) this.resetView();
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    // Jump the view to a newly set start date (e.g. consumer applied a selection).
    if (changed.has('startDate') && this.startDate) {
      const d = parseISODate(this.startDate);
      if (d) {
        this.viewYear = d.getFullYear();
        this.viewMonth = d.getMonth() + 1;
        this.focusedISO = this.startDate;
      }
    }
    if (changed.has('today') && !this.startDate) this.resetView();
  }

  private resetView(): void {
    const base = parseISODate(this.startDate) ?? parseISODate(this.todayIso) ?? new Date();
    this.viewYear = base.getFullYear();
    this.viewMonth = base.getMonth() + 1;
    this.focusedISO = toISODate(base);
  }

  private isDisabled(iso: string): boolean {
    if (this.minDate && iso < this.minDate) return true;
    if (this.maxDate && iso > this.maxDate) return true;
    const dd = this.disabledDates;
    if (Array.isArray(dd)) return dd.includes(iso);
    if (typeof dd === 'function') return dd(iso);
    return false;
  }

  /** Normalized [start, end] including the hover preview while picking the end. */
  private effectiveRange(): { start: string; end: string } | null {
    if (this.selectionMode !== 'range' || !this.startDate) return null;
    const end = this.endDate ?? this.hoverISO ?? null;
    if (!end) return null;
    return end < this.startDate
      ? { start: end, end: this.startDate }
      : { start: this.startDate, end };
  }

  private dispatch<T>(name: string, detail: T): void {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  private proposeSelection(date: string): CalendarDateSelectDetail {
    if (this.selectionMode === 'single') return { date, startDate: date, endDate: null };
    // Range: no start, or a complete range → restart; otherwise complete it
    // (swapping when the second click lands before the start).
    if (!this.startDate || this.endDate) return { date, startDate: date, endDate: null };
    return date < this.startDate
      ? { date, startDate: date, endDate: this.startDate }
      : { date, startDate: this.startDate, endDate: date };
  }

  private handleDayClick(day: CalendarDay): void {
    if (this.isDisabled(day.iso)) return;
    this.focusedISO = day.iso;
    if (!day.inMonth) this.showMonthOf(day.iso);
    this.dispatch<CalendarDateSelectDetail>('date-select', this.proposeSelection(day.iso));
  }

  private showMonthOf(iso: string): void {
    const d = parseISODate(iso);
    if (!d) return;
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    if (year !== this.viewYear || month !== this.viewMonth) {
      this.viewYear = year;
      this.viewMonth = month;
      this.dispatch<CalendarMonthChangeDetail>('month-change', { year, month });
    }
  }

  private navigateMonth(delta: number): void {
    const next = addMonths(this.viewYear, this.viewMonth, delta);
    this.viewYear = next.year;
    this.viewMonth = next.month;
    this.dispatch<CalendarMonthChangeDetail>('month-change', {
      year: next.year,
      month: next.month,
    });
  }

  private async moveFocus(iso: string | null): Promise<void> {
    if (!iso || !parseISODate(iso)) return;
    this.focusedISO = iso;
    this.showMonthOf(iso);
    await this.updateComplete;
    const btn = this.shadowRoot?.querySelector<HTMLButtonElement>(`button[data-iso="${iso}"]`);
    btn?.focus();
  }

  private handleGridKeydown(e: KeyboardEvent): void {
    const from = this.focusedISO;
    if (!from) return;
    const firstDay = this.resolvedFirstDay;
    let target: string | null = null;
    switch (e.key) {
      case 'ArrowLeft':
        target = addDaysISO(from, -1);
        break;
      case 'ArrowRight':
        target = addDaysISO(from, 1);
        break;
      case 'ArrowUp':
        target = addDaysISO(from, -7);
        break;
      case 'ArrowDown':
        target = addDaysISO(from, 7);
        break;
      case 'Home':
      case 'End': {
        const d = parseISODate(from);
        if (!d) return;
        const isoDay = ((d.getDay() + 6) % 7) + 1;
        const offset = (isoDay - firstDay + 7) % 7;
        target = addDaysISO(from, e.key === 'Home' ? -offset : 6 - offset);
        break;
      }
      case 'PageUp':
      case 'PageDown': {
        const d = parseISODate(from);
        if (!d) return;
        const next = addMonths(d.getFullYear(), d.getMonth() + 1, e.key === 'PageUp' ? -1 : 1);
        const day = Math.min(d.getDate(), daysInMonth(next.year, next.month));
        const p = (n: number, l = 2) => String(n).padStart(l, '0');
        target = `${p(next.year, 4)}-${p(next.month)}-${p(day)}`;
        break;
      }
      default:
        return;
    }
    e.preventDefault();
    void this.moveFocus(target);
  }

  private renderDay(day: CalendarDay): TemplateResult {
    const range = this.effectiveRange();
    const singleSelected = this.selectionMode === 'single' && day.iso === this.startDate;
    const isStart = !!range && day.iso === range.start;
    const isEnd = !!range && day.iso === range.end;
    const inRange = !!range && day.iso > range.start && day.iso < range.end;
    // A lone range start (no end yet, no hover) still renders as selected.
    const loneStart =
      this.selectionMode === 'range' && !range && day.iso === this.startDate;
    const isEndpoint = isStart || isEnd || loneStart;
    const selected = singleSelected || isEndpoint || inRange;
    const disabled = this.isDisabled(day.iso);
    const isToday = day.iso === this.todayIso;
    const showBand = range && range.start !== range.end;

    return html`
      <div role="gridcell" class="day-cell" aria-selected=${selected ? 'true' : 'false'}>
        ${showBand && isStart ? html`<span class="band band--start"></span>` : nothing}
        ${showBand && isEnd ? html`<span class="band band--end"></span>` : nothing}
        ${showBand && inRange ? html`<span class="band band--full"></span>` : nothing}
        <button
          type="button"
          data-iso=${day.iso}
          class=${classMap({
            day: true,
            'day--selected': singleSelected,
            'day--range-start': isStart || loneStart,
            'day--range-end': isEnd,
            'day--in-range': inRange,
            'day--today': isToday,
            'day--outside': !day.inMonth && !selected,
            'day--disabled': disabled,
          })}
          tabindex=${day.iso === this.focusedISO ? '0' : '-1'}
          aria-label=${dayLabel(this.resolvedLocale, day.iso)}
          aria-current=${isToday ? 'date' : nothing}
          aria-disabled=${disabled ? 'true' : nothing}
          @click=${() => this.handleDayClick(day)}
          @focus=${() => {
            this.focusedISO = day.iso;
          }}
          @mouseenter=${this.selectionMode === 'range' && this.startDate && !this.endDate
            ? () => {
                this.hoverISO = day.iso;
              }
            : nothing}
        >
          ${day.day}
        </button>
      </div>
    `;
  }

  override render(): TemplateResult {
    const weeks = buildWeeks(this.viewYear, this.viewMonth, this.resolvedFirstDay);
    const labels = weekdayLabels(this.resolvedLocale, this.resolvedFirstDay);
    return html`
      <div class="calendar">
        <div class="header">
          <button
            type="button"
            class="nav"
            aria-label=${this.prevMonthLabel}
            @click=${() => this.navigateMonth(-1)}
          >
            ${unsafeSVG(svgMap['icon-chevron-left'])}
          </button>
          <span class="month-label" id="month-label"
            >${monthLabel(this.resolvedLocale, this.viewYear, this.viewMonth)}</span
          >
          <button
            type="button"
            class="nav"
            aria-label=${this.nextMonthLabel}
            @click=${() => this.navigateMonth(1)}
          >
            ${unsafeSVG(svgMap['icon-chevron-right'])}
          </button>
        </div>
        <div
          class="grid"
          role="grid"
          aria-labelledby="month-label"
          @keydown=${this.handleGridKeydown}
          @mouseleave=${() => {
            this.hoverISO = null;
          }}
        >
          <div class="week" role="row">
            ${labels.map((l) => html`<span class="weekday" role="columnheader">${l}</span>`)}
          </div>
          ${weeks.map(
            (week) => html`<div class="week" role="row">${week.map((d) => this.renderDay(d))}</div>`,
          )}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-calendar': UiCalendar;
  }
}
