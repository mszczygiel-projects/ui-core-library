import type { DateConstraints } from '../utils/date.ts';
import { defineComponent } from './component.ts';

/** The specification of Calendar. */
export const calendar = defineComponent({
  name: 'Calendar',
  tag: 'ui-calendar',
  category: 'Inputs',
  status: 'in-progress',
  figma: '3187:577',
  design: {
    flags: ['range'],
    booleans: [],
    codeOnly: [
      'value',
      'month',
      'min',
      'max',
      'disabledDates',
      'locale',
      'firstDayOfWeek',
      'today',
      'previousMonthLabel',
      'nextMonthLabel',
      'previousYearLabel',
      'nextYearLabel',
      'previousYearsLabel',
      'nextYearsLabel',
      'getChooseMonthLabel',
      'getChooseYearLabel',
    ],
    previews: {
      view: {
        options: ['days', 'months', 'years'],
        default: 'days',
        note: 'Previews the grid the heading button opens: the days of a month, the months of a year or a page of 24 years. Code starts on the days and moves between the grids as the user picks.',
      },
    },
  },
  summary:
    'A month of days, with a grid of months and of years behind its heading, to pick a date or a range.',
  options: {},
  labels: [
    'previousMonth',
    'nextMonth',
    'previousYear',
    'nextYear',
    'previousYears',
    'nextYears',
    'chooseMonth',
    'chooseYear',
  ],
  parts: ['base', 'header', 'heading', 'previous', 'next', 'grid', 'weekday', 'cell'],
  slots: [],
  events: ['ui-value-change', 'ui-month-change'],
  stories: ['Playground', 'Range', 'WithConstraints', 'WithLocale', 'OnSurfaces'],
  exceptions: [
    {
      items: ['size'],
      reason: 'The cells have the one size of a hit area, so the calendar has no size prop.',
    },
    {
      items: ['value', 'range'],
      reason:
        'A range is one string, the ISO interval start/end that a form submits, so that the web component takes it as an attribute. The value changes once a user picks the end of a range, and not when they pick its start.',
    },
    {
      items: ['defaultValue', 'defaultMonth'],
      reason:
        'React pairs value with defaultValue and month with defaultMonth for an uncontrolled calendar. The web component takes the first value and month from its attributes and holds the current ones in its properties.',
    },
    {
      items: ['disabledDates'],
      reason:
        'The web component takes an array or predicate as a property only, without an attribute.',
    },
  ],
});

/** What accompanies a new value or month. The package knows no browser types. */
export interface CalendarChangeDetails<OriginalEvent> {
  /** The pointer or key event that changed it. */
  readonly originalEvent: OriginalEvent;
}

/** The detail of `ui-value-change` and `ui-month-change`: the new value or month. */
export interface CalendarChangeDetail<OriginalEvent> extends CalendarChangeDetails<OriginalEvent> {
  readonly value: string;
}

/** The props both implementations of Calendar share. */
export interface CalendarProps extends DateConstraints {
  /**
   * The chosen date, `YYYY-MM-DD`, or with `range` the ISO interval `YYYY-MM-DD/YYYY-MM-DD`. An
   * empty string chooses nothing.
   * @default ''
   */
  value?: string;
  /** Makes the value a range, which a user picks by its first and last day. */
  range?: boolean;
  /**
   * The month the calendar shows, `YYYY-MM`. Without it the calendar shows the month of the value,
   * or else the month of today.
   */
  month?: string;
  /** The language of the names of months and days; falls back to the configured locale. */
  locale?: string;
  /**
   * The first day of the week, from 1 for Monday to 7 for Sunday. Without it the locale decides,
   * or Monday when the browser has no week data.
   */
  firstDayOfWeek?: number;
  /**
   * Today's date, `YYYY-MM-DD`, which the calendar marks. Without it the calendar reads the clock
   * and time zone of the browser, after hydration in React.
   */
  today?: string;
  /** The name of the previous-month button, falling back to `labels.calendar.previousMonth`. */
  previousMonthLabel?: string;
  /** The name of the next-month button, falling back to `labels.calendar.nextMonth`. */
  nextMonthLabel?: string;
  /** The name of the previous-year button, falling back to `labels.calendar.previousYear`. */
  previousYearLabel?: string;
  /** The name of the next-year button, falling back to `labels.calendar.nextYear`. */
  nextYearLabel?: string;
  /** The name of the previous-years button, falling back to `labels.calendar.previousYears`. */
  previousYearsLabel?: string;
  /** The name of the next-years button, falling back to `labels.calendar.nextYears`. */
  nextYearsLabel?: string;
  /**
   * The name of the heading button over the days, falling back to
   * `labels.calendar.chooseMonth(monthAndYear)`.
   */
  getChooseMonthLabel?: (monthAndYear: string) => string;
  /**
   * The name of the heading button over the months, falling back to
   * `labels.calendar.chooseYear(year)`.
   */
  getChooseYearLabel?: (year: string) => string;
}
