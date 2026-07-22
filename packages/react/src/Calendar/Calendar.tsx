import { useEffect, useId, useRef, useState } from 'react';
import type { AriaAttributes, CSSProperties, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { IconChevronLeft, IconChevronRight } from '@mszczygiel-projects/ui-core-icons/react';
import { pickAriaProps } from '../aria.js';
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
import './Calendar.css';

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
 * Fully controlled: clicking a day only calls `onDateSelect` with the proposed
 * `{startDate, endDate}` — the consumer owns selection state and passes it back
 * as props. The component itself tracks only the displayed month and the roving
 * keyboard focus. Locale handling uses the native `Intl` API (`weekInfo` for
 * first day of week) — no i18n library.
 *
 * Any `aria-*` attribute is forwarded to the `role="grid"` element.
 *
 * @example
 * <Calendar selectionMode="range" startDate="2026-07-08" endDate="2026-07-14"
 *   onDateSelect={(d) => setRange(d)} />
 */
export interface CalendarProps extends AriaAttributes {
  /**
   * Selection behavior: `single` tracks one date (`startDate`), `range` tracks
   * `startDate`/`endDate` with an in-range fill between them.
   * @default 'single'
   */
  selectionMode?: CalendarSelectionMode;
  /** Selected date (single mode) or range start, ISO `YYYY-MM-DD`. */
  startDate?: string;
  /** Range end, ISO `YYYY-MM-DD` (range mode only). */
  endDate?: string;
  /** Earliest selectable date, ISO `YYYY-MM-DD`. */
  minDate?: string;
  /** Latest selectable date, ISO `YYYY-MM-DD`. */
  maxDate?: string;
  /** Disabled dates: array of ISO strings or a predicate. */
  disabledDates?: string[] | ((iso: string) => boolean);
  /**
   * First day of week, ISO 1 (Monday) … 7 (Sunday). Defaults to the locale's
   * `Intl.Locale#weekInfo` value (Monday when unavailable).
   */
  firstDayOfWeek?: number;
  /** BCP 47 locale tag for month/weekday names; defaults to the runtime locale. */
  locale?: string;
  /** Override of "today" (ISO) — deterministic rendering for tests/SSR. */
  today?: string;
  /** Accessible name of the previous-month button. */
  prevMonthLabel?: string;
  /** Accessible name of the next-month button. */
  nextMonthLabel?: string;
  /** Called with the proposed selection after a day is clicked. */
  onDateSelect?: (detail: CalendarDateSelectDetail) => void;
  /** Called after view-month navigation. */
  onMonthChange?: (detail: CalendarMonthChangeDetail) => void;
  /** Extra class names appended to the root element. */
  className?: string;
  /** Inline styles forwarded to the root element (positioning only — never visual styles). */
  style?: CSSProperties;
}

export function Calendar({
  selectionMode = 'single',
  startDate,
  endDate,
  minDate,
  maxDate,
  disabledDates,
  firstDayOfWeek,
  locale,
  today,
  prevMonthLabel = 'Previous month',
  nextMonthLabel = 'Next month',
  onDateSelect,
  onMonthChange,
  className,
  style,
  ...aria
}: CalendarProps) {
  const resolvedLocale =
    locale || (typeof navigator !== 'undefined' ? navigator.language : '') || 'en-US';
  const resolvedFirstDay =
    firstDayOfWeek && firstDayOfWeek >= 1 && firstDayOfWeek <= 7
      ? firstDayOfWeek
      : localeFirstDayOfWeek(resolvedLocale);
  const todayIso = today && parseISODate(today) ? today : todayISO();

  const initial = parseISODate(startDate) ?? parseISODate(todayIso) ?? new Date();
  const [view, setView] = useState({
    year: initial.getFullYear(),
    month: initial.getMonth() + 1,
  });
  const [focusedISO, setFocusedISO] = useState(toISODate(initial));
  const [hoverISO, setHoverISO] = useState<string | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef(false);
  const monthLabelId = useId();

  // Jump the view to a newly applied start date.
  useEffect(() => {
    if (!startDate) return;
    const d = parseISODate(startDate);
    if (!d) return;
    setView({ year: d.getFullYear(), month: d.getMonth() + 1 });
    setFocusedISO(startDate);
  }, [startDate]);

  // Move DOM focus after keyboard navigation (once the target is rendered).
  useEffect(() => {
    if (!pendingFocus.current) return;
    pendingFocus.current = false;
    rootRef.current?.querySelector<HTMLButtonElement>(`button[data-iso="${focusedISO}"]`)?.focus();
  }, [focusedISO, view]);

  const isDisabled = (iso: string): boolean => {
    if (minDate && iso < minDate) return true;
    if (maxDate && iso > maxDate) return true;
    if (Array.isArray(disabledDates)) return disabledDates.includes(iso);
    if (typeof disabledDates === 'function') return disabledDates(iso);
    return false;
  };

  const effectiveRange = (): { start: string; end: string } | null => {
    if (selectionMode !== 'range' || !startDate) return null;
    const end = endDate ?? hoverISO ?? null;
    if (!end) return null;
    return end < startDate ? { start: end, end: startDate } : { start: startDate, end };
  };

  const proposeSelection = (date: string): CalendarDateSelectDetail => {
    if (selectionMode === 'single') return { date, startDate: date, endDate: null };
    if (!startDate || endDate) return { date, startDate: date, endDate: null };
    return date < startDate
      ? { date, startDate: date, endDate: startDate }
      : { date, startDate, endDate: date };
  };

  const showMonthOf = (iso: string): void => {
    const d = parseISODate(iso);
    if (!d) return;
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    setView((v) => {
      if (v.year === year && v.month === month) return v;
      onMonthChange?.({ year, month });
      return { year, month };
    });
  };

  const handleDayClick = (day: CalendarDay): void => {
    if (isDisabled(day.iso)) return;
    setFocusedISO(day.iso);
    if (!day.inMonth) showMonthOf(day.iso);
    onDateSelect?.(proposeSelection(day.iso));
  };

  const navigateMonth = (delta: number): void => {
    setView((v) => {
      const next = addMonths(v.year, v.month, delta);
      onMonthChange?.({ year: next.year, month: next.month });
      return { year: next.year, month: next.month };
    });
  };

  const handleGridKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>): void => {
    let target: string | null = null;
    switch (e.key) {
      case 'ArrowLeft':
        target = addDaysISO(focusedISO, -1);
        break;
      case 'ArrowRight':
        target = addDaysISO(focusedISO, 1);
        break;
      case 'ArrowUp':
        target = addDaysISO(focusedISO, -7);
        break;
      case 'ArrowDown':
        target = addDaysISO(focusedISO, 7);
        break;
      case 'Home':
      case 'End': {
        const d = parseISODate(focusedISO);
        if (!d) return;
        const isoDay = ((d.getDay() + 6) % 7) + 1;
        const offset = (isoDay - resolvedFirstDay + 7) % 7;
        target = addDaysISO(focusedISO, e.key === 'Home' ? -offset : 6 - offset);
        break;
      }
      case 'PageUp':
      case 'PageDown': {
        const d = parseISODate(focusedISO);
        if (!d) return;
        const next = addMonths(d.getFullYear(), d.getMonth() + 1, e.key === 'PageUp' ? -1 : 1);
        const dayNum = Math.min(d.getDate(), daysInMonth(next.year, next.month));
        const p = (n: number, l = 2) => String(n).padStart(l, '0');
        target = `${p(next.year, 4)}-${p(next.month)}-${p(dayNum)}`;
        break;
      }
      default:
        return;
    }
    e.preventDefault();
    if (!target || !parseISODate(target)) return;
    pendingFocus.current = true;
    setFocusedISO(target);
    showMonthOf(target);
  };

  const range = effectiveRange();
  const weeks = buildWeeks(view.year, view.month, resolvedFirstDay);
  const labels = weekdayLabels(resolvedLocale, resolvedFirstDay);

  const renderDay = (day: CalendarDay) => {
    const singleSelected = selectionMode === 'single' && day.iso === startDate;
    const isStart = !!range && day.iso === range.start;
    const isEnd = !!range && day.iso === range.end;
    const inRange = !!range && day.iso > range.start && day.iso < range.end;
    const loneStart = selectionMode === 'range' && !range && day.iso === startDate;
    const selected = singleSelected || isStart || isEnd || loneStart || inRange;
    const disabled = isDisabled(day.iso);
    const isToday = day.iso === todayIso;
    const showBand = !!range && range.start !== range.end;

    const dayClass = [
      'ui-calendar__day',
      singleSelected && 'ui-calendar__day--selected',
      (isStart || loneStart) && 'ui-calendar__day--range-start',
      isEnd && 'ui-calendar__day--range-end',
      inRange && 'ui-calendar__day--in-range',
      isToday && 'ui-calendar__day--today',
      !day.inMonth && !selected && 'ui-calendar__day--outside',
      disabled && 'ui-calendar__day--disabled',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div key={day.iso} role="gridcell" className="ui-calendar__day-cell" aria-selected={selected}>
        {showBand && isStart && <span className="ui-calendar__band ui-calendar__band--start" />}
        {showBand && isEnd && <span className="ui-calendar__band ui-calendar__band--end" />}
        {showBand && inRange && <span className="ui-calendar__band ui-calendar__band--full" />}
        <button
          type="button"
          data-iso={day.iso}
          className={dayClass}
          tabIndex={day.iso === focusedISO ? 0 : -1}
          aria-label={dayLabel(resolvedLocale, day.iso)}
          aria-current={isToday ? 'date' : undefined}
          aria-disabled={disabled ? 'true' : undefined}
          onClick={() => handleDayClick(day)}
          onFocus={() => setFocusedISO(day.iso)}
          onMouseEnter={
            selectionMode === 'range' && startDate && !endDate
              ? () => setHoverISO(day.iso)
              : undefined
          }
        >
          {day.day}
        </button>
      </div>
    );
  };

  return (
    <div className={['ui-calendar', className].filter(Boolean).join(' ')} style={style}>
      <div className="ui-calendar__header">
        <button
          type="button"
          className="ui-calendar__nav"
          aria-label={prevMonthLabel}
          onClick={() => navigateMonth(-1)}
        >
          <IconChevronLeft />
        </button>
        <span className="ui-calendar__month-label" id={monthLabelId}>
          {monthLabel(resolvedLocale, view.year, view.month)}
        </span>
        <button
          type="button"
          className="ui-calendar__nav"
          aria-label={nextMonthLabel}
          onClick={() => navigateMonth(1)}
        >
          <IconChevronRight />
        </button>
      </div>
      <div
        {...pickAriaProps(aria)}
        ref={rootRef}
        className="ui-calendar__grid"
        role="grid"
        aria-labelledby={monthLabelId}
        onKeyDown={handleGridKeyDown}
        onMouseLeave={() => setHoverISO(null)}
      >
        <div className="ui-calendar__week" role="row">
          {labels.map((l, i) => (
            <span key={i} className="ui-calendar__weekday" role="columnheader">
              {l}
            </span>
          ))}
        </div>
        {weeks.map((week) => (
          <div key={week[0].iso} className="ui-calendar__week" role="row">
            {week.map(renderDay)}
          </div>
        ))}
      </div>
    </div>
  );
}
