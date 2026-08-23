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
  monthKey,
  monthShortLabels,
  resolveLocale,
  monthLabel,
  parseISODate,
  todayISO,
  toISODate,
  weekdayLabels,
  withYearMonth,
  yearLabel,
  yearPageStart,
  yearRangeLabel,
  YEARS_PER_PAGE,
} from './date-utils.js';
import type { CalendarDay } from './date-utils.js';
import { getUiCoreConfig } from '@mszczygiel-projects/ui-core-foundations';

export type CalendarSelectionMode = 'single' | 'range';

/** Which grid the calendar body shows — the day grid or one of the pickers above it. */
type CalendarViewMode = 'days' | 'months' | 'years';

/** Columns per row in the month and year grids. */
const MONTH_COLUMNS = 3;
const YEAR_COLUMNS = 4;

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
 * The heading is a button that zooms out — day grid → month grid → year grid —
 * so a distant date takes a few clicks instead of one arrow press per month.
 * Picking a year returns to the months of that year, picking a month returns to
 * its days; Escape steps back one level.
 *
 * Fully controlled: clicking a day only dispatches `date-select` with the
 * proposed `{startDate, endDate}` — the consumer owns selection state and
 * passes it back via properties. The component itself tracks only the
 * displayed month, the zoom level and the roving keyboard focus.
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

  /** Accessible name of the previous-month button (day grid). */
  @property({ type: String, attribute: 'prev-month-label' }) prevMonthLabel?: string;

  /** Accessible name of the next-month button (day grid). */
  @property({ type: String, attribute: 'next-month-label' }) nextMonthLabel?: string;

  /** Accessible name of the previous-year button (month grid). */
  @property({ type: String, attribute: 'prev-year-label' }) prevYearLabel?: string;

  /** Accessible name of the next-year button (month grid). */
  @property({ type: String, attribute: 'next-year-label' }) nextYearLabel?: string;

  /** Accessible name of the previous year-page button (year grid). */
  @property({ type: String, attribute: 'prev-years-label' }) prevYearsLabel?: string;

  /** Accessible name of the next year-page button (year grid). */
  @property({ type: String, attribute: 'next-years-label' }) nextYearsLabel?: string;

  /**
   * Accessible name of the heading button that opens the month grid; receives
   * the visible heading text.
   * @default `getUiCoreConfig().labels.calendar.chooseMonth`
   */
  @property({ attribute: false }) chooseMonthLabel?: (monthAndYear: string) => string;

  /**
   * Accessible name of the heading button that opens the year grid; receives
   * the visible year.
   * @default `getUiCoreConfig().labels.calendar.chooseYear`
   */
  @property({ attribute: false }) chooseYearLabel?: (year: string) => string;

  @state() private viewYear = 0;
  @state() private viewMonth = 0; // 1-12
  @state() private viewMode: CalendarViewMode = 'days';
  @state() private yearPage = 0; // first year shown by the year grid
  @state() private focusedISO = '';
  @state() private focusedMonth = 0; // 1-12, roving focus of the month grid
  @state() private focusedYear = 0; // roving focus of the year grid
  @state() private hoverISO: string | null = null;

  private get resolvedLocale(): string {
    return resolveLocale(this.locale);
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

  /**
   * A month is out of reach only when *every* one of its days is — `min-date`
   * and `max-date` alone; a `disabledDates` predicate is left to the day grid.
   */
  private isMonthDisabled(year: number, month: number): boolean {
    const key = monthKey(year, month);
    if (this.minDate && key < this.minDate.slice(0, 7)) return true;
    if (this.maxDate && key > this.maxDate.slice(0, 7)) return true;
    return false;
  }

  private isYearDisabled(year: number): boolean {
    if (this.minDate && year < Number(this.minDate.slice(0, 4))) return true;
    if (this.maxDate && year > Number(this.maxDate.slice(0, 4))) return true;
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

  /** The single place the displayed month moves — every path reports it once. */
  private setView(year: number, month: number): void {
    if (year === this.viewYear && month === this.viewMonth) return;
    this.viewYear = year;
    this.viewMonth = month;
    this.dispatch<CalendarMonthChangeDetail>('month-change', { year, month });
  }

  private showMonthOf(iso: string): void {
    const d = parseISODate(iso);
    if (!d) return;
    this.setView(d.getFullYear(), d.getMonth() + 1);
  }

  private navigateMonth(delta: number): void {
    const next = addMonths(this.viewYear, this.viewMonth, delta);
    this.setView(next.year, next.month);
  }

  private async moveFocus(iso: string | null): Promise<void> {
    if (!iso || !parseISODate(iso)) return;
    this.focusedISO = iso;
    this.showMonthOf(iso);
    await this.updateComplete;
    const btn = this.shadowRoot?.querySelector<HTMLButtonElement>(`button[data-iso="${iso}"]`);
    btn?.focus();
  }

  /* ---- Zoom levels ---- */

  private openMonthGrid(): void {
    this.viewMode = 'months';
    this.focusedMonth = this.viewMonth;
    void this.focusPickerCell();
  }

  private openYearGrid(): void {
    this.viewMode = 'years';
    this.yearPage = yearPageStart(this.viewYear);
    this.focusedYear = this.viewYear;
    void this.focusPickerCell();
  }

  /** Back to the day grid, with the roving focus kept inside the shown month. */
  private async showDayGrid(): Promise<void> {
    this.viewMode = 'days';
    this.focusedISO = withYearMonth(
      this.focusedISO || this.todayIso,
      this.viewYear,
      this.viewMonth,
    );
    const iso = this.focusedISO;
    await this.updateComplete;
    this.shadowRoot?.querySelector<HTMLButtonElement>(`button[data-iso="${iso}"]`)?.focus();
  }

  private selectMonth(month: number): void {
    if (this.isMonthDisabled(this.viewYear, month)) return;
    this.setView(this.viewYear, month);
    void this.showDayGrid();
  }

  private selectYear(year: number): void {
    if (this.isYearDisabled(year)) return;
    this.setView(year, this.viewMonth);
    this.viewMode = 'months';
    this.focusedMonth = this.viewMonth;
    void this.focusPickerCell();
  }

  private async focusPickerCell(): Promise<void> {
    await this.updateComplete;
    this.shadowRoot?.querySelector<HTMLButtonElement>('.picker-item[tabindex="0"]')?.focus();
  }

  /**
   * Escape steps one level back down. Inside `ui-date-picker` the popover has
   * already seen the same key on its document capture listener and closes — the
   * collapse then just makes sure the panel reopens on the day grid.
   */
  private handleRootKeydown(e: KeyboardEvent): void {
    if (e.key !== 'Escape' || this.viewMode === 'days') return;
    e.preventDefault();
    if (this.viewMode === 'years') {
      this.viewMode = 'months';
      this.focusedMonth = this.viewMonth;
      void this.focusPickerCell();
      return;
    }
    void this.showDayGrid();
  }

  /**
   * The month/year grids are a transient zoom, not a mode: once focus leaves the
   * calendar for good (Tab away, or the picker popover closing), collapse back
   * to the day grid. Deferred by a task because a level switch replaces the
   * focused button before the new one is focused.
   */
  private handleRootFocusOut(): void {
    if (this.viewMode === 'days') return;
    setTimeout(() => {
      if (this.viewMode === 'days' || this.shadowRoot?.activeElement) return;
      this.viewMode = 'days';
    });
  }

  /* ---- Keyboard ---- */

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

  /** Roving focus inside the month grid; months never spill into another year. */
  private handleMonthGridKeydown(e: KeyboardEvent): void {
    const from = this.focusedMonth;
    let target = from;
    switch (e.key) {
      case 'ArrowLeft':
        target = from - 1;
        break;
      case 'ArrowRight':
        target = from + 1;
        break;
      case 'ArrowUp':
        target = from - MONTH_COLUMNS;
        break;
      case 'ArrowDown':
        target = from + MONTH_COLUMNS;
        break;
      case 'Home':
        target = 1;
        break;
      case 'End':
        target = 12;
        break;
      case 'PageUp':
      case 'PageDown':
        e.preventDefault();
        this.setView(this.viewYear + (e.key === 'PageUp' ? -1 : 1), this.viewMonth);
        void this.focusPickerCell();
        return;
      default:
        return;
    }
    e.preventDefault();
    if (target < 1 || target > 12) return;
    this.focusedMonth = target;
    void this.focusPickerCell();
  }

  /** Roving focus inside the year grid; crossing an edge turns the page. */
  private handleYearGridKeydown(e: KeyboardEvent): void {
    const from = this.focusedYear;
    let target = from;
    switch (e.key) {
      case 'ArrowLeft':
        target = from - 1;
        break;
      case 'ArrowRight':
        target = from + 1;
        break;
      case 'ArrowUp':
        target = from - YEAR_COLUMNS;
        break;
      case 'ArrowDown':
        target = from + YEAR_COLUMNS;
        break;
      case 'Home':
        target = this.yearPage;
        break;
      case 'End':
        target = this.yearPage + YEARS_PER_PAGE - 1;
        break;
      case 'PageUp':
        target = from - YEARS_PER_PAGE;
        break;
      case 'PageDown':
        target = from + YEARS_PER_PAGE;
        break;
      default:
        return;
    }
    e.preventDefault();
    this.focusedYear = target;
    if (target < this.yearPage || target >= this.yearPage + YEARS_PER_PAGE) {
      this.yearPage = yearPageStart(target);
    }
    void this.focusPickerCell();
  }

  /* ---- Rendering ---- */

  private renderDay(day: CalendarDay): TemplateResult {
    const range = this.effectiveRange();
    const singleSelected = this.selectionMode === 'single' && day.iso === this.startDate;
    const isStart = !!range && day.iso === range.start;
    const isEnd = !!range && day.iso === range.end;
    const inRange = !!range && day.iso > range.start && day.iso < range.end;
    // A lone range start (no end yet, no hover) still renders as selected.
    const loneStart = this.selectionMode === 'range' && !range && day.iso === this.startDate;
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

  private renderDayGrid(): TemplateResult {
    const weeks = buildWeeks(this.viewYear, this.viewMonth, this.resolvedFirstDay);
    const labels = weekdayLabels(this.resolvedLocale, this.resolvedFirstDay);
    return html`
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
    `;
  }

  private renderPickerCell(
    text: string,
    ariaLabel: string,
    { focused, selected, current, disabled, onSelect }: PickerCellState,
  ): TemplateResult {
    return html`
      <div role="gridcell" class="picker-cell" aria-selected=${selected ? 'true' : 'false'}>
        <button
          type="button"
          class=${classMap({
            'picker-item': true,
            'picker-item--selected': selected,
            'picker-item--current': current && !selected,
            'picker-item--disabled': disabled,
          })}
          tabindex=${focused ? '0' : '-1'}
          aria-label=${ariaLabel}
          aria-current=${current ? 'date' : nothing}
          aria-disabled=${disabled ? 'true' : nothing}
          @click=${onSelect}
        >
          ${text}
        </button>
      </div>
    `;
  }

  private renderMonthGrid(): TemplateResult {
    const locale = this.resolvedLocale;
    const names = monthShortLabels(locale);
    const todayDate = parseISODate(this.todayIso);
    const selectedMonths = this.selectedMonthKeys();
    const rows = Array.from({ length: 12 / MONTH_COLUMNS }, (_, r) => r * MONTH_COLUMNS);
    return html`
      <div
        class="picker"
        role="grid"
        aria-labelledby="month-label"
        @keydown=${this.handleMonthGridKeydown}
      >
        ${rows.map(
          (offset) => html`
            <div class="picker-row" role="row">
              ${names.slice(offset, offset + MONTH_COLUMNS).map((name, i) => {
                const month = offset + i + 1;
                return this.renderPickerCell(name, monthLabel(locale, this.viewYear, month), {
                  focused: month === this.focusedMonth,
                  selected: selectedMonths.has(monthKey(this.viewYear, month)),
                  current:
                    !!todayDate &&
                    todayDate.getFullYear() === this.viewYear &&
                    todayDate.getMonth() + 1 === month,
                  disabled: this.isMonthDisabled(this.viewYear, month),
                  onSelect: () => this.selectMonth(month),
                });
              })}
            </div>
          `,
        )}
      </div>
    `;
  }

  private renderYearGrid(): TemplateResult {
    const locale = this.resolvedLocale;
    const todayDate = parseISODate(this.todayIso);
    const selectedYears = new Set(
      [this.startDate, this.endDate].filter(Boolean).map((iso) => (iso as string).slice(0, 4)),
    );
    const rows = Array.from({ length: YEARS_PER_PAGE / YEAR_COLUMNS }, (_, r) => r * YEAR_COLUMNS);
    return html`
      <div
        class="picker"
        role="grid"
        aria-labelledby="month-label"
        @keydown=${this.handleYearGridKeydown}
      >
        ${rows.map(
          (offset) => html`
            <div class="picker-row" role="row">
              ${Array.from({ length: YEAR_COLUMNS }, (_, i) => {
                const year = this.yearPage + offset + i;
                const text = yearLabel(locale, year);
                return this.renderPickerCell(text, text, {
                  focused: year === this.focusedYear,
                  selected: selectedYears.has(String(year).padStart(4, '0')),
                  current: !!todayDate && todayDate.getFullYear() === year,
                  disabled: this.isYearDisabled(year),
                  onSelect: () => this.selectYear(year),
                });
              })}
            </div>
          `,
        )}
      </div>
    `;
  }

  /** `YYYY-MM` keys of the selected endpoints — both, in range mode. */
  private selectedMonthKeys(): Set<string> {
    return new Set(
      [this.startDate, this.endDate].filter(Boolean).map((iso) => (iso as string).slice(0, 7)),
    );
  }

  private renderHeader(): TemplateResult {
    const labels = getUiCoreConfig().labels.calendar;
    const locale = this.resolvedLocale;
    const mode = this.viewMode;

    const heading =
      mode === 'days'
        ? monthLabel(locale, this.viewYear, this.viewMonth)
        : mode === 'months'
          ? yearLabel(locale, this.viewYear)
          : yearRangeLabel(locale, this.yearPage, this.yearPage + YEARS_PER_PAGE - 1);

    // Each level keeps the same two chevrons and only changes their stride:
    // a month, a year, then a whole year page.
    const prevLabel =
      mode === 'days'
        ? (this.prevMonthLabel ?? labels.previousMonth)
        : mode === 'months'
          ? (this.prevYearLabel ?? labels.previousYear)
          : (this.prevYearsLabel ?? labels.previousYears);
    const nextLabel =
      mode === 'days'
        ? (this.nextMonthLabel ?? labels.nextMonth)
        : mode === 'months'
          ? (this.nextYearLabel ?? labels.nextYear)
          : (this.nextYearsLabel ?? labels.nextYears);

    const navigate = (direction: -1 | 1): void => {
      if (mode === 'days') this.navigateMonth(direction);
      else if (mode === 'months') this.setView(this.viewYear + direction, this.viewMonth);
      else this.yearPage += direction * YEARS_PER_PAGE;
    };

    const zoomLabel =
      mode === 'days'
        ? (this.chooseMonthLabel ?? labels.chooseMonth)(heading)
        : (this.chooseYearLabel ?? labels.chooseYear)(heading);

    return html`
      <div class="header">
        <button type="button" class="nav" aria-label=${prevLabel} @click=${() => navigate(-1)}>
          ${unsafeSVG(svgMap['icon-chevron-left'])}
        </button>
        ${mode === 'years'
          ? // The year grid is the top level — nothing left to zoom out to.
            html`<span class="month-label" id="month-label">${heading}</span>`
          : html`
              <button
                type="button"
                class="zoom"
                aria-label=${zoomLabel}
                @click=${mode === 'days' ? () => this.openMonthGrid() : () => this.openYearGrid()}
              >
                <span class="month-label" id="month-label">${heading}</span>
                <span class="zoom-icon">${unsafeSVG(svgMap['icon-chevron-down'])}</span>
              </button>
            `}
        <button type="button" class="nav" aria-label=${nextLabel} @click=${() => navigate(1)}>
          ${unsafeSVG(svgMap['icon-chevron-right'])}
        </button>
      </div>
    `;
  }

  override render(): TemplateResult {
    return html`
      <div class="calendar" @keydown=${this.handleRootKeydown} @focusout=${this.handleRootFocusOut}>
        ${this.renderHeader()}
        ${this.viewMode === 'days'
          ? this.renderDayGrid()
          : this.viewMode === 'months'
            ? this.renderMonthGrid()
            : this.renderYearGrid()}
      </div>
    `;
  }
}

interface PickerCellState {
  focused: boolean;
  selected: boolean;
  current: boolean;
  disabled: boolean;
  onSelect: () => void;
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-calendar': UiCalendar;
  }
}
