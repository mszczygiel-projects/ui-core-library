import type { UiCoreConfig } from '@mszczygiel-projects/ui-core-foundations/config';
import { getUiCoreConfig } from '@mszczygiel-projects/ui-core-foundations/config';
import { iconChevronLeft, iconChevronRight } from '@mszczygiel-projects/ui-core-icons';
import type { CalendarProps } from '@mszczygiel-projects/ui-core-shared/calendar';
import {
  type CalendarCell,
  type CalendarModel,
  calendarModel,
  type CalendarState,
  type CalendarStepLabel,
  firstDayOfWeek,
  focusInMonth,
  initialFocus,
  isIsoWeekday,
  monthOf,
  nextFocusedDate,
  parseIsoMonth,
  pickCell,
  selectedDate,
  stepDate,
  zoomIn,
  zoomOut,
} from '@mszczygiel-projects/ui-core-shared/calendar-grid';
import { parseIsoDate } from '@mszczygiel-projects/ui-core-shared/date';
import { resolveLocale } from '@mszczygiel-projects/ui-core-shared/locale';
import {
  Component,
  Element,
  Event,
  type EventEmitter,
  h,
  Prop,
  State,
  type VNode,
  Watch,
} from '@stencil/core';

import { followConfig } from '../internal/config.ts';
import { browserToday } from '../internal/today.ts';
import type { CalendarChange } from './events.ts';

declare global {
  interface HTMLElementEventMap {
    'ui-month-change': CustomEvent<CalendarChange>;
  }
}

let nextId = 0;

/**
 * A month of days, with a grid of months and of years behind its heading, to pick a date or a range.
 *
 * The days form a WAI-ARIA grid labelled by the heading, with one cell in the order of the Tab
 * key. The arrow keys move by a day and a week in the direction of the text, Home and End to the
 * edges of the week, and Page Up and Page Down by a month, or a year with Shift. Enter, Space or a
 * press picks a day. The heading button opens a grid of the months of the year and then a page of
 * 24 years, and Escape goes back one grid. With `range` a user picks the first and then the last
 * day, and the value is the ISO interval `start/end`. A disabled day stays in the order of the
 * keys but cannot be picked, and a month or year that `min` and `max` rule out entirely is
 * disabled too. The `value` and `month` attributes are the first value and month, and the
 * properties the current ones. A pick dispatches `ui-value-change`, and every new month in the
 * day grid `ui-month-change`; a value or month that the page sets dispatches nothing.
 *
 * @part base - The container of the header and the grid.
 * @part header - The row of the heading and the previous and next buttons.
 * @part heading - The heading button that opens the months or the years, or the heading text
 * over the years.
 * @part previous - The button that shows the previous month, year or page of years.
 * @part next - The button that shows the next month, year or page of years.
 * @part grid - The table of the days, the months or the years.
 * @part weekday - The header of a column of the day grid.
 * @part cell - A day, a month or a year.
 */
@Component({ tag: 'ui-calendar', styleUrl: 'calendar.css', shadow: true })
export class UiCalendar implements CalendarProps {
  @Element() host!: HTMLUiCalendarElement;

  /**
   * The chosen date, `YYYY-MM-DD`, or with `range` the ISO interval `YYYY-MM-DD/YYYY-MM-DD`. The
   * attribute is the first value and the property the current one.
   */
  @Prop({ mutable: true }) value = '';

  /** Makes the value a range, which a user picks by its first and last day. */
  @Prop() range = false;

  /**
   * The month the calendar shows, `YYYY-MM`. The attribute is the first month and the property the
   * current one. Without it the calendar shows the month of the value, or else of today.
   */
  @Prop({ mutable: true }) month?: string;

  /** Earliest date a user can pick, `YYYY-MM-DD`. */
  @Prop() min?: string;

  /** Latest date a user can pick, `YYYY-MM-DD`. */
  @Prop() max?: string;

  /** Dates a user cannot pick, or a predicate for them. A property only. */
  @Prop({ attribute: null }) disabledDates?: readonly string[] | ((iso: string) => boolean);

  /** The language of the names of months and days; falls back to the configured locale. */
  @Prop() locale?: string;

  /** The first day of the week, from 1 for Monday to 7 for Sunday; the locale decides without it. */
  @Prop() firstDayOfWeek?: number;

  /** Today's date, `YYYY-MM-DD`, which the calendar marks; the browser's clock decides without it. */
  @Prop() today?: string;

  /** The name of the previous-month button, falling back to `labels.calendar.previousMonth`. */
  @Prop() previousMonthLabel?: string;

  /** The name of the next-month button, falling back to `labels.calendar.nextMonth`. */
  @Prop() nextMonthLabel?: string;

  /** The name of the previous-year button, falling back to `labels.calendar.previousYear`. */
  @Prop() previousYearLabel?: string;

  /** The name of the next-year button, falling back to `labels.calendar.nextYear`. */
  @Prop() nextYearLabel?: string;

  /** The name of the previous-years button, falling back to `labels.calendar.previousYears`. */
  @Prop() previousYearsLabel?: string;

  /** The name of the next-years button, falling back to `labels.calendar.nextYears`. */
  @Prop() nextYearsLabel?: string;

  /** The name of the heading button over the days, falling back to `labels.calendar.chooseMonth`. */
  @Prop({ attribute: null }) getChooseMonthLabel?: (monthAndYear: string) => string;

  /** The name of the heading button over the months, falling back to `labels.calendar.chooseYear`. */
  @Prop({ attribute: null }) getChooseYearLabel?: (year: string) => string;

  /** A user picked a date, or the last day of a range. */
  @Event({ eventName: 'ui-value-change' }) valueChange!: EventEmitter<CalendarChange>;

  /** The day grid shows another month after a user moved to it. */
  @Event({ eventName: 'ui-month-change' }) monthChange!: EventEmitter<CalendarChange>;

  @State() private config: UiCoreConfig = getUiCoreConfig();

  @State() private state?: CalendarState;

  /** Today in the browser, read when the element connects. */
  @State() private clockToday?: string;

  private readonly headingId = `ui-calendar-${String(++nextId)}-heading`;

  /** Set while the element writes its own value or month, which reports nothing to a watcher. */
  private writing = false;

  /** Whether the next render moves the focus to the focusable cell. */
  private focusCell = false;

  private grid?: HTMLTableElement;

  private stopFollowing?: () => void;

  connectedCallback(): void {
    this.clockToday = browserToday();
    this.stopFollowing = followConfig((config) => {
      this.config = config;
    });
  }

  disconnectedCallback(): void {
    this.stopFollowing?.();
    this.stopFollowing = undefined;
  }

  @Watch('value')
  @Watch('range')
  protected valueChanged(): void {
    if (this.writing) {
      return;
    }
    // A value that the page sets shows its month, and ends a range a user had started.
    this.state = undefined;
    const chosen = selectedDate(this.value, this.range);
    if (chosen !== undefined) {
      this.write(() => {
        this.month = monthOf(chosen);
      });
    }
  }

  @Watch('month')
  protected monthChanged(month?: string): void {
    if (this.writing || this.state === undefined || month === undefined) {
      return;
    }
    this.state = { view: 'days', focused: focusInMonth(this.state.focused, month) };
  }

  componentWillRender(): void {
    if (this.state !== undefined) {
      return;
    }
    const focused = initialFocus(this.value, this.range, this.month, this.todayDate());
    if (focused === undefined) {
      return;
    }
    this.state = { view: 'days', focused };
    if (this.shownMonth() !== monthOf(focused)) {
      this.write(() => {
        this.month = monthOf(focused);
      });
    }
  }

  componentDidRender(): void {
    if (this.focusCell) {
      this.focusCell = false;
      this.grid?.querySelector<HTMLElement>('[tabindex="0"]')?.focus();
    }
  }

  render(): VNode {
    const { state } = this;
    return (
      <div part="base" class="base">
        {state === undefined ? null : this.renderModel(state, this.modelOf(state))}
      </div>
    );
  }

  private renderModel(state: CalendarState, model: CalendarModel): VNode[] {
    const labels = this.config.labels.calendar;
    const headingText = (
      <span id={this.headingId} class="heading-text" aria-live="polite">
        {model.heading}
      </span>
    );
    const zoom = model.zoom;
    return [
      <div part="header" class="header">
        {this.renderStep('previous', model.previous, iconChevronLeft)}
        {zoom === null ? (
          <span part="heading" class="heading">
            {headingText}
          </span>
        ) : (
          <button
            part="heading"
            class="heading zoom"
            type="button"
            aria-label={
              zoom.label === 'chooseMonth'
                ? (this.getChooseMonthLabel ?? labels.chooseMonth)(zoom.text)
                : (this.getChooseYearLabel ?? labels.chooseYear)(zoom.text)
            }
            onClick={() => {
              this.state = { ...state, view: zoomOut(state.view) };
              this.focusCell = true;
            }}
          >
            {headingText}
          </button>
        )}
        {this.renderStep('next', model.next, iconChevronRight)}
      </div>,
      <table
        part="grid"
        class={`grid ${model.view}`}
        role="grid"
        aria-labelledby={this.headingId}
        ref={(element?: HTMLTableElement) => {
          this.grid = element;
        }}
        onKeyDown={(event: KeyboardEvent) => {
          this.handleKey(event);
        }}
      >
        {model.weekdays.length > 0 && (
          <thead>
            <tr>
              {model.weekdays.map((weekday) => (
                <th part="weekday" class="weekday" scope="col" abbr={weekday.long}>
                  {weekday.short}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {model.rows.map((row) => (
            <tr>{row.map((cell) => this.renderCell(state, cell))}</tr>
          ))}
        </tbody>
      </table>,
    ];
  }

  private renderStep(
    step: 'previous' | 'next',
    button: { readonly label: CalendarStepLabel; readonly disabled: boolean },
    icon: string,
  ): VNode {
    return (
      <ui-icon-button
        part={step}
        class={step}
        variant="ghost"
        size="small"
        label={this.stepLabel(button.label)}
        disabled={button.disabled}
        onClick={(event: MouseEvent) => {
          const { state } = this;
          const target =
            state === undefined
              ? null
              : stepDate(state.view, state.focused, step === 'previous' ? -1 : 1);
          if (state !== undefined && target !== null) {
            this.moveTo({ ...state, focused: target }, event);
          }
        }}
      >
        <span slot="icon" class="chevron" innerHTML={icon} />
      </ui-icon-button>
    );
  }

  private renderCell(state: CalendarState, cell: CalendarCell): VNode {
    if (cell.date === '') {
      return <td part="cell" class="cell empty" role="gridcell" />;
    }
    const classes = [
      'cell',
      `selection-${cell.selection}`,
      cell.current ? 'current' : '',
      cell.disabled ? 'disabled' : '',
      cell.outside ? 'outside' : '',
    ]
      .filter(Boolean)
      .join(' ');
    return (
      <td
        key={cell.date}
        part="cell"
        class={classes}
        role="gridcell"
        tabindex={cell.focusable ? 0 : -1}
        aria-label={cell.name}
        aria-selected={cell.selection === 'none' ? 'false' : 'true'}
        aria-disabled={cell.disabled ? 'true' : undefined}
        aria-current={cell.current ? (state.view === 'days' ? 'date' : 'true') : undefined}
        data-date={cell.date}
        onClick={(event: MouseEvent) => {
          this.pick(this.state ?? state, cell, event);
        }}
      >
        <span class="cell-label" aria-hidden="true">
          {cell.label}
        </span>
      </td>
    );
  }

  private handleKey(event: KeyboardEvent): void {
    // Keys can arrive faster than renders, so each one moves from the latest state, not from the
    // one the focused cell was rendered with.
    const { state } = this;
    const target = event.target;
    if (
      state === undefined ||
      !(target instanceof HTMLElement) ||
      target.dataset['date'] === undefined
    ) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const cell = this.modelOf(state)
        .rows.flat()
        .find((candidate) => candidate.focusable);
      if (cell !== undefined) {
        this.pick(state, cell, event);
      }
      return;
    }
    if (event.key === 'Escape') {
      const view = zoomIn(state.view);
      if (view !== undefined) {
        // Escape goes back one grid before it closes anything around the calendar.
        event.preventDefault();
        event.stopPropagation();
        this.state = { ...state, view };
        this.focusCell = true;
      }
      return;
    }
    const direction = getComputedStyle(target).direction === 'rtl' ? 'rtl' : 'ltr';
    const focused = nextFocusedDate(event.key, state.focused, {
      view: state.view,
      direction,
      firstDayOfWeek: this.weekStart(),
      shiftKey: event.shiftKey,
    });
    if (focused === undefined) {
      return;
    }
    event.preventDefault();
    this.focusCell = true;
    this.moveTo({ ...state, focused }, event);
  }

  private pick(state: CalendarState, cell: CalendarCell, event: Event): void {
    const result = pickCell(state, cell, this.range);
    if (result === undefined) {
      return;
    }
    this.focusCell = result.state.view !== state.view || cell.date !== state.focused;
    if (result.value !== undefined) {
      this.write(() => {
        this.value = result.value ?? '';
      });
      this.valueChange.emit({ value: this.value, originalEvent: event });
    }
    this.moveTo(result.state, event);
  }

  /** Moves to a state, and reports a new month once the day grid shows it. */
  private moveTo(state: CalendarState, event: Event): void {
    this.state = state;
    if (state.view !== 'days') {
      return;
    }
    const month = monthOf(state.focused);
    if (month !== this.shownMonth()) {
      this.write(() => {
        this.month = month;
      });
      this.monthChange.emit({ value: month, originalEvent: event });
    }
  }

  /** The month the day grid showed before a move. */
  private shownMonth(): string | undefined {
    return this.month !== undefined && parseIsoMonth(this.month) !== null ? this.month : undefined;
  }

  private write(update: () => void): void {
    this.writing = true;
    try {
      update();
    } finally {
      this.writing = false;
    }
  }

  private modelOf(state: CalendarState): CalendarModel {
    return calendarModel(state, {
      value: this.value,
      range: this.range,
      anchor: state.anchor,
      constraints: { min: this.min, max: this.max, disabledDates: this.disabledDates },
      locale: this.displayLocale(),
      firstDayOfWeek: this.weekStart(),
      today: this.todayDate(),
    });
  }

  private displayLocale(): string {
    return resolveLocale(this.locale, this.config.locale, navigator.language);
  }

  private weekStart(): number {
    return isIsoWeekday(this.firstDayOfWeek)
      ? this.firstDayOfWeek
      : firstDayOfWeek(this.displayLocale());
  }

  private todayDate(): string | undefined {
    return this.today !== undefined && parseIsoDate(this.today) !== null
      ? this.today
      : this.clockToday;
  }

  private stepLabel(label: CalendarStepLabel): string {
    const own: Record<CalendarStepLabel, string | undefined> = {
      previousMonth: this.previousMonthLabel,
      nextMonth: this.nextMonthLabel,
      previousYear: this.previousYearLabel,
      nextYear: this.nextYearLabel,
      previousYears: this.previousYearsLabel,
      nextYears: this.nextYearsLabel,
    };
    return own[label] ?? this.config.labels.calendar[label];
  }
}

/**
 * Every prop of the specification is a prop of the component. `implements` alone accepts a class
 * that leaves out an optional prop, so a prop added to the specification would go unnoticed.
 */
type _DeclaresEveryProp = Pick<UiCalendar, keyof CalendarProps>;
