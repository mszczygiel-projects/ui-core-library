'use client';

import { iconChevronLeft, iconChevronRight } from '@mszczygiel-projects/ui-core-icons';
import type {
  CalendarChangeDetails as SharedDetails,
  CalendarProps as SharedCalendarProps,
} from '@mszczygiel-projects/ui-core-shared/calendar';
import {
  type CalendarCell,
  calendarModel,
  type CalendarState,
  type CalendarStepLabel,
  firstDayOfWeek as localeWeekStart,
  focusInMonth,
  initialFocus,
  isIsoWeekday,
  monthOf,
  nextFocusedDate,
  parseIsoMonth,
  pickCell,
  stepDate,
  zoomIn,
  zoomOut,
} from '@mszczygiel-projects/ui-core-shared/calendar-grid';
import { parseIsoDate } from '@mszczygiel-projects/ui-core-shared/date';
import { resolveLocale } from '@mszczygiel-projects/ui-core-shared/locale';
import {
  type ComponentPropsWithRef,
  type KeyboardEvent,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import { IconButton } from '../icon-button/IconButton.tsx';
import { classNames } from '../internal/class-names.ts';
import { useBrowserLanguage, useBrowserToday } from '../internal/use-browser.ts';
import { useUiCoreConfig } from '../internal/use-ui-core-config.ts';

/** What accompanies a new value or month: the native event that caused it. */
export type CalendarChangeDetails = SharedDetails<Event>;

/** The props of Calendar. Other attributes of a `div`, the ref among them, go to its root. */
export interface CalendarProps
  extends
    SharedCalendarProps,
    Omit<ComponentPropsWithRef<'div'>, keyof SharedCalendarProps | 'defaultValue' | 'onChange'> {
  /**
   * The first value of an uncontrolled calendar.
   * @default ''
   */
  defaultValue?: string;
  /** The first month of an uncontrolled calendar, `YYYY-MM`. */
  defaultMonth?: string;
  /** Called with the new value when a user picks a date, or the last day of a range. */
  onValueChange?: (value: string, details: CalendarChangeDetails) => void;
  /** Called with the new month, `YYYY-MM`, when a user moves the day grid to it. */
  onMonthChange?: (month: string, details: CalendarChangeDetails) => void;
}

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
 * disabled too. The value is controlled with `value` or uncontrolled with `defaultValue`, and the
 * month with `month` or `defaultMonth`. Without `today`, a server and the first render in the
 * browser mark no day as today and, without a value or month, show no grid; the browser's clock
 * applies right after hydration.
 */
export function Calendar({
  value,
  defaultValue = '',
  range = false,
  month,
  defaultMonth,
  min,
  max,
  disabledDates,
  locale,
  firstDayOfWeek,
  today,
  previousMonthLabel,
  nextMonthLabel,
  previousYearLabel,
  nextYearLabel,
  previousYearsLabel,
  nextYearsLabel,
  getChooseMonthLabel,
  getChooseYearLabel,
  onValueChange,
  onMonthChange,
  className,
  ...rest
}: CalendarProps) {
  const config = useUiCoreConfig();
  const labels = config.labels.calendar;
  const browserLanguage = useBrowserLanguage();
  const browserToday = useBrowserToday();
  const headingId = useId();
  const gridRef = useRef<HTMLTableElement | null>(null);
  const focusCellRef = useRef(false);

  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const [uncontrolledMonth, setUncontrolledMonth] = useState(defaultMonth);
  const [stored, setStored] = useState<CalendarState>();
  // The value the calendar last saw, and the one it last reported, so that only a value that the
  // parent sets, and not the echo of a pick, shows its month again.
  const [seenValue, setSeenValue] = useState(value);
  const [reported, setReported] = useState<string>();

  let base = stored;
  let ownMonth = uncontrolledMonth;
  if (value !== seenValue) {
    setSeenValue(value);
    if (value !== reported) {
      // A value that the parent sets shows its month, and ends a range a user had started.
      base = undefined;
      ownMonth = undefined;
      setStored(undefined);
      setUncontrolledMonth(undefined);
    }
  }
  const currentValue = value ?? uncontrolledValue;
  const currentMonth = month ?? ownMonth;
  const shownMonth =
    currentMonth !== undefined && parseIsoMonth(currentMonth) !== null ? currentMonth : undefined;
  const todayDate = today !== undefined && parseIsoDate(today) !== null ? today : browserToday;
  const displayLocale = resolveLocale(locale, config.locale, browserLanguage);
  const weekStart = isIsoWeekday(firstDayOfWeek) ? firstDayOfWeek : localeWeekStart(displayLocale);
  const initial = initialFocus(currentValue, range, shownMonth, todayDate);
  // The month the day grid shows, with which a move compares its own.
  const daysMonth = shownMonth ?? (initial === undefined ? undefined : monthOf(initial));
  const state: CalendarState | undefined =
    base === undefined
      ? initial === undefined
        ? undefined
        : { view: 'days', focused: initial }
      : shownMonth !== undefined && base.view === 'days'
        ? { ...base, focused: focusInMonth(base.focused, shownMonth) }
        : base;

  useLayoutEffect(() => {
    if (focusCellRef.current) {
      focusCellRef.current = false;
      gridRef.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus();
    }
  });

  /** Moves to a state, and reports a new month once the day grid shows it. */
  function moveTo(next: CalendarState, event: Event) {
    setStored(next);
    if (next.view !== 'days') {
      return;
    }
    const nextMonth = monthOf(next.focused);
    if (nextMonth !== daysMonth) {
      setUncontrolledMonth(nextMonth);
      onMonthChange?.(nextMonth, { originalEvent: event });
    }
  }

  function pick(from: CalendarState, cell: CalendarCell, event: Event) {
    const result = pickCell(from, cell, range);
    if (result === undefined) {
      return;
    }
    focusCellRef.current = result.state.view !== from.view || cell.date !== from.focused;
    if (result.value !== undefined) {
      setReported(result.value);
      setUncontrolledValue(result.value);
      onValueChange?.(result.value, { originalEvent: event });
    }
    moveTo(result.state, event);
  }

  function handleKey(from: CalendarState, cells: readonly CalendarCell[], event: KeyboardEvent) {
    const target = event.target;
    if (!(target instanceof HTMLElement) || target.dataset['date'] === undefined) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const cell = cells.find((candidate) => candidate.focusable);
      if (cell !== undefined) {
        pick(from, cell, event.nativeEvent);
      }
      return;
    }
    if (event.key === 'Escape') {
      const view = zoomIn(from.view);
      if (view !== undefined) {
        // Escape goes back one grid before it closes anything around the calendar.
        event.preventDefault();
        event.stopPropagation();
        focusCellRef.current = true;
        setStored({ ...from, view });
      }
      return;
    }
    const focused = nextFocusedDate(event.key, from.focused, {
      view: from.view,
      direction: getComputedStyle(target).direction === 'rtl' ? 'rtl' : 'ltr',
      firstDayOfWeek: weekStart,
      shiftKey: event.shiftKey,
    });
    if (focused === undefined) {
      return;
    }
    event.preventDefault();
    focusCellRef.current = true;
    moveTo({ ...from, focused }, event.nativeEvent);
  }

  function stepLabel(label: CalendarStepLabel): string {
    const own: Record<CalendarStepLabel, string | undefined> = {
      previousMonth: previousMonthLabel,
      nextMonth: nextMonthLabel,
      previousYear: previousYearLabel,
      nextYear: nextYearLabel,
      previousYears: previousYearsLabel,
      nextYears: nextYearsLabel,
    };
    return own[label] ?? labels[label];
  }

  if (state === undefined) {
    return <div className={classNames('ui-calendar', className)} {...rest} />;
  }

  const model = calendarModel(state, {
    value: currentValue,
    range,
    anchor: state.anchor,
    constraints: { min, max, disabledDates },
    locale: displayLocale,
    firstDayOfWeek: weekStart,
    today: todayDate,
  });
  const cells = model.rows.flat();
  const headingText = (
    <span id={headingId} className="ui-calendar__heading-text" aria-live="polite">
      {model.heading}
    </span>
  );

  const renderStep = (
    step: 'previous' | 'next',
    button: { readonly label: CalendarStepLabel; readonly disabled: boolean },
  ) => (
    <IconButton
      className={`ui-calendar__${step}`}
      variant="ghost"
      size="small"
      label={stepLabel(button.label)}
      disabled={button.disabled}
      icon={
        <span
          className="ui-calendar__chevron"
          dangerouslySetInnerHTML={{
            __html: step === 'previous' ? iconChevronLeft : iconChevronRight,
          }}
        />
      }
      onClick={(event) => {
        const target = stepDate(state.view, state.focused, step === 'previous' ? -1 : 1);
        if (target !== null) {
          moveTo({ ...state, focused: target }, event.nativeEvent);
        }
      }}
    />
  );

  const { zoom } = model;
  return (
    <div className={classNames('ui-calendar', className)} {...rest}>
      <div className="ui-calendar__header">
        {renderStep('previous', model.previous)}
        {zoom === null ? (
          <span className="ui-calendar__heading">{headingText}</span>
        ) : (
          <button
            type="button"
            className="ui-calendar__heading ui-calendar__heading--zoom"
            aria-label={
              zoom.label === 'chooseMonth'
                ? (getChooseMonthLabel ?? labels.chooseMonth)(zoom.text)
                : (getChooseYearLabel ?? labels.chooseYear)(zoom.text)
            }
            onClick={() => {
              focusCellRef.current = true;
              setStored({ ...state, view: zoomOut(state.view) });
            }}
          >
            {headingText}
          </button>
        )}
        {renderStep('next', model.next)}
      </div>
      <table
        ref={gridRef}
        className={`ui-calendar__grid ui-calendar__grid--${model.view}`}
        role="grid"
        aria-labelledby={headingId}
        onKeyDown={(event) => {
          handleKey(state, cells, event);
        }}
      >
        {model.weekdays.length > 0 && (
          <thead>
            <tr>
              {model.weekdays.map((weekday) => (
                <th
                  key={weekday.long}
                  className="ui-calendar__weekday"
                  scope="col"
                  abbr={weekday.long}
                >
                  {weekday.short}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {model.rows.map((row) => (
            <tr key={row.map((cell) => cell.date).join()}>
              {row.map((cell, index) =>
                cell.date === '' ? (
                  <td
                    key={`empty-${String(index)}`}
                    className="ui-calendar__cell ui-calendar__cell--empty"
                    role="gridcell"
                  />
                ) : (
                  <td
                    key={cell.date}
                    className={classNames(
                      'ui-calendar__cell',
                      `ui-calendar__cell--${cell.selection}`,
                      cell.current && 'ui-calendar__cell--current',
                      cell.disabled && 'ui-calendar__cell--disabled',
                      cell.outside && 'ui-calendar__cell--outside',
                    )}
                    role="gridcell"
                    tabIndex={cell.focusable ? 0 : -1}
                    aria-label={cell.name}
                    aria-selected={cell.selection !== 'none'}
                    aria-disabled={cell.disabled ? true : undefined}
                    aria-current={
                      cell.current ? (state.view === 'days' ? 'date' : true) : undefined
                    }
                    data-date={cell.date}
                    onClick={(event) => {
                      pick(state, cell, event.nativeEvent);
                    }}
                  >
                    <span className="ui-calendar__cell-label" aria-hidden="true">
                      {cell.label}
                    </span>
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
