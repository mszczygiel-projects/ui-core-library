import {
  addDays,
  addMonths,
  type DateConstraints,
  type DateParts,
  daysInMonth,
  epochDay,
  formatIsoDate,
  isoWeekday,
  parseIsoDate,
  validateDate,
} from './date.ts';
import type { TextDirection } from './radio-navigation.ts';

/**
 * The grids of a calendar that picks dates: the days of a month, the months of a year and a page
 * of years, the keys that move through them and the names Intl gives their cells. Months are ISO
 * strings, `YYYY-MM`, and every date is an ISO date counted in whole days, as in `date`.
 */

/** A month as its year and its number, counting from 1. */
export interface MonthParts {
  readonly year: number;
  readonly month: number;
}

/** What a calendar shows: the days of a month, the months of a year or a page of years. */
export type CalendarView = 'days' | 'months' | 'years';

/** How a cell of the day grid is chosen, from a single date to the middle of a range. */
export type CalendarSelection = 'none' | 'selected' | 'start' | 'end' | 'middle';

/** The columns of the month grid: four rows of three months. */
export const MONTH_COLUMNS = 3;

/** The columns of the year grid: six rows of four years. */
export const YEAR_COLUMNS = 4;

/** The years on a page of the year grid, which starts at a multiple of this number. */
export const YEARS_PER_PAGE = 24;

const ISO_MONTH = /^(\d{4})-(\d{2})$/;
const MILLISECONDS_PER_DAY = 86_400_000;
// 1970-01-05 was a Monday, so the ISO weekday w falls w - 1 days after it.
const REFERENCE_MONDAY = '1970-01-05';

/** The parts of an ISO month such as `2026-07`, or null for anything else. */
export function parseIsoMonth(text: string): MonthParts | null {
  const match = ISO_MONTH.exec(text);
  if (match === null) {
    return null;
  }
  const [, year = '', month = ''] = match;
  return parseIsoDate(`${year}-${month}-01`) === null
    ? null
    : { year: Number(year), month: Number(month) };
}

/** The ISO form of a month. Parts that are no month of the years 0001 to 9999 throw. */
export function formatIsoMonth(parts: MonthParts): string {
  return formatIsoDate({ ...parts, day: 1 }).slice(0, 7);
}

/** The month of a date: `2026-07` for `2026-07-08`. */
export function monthOf(date: string): string {
  return formatIsoDate(requireDate(date)).slice(0, 7);
}

/** The first day of a month: `2026-07-01` for `2026-07`. */
export function firstDateOf(month: string): string {
  const parts = parseIsoMonth(month);
  if (parts === null) {
    throw new RangeError(`${month} is not an ISO month of the years 0001 to 9999`);
  }
  return formatIsoDate({ ...parts, day: 1 });
}

/** The month `months` months after `month`, or null past the years 0001 to 9999. */
export function shiftMonth(month: string, months: number): string | null {
  return attempt(() => monthOf(addMonths(firstDateOf(month), months)));
}

/** Whether a number is an ISO weekday: 1 for Monday to 7 for Sunday. */
export function isIsoWeekday(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 7;
}

/**
 * The first day of the week in a locale, as an ISO weekday, from the week data of Intl: 7 for
 * en-US, 1 for pl-PL. A runtime without week data starts the week on Monday, as ISO 8601 does.
 */
export function firstDayOfWeek(locale: string): number {
  try {
    const intlLocale = new Intl.Locale(locale);
    // Engines first shipped the week data as a getter, then as getWeekInfo().
    const getter: unknown = Reflect.get(intlLocale, 'getWeekInfo');
    const info: unknown =
      typeof getter === 'function'
        ? Reflect.apply(getter, intlLocale, [])
        : Reflect.get(intlLocale, 'weekInfo');
    const first: unknown =
      typeof info === 'object' && info !== null ? Reflect.get(info, 'firstDay') : undefined;
    return isIsoWeekday(first) ? first : 1;
  } catch {
    return 1;
  }
}

/** The ISO weekdays in the order of the columns of a week that starts on `firstDay`. */
export function weekdayOrder(firstDay: number): readonly number[] {
  const first = isIsoWeekday(firstDay) ? firstDay : 1;
  return Array.from({ length: 7 }, (_, index) => ((first - 1 + index) % 7) + 1);
}

/**
 * The weeks that show a month, each seven ISO dates from `firstDay`, with the days of the months
 * around it that fill its first and last week. A day before 0001-01-01 or after 9999-12-31 is an
 * empty string.
 */
export function monthWeeks(month: string, firstDay: number): readonly (readonly string[])[] {
  const first = firstDateOf(month);
  const { year, month: monthNumber } = requireDate(first);
  const lead = (isoWeekday(first) - (weekdayOrder(firstDay)[0] ?? 1) + 7) % 7;
  const cells = Math.ceil((lead + daysInMonth(year, monthNumber)) / 7) * 7;
  const weeks: string[][] = [];
  for (let index = 0; index < cells; index++) {
    if (index % 7 === 0) {
      weeks.push([]);
    }
    weeks[weeks.length - 1]?.push(attempt(() => addDays(first, index - lead)) ?? '');
  }
  return weeks;
}

/** The years of the page of the year grid that holds `year`, without years before 0001. */
export function yearPage(year: number): readonly number[] {
  const start = year - (year % YEARS_PER_PAGE);
  return Array.from({ length: YEARS_PER_PAGE }, (_, index) => start + index).filter(
    (candidate) => candidate >= 1 && candidate <= 9999,
  );
}

/**
 * Whether a date cannot be chosen: before `min`, after `max`, excluded by `disabledDates`, or any
 * date when `min` comes after `max`. The same rules as the validation of DateField.
 */
export function isDateDisabled(date: string, constraints: DateConstraints): boolean {
  return validateDate({ value: date, inputState: 'valid' }, constraints) !== null;
}

/**
 * Whether no day of a month lies between `min` and `max`. `disabledDates` is never consulted: one
 * excluded day must not hide its month, and a predicate cannot be asked about every day.
 */
export function isMonthDisabled(month: string, constraints: DateConstraints): boolean {
  const first = firstDateOf(month);
  const { year, month: monthNumber } = requireDate(first);
  return isSpanDisabled(
    first,
    formatIsoDate({ year, month: monthNumber, day: daysInMonth(year, monthNumber) }),
    constraints,
  );
}

/** Whether no day of a year lies between `min` and `max`, as for a month. */
export function isYearDisabled(year: number, constraints: DateConstraints): boolean {
  const start = attempt(() => formatIsoDate({ year, month: 1, day: 1 }));
  return start === null || isSpanDisabled(start, start.slice(0, 4) + '-12-31', constraints);
}

/** A range of dates, its start on or before its end. */
export interface DateRange {
  readonly start: string;
  readonly end: string;
}

/**
 * The dates of an ISO interval such as `2026-07-08/2026-07-14`, the form in which a form submits
 * a range, or null for anything else, a range that ends before it starts included.
 */
export function parseIsoRange(value: string): DateRange | null {
  const [start = '', end = '', ...rest] = value.split('/');
  if (rest.length > 0 || parseIsoDate(start) === null || parseIsoDate(end) === null) {
    return null;
  }
  return start <= end ? { start, end } : null;
}

/** The ISO interval between two dates, in whichever order they come. */
export function formatIsoRange(first: string, second: string): string {
  requireDate(first);
  requireDate(second);
  return first <= second ? `${first}/${second}` : `${second}/${first}`;
}

/** What decides how a day of the grid is chosen. */
export interface SelectionContext {
  /** The value of the calendar: a date, an ISO interval, or an empty string. */
  readonly value: string;
  /** Whether the value is a range. */
  readonly range: boolean;
  /** The first date of a range that the user has started and not finished yet. */
  readonly anchor?: string;
}

/**
 * How a day is chosen. A range that starts and ends on one day, and the first date of a range in
 * progress, are a single selected day.
 */
export function selectionOf(date: string, context: SelectionContext): CalendarSelection {
  if (date === '') {
    return 'none';
  }
  if (context.anchor !== undefined && context.anchor !== '') {
    return date === context.anchor ? 'selected' : 'none';
  }
  if (!context.range) {
    return date === context.value ? 'selected' : 'none';
  }
  const range = parseIsoRange(context.value);
  if (range === null || date < range.start || date > range.end) {
    return 'none';
  }
  if (range.start === range.end) {
    return 'selected';
  }
  return date === range.start ? 'start' : date === range.end ? 'end' : 'middle';
}

/** The date in the value that a calendar opens on: the date, or the start of the range. */
export function selectedDate(value: string, range: boolean): string | undefined {
  if (range) {
    return parseIsoRange(value)?.start;
  }
  return parseIsoDate(value) === null ? undefined : value;
}

/** What turns a key into a move through a grid of the calendar. */
export interface CalendarKeyOptions {
  readonly view: CalendarView;
  /** The direction of the text, which turns the horizontal arrow keys. */
  readonly direction: TextDirection;
  /** The first day of the week, as an ISO weekday. */
  readonly firstDayOfWeek: number;
  /** Whether Shift was held, which makes Page Up and Page Down move by a year in the day grid. */
  readonly shiftKey: boolean;
}

/**
 * The date that a key moves the focus to, after the Date Picker Dialog pattern of WAI-ARIA. In the
 * day grid the arrow keys move by a day and a week, Home and End to the edges of the week, and
 * Page Up and Page Down by a month, or a year with Shift. The month grid moves the month and the
 * year grid the year of the date in the same way, by rows of their columns: months never leave
 * their year, while years turn the page, which Page Up and Page Down turn at once. A move past
 * the years 0001 to 9999 keeps the date. Returns undefined for any other key.
 */
export function nextFocusedDate(
  key: string,
  date: string,
  options: CalendarKeyOptions,
): string | undefined {
  const forward = options.direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
  const backward = options.direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
  const { year, month } = requireDate(date);
  const moveDays = (days: number): string => attempt(() => addDays(date, days)) ?? date;
  const moveMonths = (months: number): string => attempt(() => addMonths(date, months)) ?? date;
  switch (options.view) {
    case 'days': {
      const column = (isoWeekday(date) - (weekdayOrder(options.firstDayOfWeek)[0] ?? 1) + 7) % 7;
      const page = options.shiftKey ? 12 : 1;
      const steps: Readonly<Record<string, () => string>> = {
        [forward]: () => moveDays(1),
        [backward]: () => moveDays(-1),
        ArrowDown: () => moveDays(7),
        ArrowUp: () => moveDays(-7),
        Home: () => moveDays(-column),
        End: () => moveDays(6 - column),
        PageDown: () => moveMonths(page),
        PageUp: () => moveMonths(-page),
      };
      return steps[key]?.();
    }
    case 'months': {
      const column = (month - 1) % MONTH_COLUMNS;
      const within = (months: number): string =>
        month + months >= 1 && month + months <= 12 ? moveMonths(months) : date;
      const steps: Readonly<Record<string, () => string>> = {
        [forward]: () => within(1),
        [backward]: () => within(-1),
        ArrowDown: () => within(MONTH_COLUMNS),
        ArrowUp: () => within(-MONTH_COLUMNS),
        Home: () => within(-column),
        End: () => within(MONTH_COLUMNS - 1 - column),
        PageDown: () => moveMonths(12),
        PageUp: () => moveMonths(-12),
      };
      return steps[key]?.();
    }
    case 'years': {
      const column = (year % YEARS_PER_PAGE) % YEAR_COLUMNS;
      const years = (count: number): string => moveMonths(count * 12);
      const steps: Readonly<Record<string, () => string>> = {
        [forward]: () => years(1),
        [backward]: () => years(-1),
        ArrowDown: () => years(YEAR_COLUMNS),
        ArrowUp: () => years(-YEAR_COLUMNS),
        Home: () => years(-column),
        End: () => years(YEAR_COLUMNS - 1 - column),
        PageDown: () => years(YEARS_PER_PAGE),
        PageUp: () => years(-YEARS_PER_PAGE),
      };
      return steps[key]?.();
    }
  }
}

/** The name of a month and its year, such as `July 2026` in en-US, for the heading. */
export function monthYearLabel(month: string, locale: string): string {
  return format(firstDateOf(month), locale, { month: 'long', year: 'numeric' });
}

/** The name of a month alone, such as `Jul` in en-US, for a cell of the month grid. */
export function monthLabel(month: string, locale: string): string {
  return format(firstDateOf(month), locale, { month: 'short' });
}

/** A year as the locale writes it, such as `2026`. */
export function yearLabel(year: number, locale: string): string {
  return format(formatIsoDate({ year, month: 1, day: 1 }), locale, { year: 'numeric' });
}

/** The first and last year of a page, such as `2016–2039`, for the heading of the year grid. */
export function yearPageLabel(year: number, locale: string): string {
  const years = yearPage(year);
  const first = formatIsoDate({ year: years[0] ?? year, month: 1, day: 1 });
  const last = formatIsoDate({ year: years[years.length - 1] ?? year, month: 1, day: 1 });
  return formatter(locale, { year: 'numeric' }).formatRange(instantOf(first), instantOf(last));
}

/** The number of a day in the digits of the locale, for a cell of the day grid. */
export function dayLabel(date: string, locale: string): string {
  return format(date, locale, { day: 'numeric' });
}

/** A whole date with its weekday, such as `Wednesday, July 8, 2026`, the name of a day cell. */
export function fullDateLabel(date: string, locale: string): string {
  return format(date, locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

/** The name of a weekday, short for the column and long for its header. */
export interface WeekdayLabel {
  readonly short: string;
  readonly long: string;
}

/** The names of the weekdays in the order of the columns of a week that starts on `firstDay`. */
export function weekdayLabels(locale: string, firstDay: number): readonly WeekdayLabel[] {
  return weekdayOrder(firstDay).map((weekday) => {
    const date = addDays(REFERENCE_MONDAY, weekday - 1);
    return {
      short: format(date, locale, { weekday: 'short' }),
      long: format(date, locale, { weekday: 'long' }),
    };
  });
}

/** What a calendar holds between renders: the grid it shows, its focused date and a range start. */
export interface CalendarState {
  readonly view: CalendarView;
  /** The date that takes the focus; its month, year or page is what the grid shows. */
  readonly focused: string;
  /** The first date of a range that the user has picked, until they pick its last. */
  readonly anchor?: string;
}

/** What the props of a calendar decide about its grid. */
export interface CalendarContext extends SelectionContext {
  readonly constraints: DateConstraints;
  readonly locale: string;
  /** The first day of the week, as an ISO weekday. */
  readonly firstDayOfWeek: number;
  /** Today's date, when it is known. */
  readonly today?: string;
}

/** A cell of a grid: a day, a month or a year, each named by a date in it. */
export interface CalendarCell {
  /** The date the cell stands for: the day, or the focused day moved into the month or year. */
  readonly date: string;
  /** The text of the cell, such as `8`, `Jul` or `2026`. */
  readonly label: string;
  /** The accessible name of the cell, such as `Wednesday, July 8, 2026`. */
  readonly name: string;
  readonly selection: CalendarSelection;
  /** Whether the cell holds today. */
  readonly current: boolean;
  readonly disabled: boolean;
  /** Whether a day belongs to the month before or after the one shown. */
  readonly outside: boolean;
  /** Whether the cell takes the focus when the grid does. */
  readonly focusable: boolean;
}

/** The name of a label in `labels.calendar`, which a component resolves with its own props. */
export type CalendarStepLabel =
  'previousMonth' | 'nextMonth' | 'previousYear' | 'nextYear' | 'previousYears' | 'nextYears';

/** Everything a calendar renders for one state, the same in both packages. */
export interface CalendarModel {
  readonly view: CalendarView;
  /** The text of the heading: the month and year, the year, or the first and last year. */
  readonly heading: string;
  /** What the heading button opens, or null over the years, where the heading is plain text. */
  readonly zoom: { readonly label: 'chooseMonth' | 'chooseYear'; readonly text: string } | null;
  readonly previous: { readonly label: CalendarStepLabel; readonly disabled: boolean };
  readonly next: { readonly label: CalendarStepLabel; readonly disabled: boolean };
  /** The column headers of the day grid, empty over the months and years. */
  readonly weekdays: readonly WeekdayLabel[];
  readonly rows: readonly (readonly CalendarCell[])[];
}

/** The date a calendar first focuses: the value, else today, else the first day of `month`. */
export function initialFocus(
  value: string,
  range: boolean,
  month: string | undefined,
  today: string | undefined,
): string | undefined {
  const chosen = selectedDate(value, range);
  const fallback =
    chosen ?? (today !== undefined && parseIsoDate(today) !== null ? today : undefined);
  if (month === undefined || parseIsoMonth(month) === null) {
    return fallback;
  }
  return fallback !== undefined && monthOf(fallback) === month ? fallback : firstDateOf(month);
}

/**
 * The focused date moved into another month, keeping its day where the month has one, so that a
 * month that a parent sets shows with the same day focused.
 */
export function focusInMonth(focused: string, month: string): string {
  if (parseIsoMonth(month) === null || monthOf(focused) === month) {
    return focused;
  }
  const { year, month: monthNumber } = requireDate(firstDateOf(month));
  const { day } = requireDate(focused);
  return formatIsoDate({
    year,
    month: monthNumber,
    day: Math.min(day, daysInMonth(year, monthNumber)),
  });
}

/** The date the previous or next button moves to: a month, a year or a page of years away. */
export function stepDate(view: CalendarView, focused: string, step: -1 | 1): string | null {
  const months = view === 'days' ? 1 : view === 'months' ? 12 : 12 * YEARS_PER_PAGE;
  return attempt(() => addMonths(focused, step * months));
}

/** The grid, heading and buttons of a calendar in a state. */
export function calendarModel(state: CalendarState, context: CalendarContext): CalendarModel {
  const { view, focused } = state;
  const { constraints, locale } = context;
  const focusedParts = requireDate(focused);
  const chosen = selectedDate(context.value, context.range);
  const stepDisabled = (step: -1 | 1): boolean => {
    const target = stepDate(view, focused, step);
    if (target === null) {
      return true;
    }
    if (view === 'days') {
      return isMonthDisabled(monthOf(target), constraints);
    }
    if (view === 'months') {
      return isYearDisabled(requireDate(target).year, constraints);
    }
    return yearPage(requireDate(target).year).every((year) => isYearDisabled(year, constraints));
  };
  const steps = {
    days: ['previousMonth', 'nextMonth'],
    months: ['previousYear', 'nextYear'],
    years: ['previousYears', 'nextYears'],
  } as const;
  const [previousLabel, nextLabel] = steps[view];
  const previous = { label: previousLabel, disabled: stepDisabled(-1) };
  const next = { label: nextLabel, disabled: stepDisabled(1) };
  const rowsOf = (cells: readonly CalendarCell[], columns: number): CalendarCell[][] =>
    Array.from({ length: Math.ceil(cells.length / columns) }, (_, row) =>
      cells.slice(row * columns, row * columns + columns),
    );

  if (view === 'days') {
    const month = monthOf(focused);
    const heading = monthYearLabel(month, locale);
    const rows = monthWeeks(month, context.firstDayOfWeek).map((week) =>
      week.map((date): CalendarCell =>
        date === ''
          ? {
              date,
              label: '',
              name: '',
              selection: 'none',
              current: false,
              disabled: true,
              outside: true,
              focusable: false,
            }
          : {
              date,
              label: dayLabel(date, locale),
              name: fullDateLabel(date, locale),
              selection: selectionOf(date, { ...context, anchor: state.anchor }),
              current: date === context.today,
              disabled: isDateDisabled(date, constraints),
              outside: monthOf(date) !== month,
              focusable: date === focused,
            },
      ),
    );
    return {
      view,
      heading,
      zoom: { label: 'chooseMonth', text: heading },
      previous,
      next,
      weekdays: weekdayLabels(locale, context.firstDayOfWeek),
      rows,
    };
  }

  if (view === 'months') {
    const { year } = focusedParts;
    const heading = yearLabel(year, locale);
    const cells = Array.from({ length: 12 }, (_, index): CalendarCell => {
      const month = formatIsoMonth({ year, month: index + 1 });
      const date = focusInMonth(focused, month);
      return {
        date,
        label: monthLabel(month, locale),
        name: monthYearLabel(month, locale),
        selection: chosen !== undefined && monthOf(chosen) === month ? 'selected' : 'none',
        current: context.today !== undefined && monthOf(context.today) === month,
        disabled: isMonthDisabled(month, constraints),
        outside: false,
        focusable: date === focused,
      };
    });
    return {
      view,
      heading,
      zoom: { label: 'chooseYear', text: heading },
      previous,
      next,
      weekdays: [],
      rows: rowsOf(cells, MONTH_COLUMNS),
    };
  }

  const cells = yearPage(focusedParts.year).map((year): CalendarCell => {
    const date = attempt(() => addMonths(focused, (year - focusedParts.year) * 12)) ?? focused;
    const label = yearLabel(year, locale);
    return {
      date,
      label,
      name: label,
      selection: chosen !== undefined && requireDate(chosen).year === year ? 'selected' : 'none',
      current: context.today !== undefined && requireDate(context.today).year === year,
      disabled: isYearDisabled(year, constraints),
      outside: false,
      focusable: year === focusedParts.year,
    };
  });
  return {
    view,
    heading: yearPageLabel(focusedParts.year, locale),
    zoom: null,
    previous,
    next,
    weekdays: [],
    rows: rowsOf(cells, YEAR_COLUMNS),
  };
}

/** What a pick in a grid changes: the state, and the new value when the user chose one. */
export interface CalendarPick {
  readonly state: CalendarState;
  /** The new value, or undefined when the pick chose none, as the first day of a range. */
  readonly value?: string;
}

/**
 * Picks a cell. A day becomes the value, or in a range its first and then its last day; a month
 * opens its days and a year its months. A disabled cell picks nothing and returns undefined.
 */
export function pickCell(
  state: CalendarState,
  cell: Pick<CalendarCell, 'date' | 'disabled'>,
  range: boolean,
): CalendarPick | undefined {
  if (cell.disabled || cell.date === '') {
    return undefined;
  }
  if (state.view === 'years') {
    return { state: { ...state, view: 'months', focused: cell.date } };
  }
  if (state.view === 'months') {
    return { state: { ...state, view: 'days', focused: cell.date } };
  }
  if (!range) {
    return { state: { view: 'days', focused: cell.date }, value: cell.date };
  }
  if (state.anchor === undefined) {
    return { state: { view: 'days', focused: cell.date, anchor: cell.date } };
  }
  return {
    state: { view: 'days', focused: cell.date },
    value: formatIsoRange(state.anchor, cell.date),
  };
}

/** The grid the heading button opens, one level out: the months over the days, the years over them. */
export function zoomOut(view: CalendarView): CalendarView {
  return view === 'days' ? 'months' : 'years';
}

/** The grid Escape goes back to, one level in, or undefined over the days, where Escape is free. */
export function zoomIn(view: CalendarView): CalendarView | undefined {
  return view === 'years' ? 'months' : view === 'months' ? 'days' : undefined;
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let cached = formatters.get(key);
  if (cached === undefined) {
    // Each date is the start of its day in UTC, so formatting it in UTC keeps the day.
    cached = new Intl.DateTimeFormat(locale, { ...options, calendar: 'gregory', timeZone: 'UTC' });
    formatters.set(key, cached);
  }
  return cached;
}

function format(date: string, locale: string, options: Intl.DateTimeFormatOptions): string {
  return formatter(locale, options).format(instantOf(date));
}

function instantOf(date: string): number {
  return epochDay(date) * MILLISECONDS_PER_DAY;
}

function isSpanDisabled(first: string, last: string, constraints: DateConstraints): boolean {
  const { min, max } = constraints;
  const validMin = min !== undefined && parseIsoDate(min) !== null ? min : undefined;
  const validMax = max !== undefined && parseIsoDate(max) !== null ? max : undefined;
  if (validMin !== undefined && validMax !== undefined && validMin > validMax) {
    return true;
  }
  return (
    (validMin !== undefined && last < validMin) || (validMax !== undefined && first > validMax)
  );
}

function requireDate(date: string): DateParts {
  const parts = parseIsoDate(date);
  if (parts === null) {
    throw new RangeError(`${date} is not an ISO date of the years 0001 to 9999`);
  }
  return parts;
}

function attempt<Result>(compute: () => Result): Result | null {
  try {
    return compute();
  } catch {
    return null;
  }
}
