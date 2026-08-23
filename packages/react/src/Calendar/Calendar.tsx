import { useEffect, useId, useRef, useState } from 'react';
import type { AriaAttributes, CSSProperties, KeyboardEvent as ReactKeyboardEvent } from 'react';
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
} from '@mszczygiel-projects/ui-core-icons/react';
import { pickAriaProps } from '../aria.js';
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
import './Calendar.css';
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
 * Fully controlled: clicking a day only calls `onDateSelect` with the proposed
 * `{startDate, endDate}` — the consumer owns selection state and passes it back
 * as props. The component itself tracks only the displayed month, the zoom level
 * and the roving keyboard focus. Locale handling uses the native `Intl` API
 * (`weekInfo` for first day of week) — no i18n library.
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
  /** Accessible name of the previous-month button (day grid). */
  prevMonthLabel?: string;
  /** Accessible name of the next-month button (day grid). */
  nextMonthLabel?: string;
  /** Accessible name of the previous-year button (month grid). */
  prevYearLabel?: string;
  /** Accessible name of the next-year button (month grid). */
  nextYearLabel?: string;
  /** Accessible name of the previous year-page button (year grid). */
  prevYearsLabel?: string;
  /** Accessible name of the next year-page button (year grid). */
  nextYearsLabel?: string;
  /**
   * Accessible name of the heading button that opens the month grid; receives
   * the visible heading text.
   * @default `getUiCoreConfig().labels.calendar.chooseMonth`
   */
  chooseMonthLabel?: (monthAndYear: string) => string;
  /**
   * Accessible name of the heading button that opens the year grid; receives
   * the visible year.
   * @default `getUiCoreConfig().labels.calendar.chooseYear`
   */
  chooseYearLabel?: (year: string) => string;
  /** Called with the proposed selection after a day is clicked. */
  onDateSelect?: (detail: CalendarDateSelectDetail) => void;
  /** Called after view-month navigation. */
  onMonthChange?: (detail: CalendarMonthChangeDetail) => void;
  /** Extra class names appended to the root element. */
  className?: string;
  /** Inline styles forwarded to the root element (positioning only — never visual styles). */
  style?: CSSProperties;
}

interface PickerCellState {
  key: string;
  text: string;
  ariaLabel: string;
  focused: boolean;
  selected: boolean;
  current: boolean;
  disabled: boolean;
  onSelect: () => void;
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
  prevMonthLabel,
  nextMonthLabel,
  prevYearLabel,
  nextYearLabel,
  prevYearsLabel,
  nextYearsLabel,
  chooseMonthLabel,
  chooseYearLabel,
  onDateSelect,
  onMonthChange,
  className,
  style,
  ...aria
}: CalendarProps) {
  const resolvedLocale = resolveLocale(locale);
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
  const [viewMode, setViewMode] = useState<CalendarViewMode>('days');
  const [yearPage, setYearPage] = useState(() => yearPageStart(initial.getFullYear()));
  const [focusedISO, setFocusedISO] = useState(toISODate(initial));
  const [focusedMonth, setFocusedMonth] = useState(initial.getMonth() + 1);
  const [focusedYear, setFocusedYear] = useState(initial.getFullYear());
  const [hoverISO, setHoverISO] = useState<string | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef(false);
  const pendingPickerFocus = useRef(false);
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
  }, [focusedISO, view, viewMode]);

  // Same, for the roving focus inside the month/year grids.
  useEffect(() => {
    if (!pendingPickerFocus.current) return;
    pendingPickerFocus.current = false;
    rootRef.current
      ?.querySelector<HTMLButtonElement>('.ui-calendar__picker-item[tabindex="0"]')
      ?.focus();
  }, [viewMode, focusedMonth, focusedYear, yearPage]);

  const isDisabled = (iso: string): boolean => {
    if (minDate && iso < minDate) return true;
    if (maxDate && iso > maxDate) return true;
    if (Array.isArray(disabledDates)) return disabledDates.includes(iso);
    if (typeof disabledDates === 'function') return disabledDates(iso);
    return false;
  };

  /**
   * A month is out of reach only when *every* one of its days is — `minDate`
   * and `maxDate` alone; a `disabledDates` predicate is left to the day grid.
   */
  const isMonthDisabled = (year: number, month: number): boolean => {
    const key = monthKey(year, month);
    if (minDate && key < minDate.slice(0, 7)) return true;
    if (maxDate && key > maxDate.slice(0, 7)) return true;
    return false;
  };

  const isYearDisabled = (year: number): boolean => {
    if (minDate && year < Number(minDate.slice(0, 4))) return true;
    if (maxDate && year > Number(maxDate.slice(0, 4))) return true;
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

  /** The single place the displayed month moves — every path reports it once. */
  const showYearMonth = (year: number, month: number): void => {
    setView((v) => {
      if (v.year === year && v.month === month) return v;
      onMonthChange?.({ year, month });
      return { year, month };
    });
  };

  const showMonthOf = (iso: string): void => {
    const d = parseISODate(iso);
    if (!d) return;
    showYearMonth(d.getFullYear(), d.getMonth() + 1);
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

  /* ---- Zoom levels ---- */

  const openMonthGrid = (): void => {
    setViewMode('months');
    setFocusedMonth(view.month);
    pendingPickerFocus.current = true;
  };

  const openYearGrid = (): void => {
    setViewMode('years');
    setYearPage(yearPageStart(view.year));
    setFocusedYear(view.year);
    pendingPickerFocus.current = true;
  };

  /** Back to the day grid, with the roving focus kept inside the shown month. */
  const showDayGrid = (year: number, month: number): void => {
    setViewMode('days');
    setFocusedISO((iso) => withYearMonth(iso || todayIso, year, month));
    pendingFocus.current = true;
  };

  const selectMonth = (month: number): void => {
    if (isMonthDisabled(view.year, month)) return;
    showYearMonth(view.year, month);
    showDayGrid(view.year, month);
  };

  const selectYear = (year: number): void => {
    if (isYearDisabled(year)) return;
    showYearMonth(year, view.month);
    setViewMode('months');
    setFocusedMonth(view.month);
    pendingPickerFocus.current = true;
  };

  /**
   * Escape steps one level back down. Inside `DatePicker` the popover has
   * already seen the same key on its document capture listener and closes — the
   * collapse then just makes sure the panel reopens on the day grid.
   */
  const handleRootKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>): void => {
    if (e.key !== 'Escape' || viewMode === 'days') return;
    e.preventDefault();
    if (viewMode === 'years') {
      setViewMode('months');
      setFocusedMonth(view.month);
      pendingPickerFocus.current = true;
      return;
    }
    showDayGrid(view.year, view.month);
  };

  /**
   * The month/year grids are a transient zoom, not a mode: once focus leaves the
   * calendar for good (Tab away, or the picker popover closing), collapse back
   * to the day grid. Deferred by a task because a level switch replaces the
   * focused button before the new one is focused.
   */
  const handleRootBlur = (): void => {
    if (viewMode === 'days') return;
    setTimeout(() => {
      const root = rootRef.current;
      if (!root || root.contains(document.activeElement)) return;
      setViewMode('days');
    });
  };

  /* ---- Keyboard ---- */

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

  /** Roving focus inside the month grid; months never spill into another year. */
  const handleMonthGridKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>): void => {
    let target = focusedMonth;
    switch (e.key) {
      case 'ArrowLeft':
        target = focusedMonth - 1;
        break;
      case 'ArrowRight':
        target = focusedMonth + 1;
        break;
      case 'ArrowUp':
        target = focusedMonth - MONTH_COLUMNS;
        break;
      case 'ArrowDown':
        target = focusedMonth + MONTH_COLUMNS;
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
        showYearMonth(view.year + (e.key === 'PageUp' ? -1 : 1), view.month);
        pendingPickerFocus.current = true;
        return;
      default:
        return;
    }
    e.preventDefault();
    if (target < 1 || target > 12) return;
    setFocusedMonth(target);
    pendingPickerFocus.current = true;
  };

  /** Roving focus inside the year grid; crossing an edge turns the page. */
  const handleYearGridKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>): void => {
    let target = focusedYear;
    switch (e.key) {
      case 'ArrowLeft':
        target = focusedYear - 1;
        break;
      case 'ArrowRight':
        target = focusedYear + 1;
        break;
      case 'ArrowUp':
        target = focusedYear - YEAR_COLUMNS;
        break;
      case 'ArrowDown':
        target = focusedYear + YEAR_COLUMNS;
        break;
      case 'Home':
        target = yearPage;
        break;
      case 'End':
        target = yearPage + YEARS_PER_PAGE - 1;
        break;
      case 'PageUp':
        target = focusedYear - YEARS_PER_PAGE;
        break;
      case 'PageDown':
        target = focusedYear + YEARS_PER_PAGE;
        break;
      default:
        return;
    }
    e.preventDefault();
    setFocusedYear(target);
    if (target < yearPage || target >= yearPage + YEARS_PER_PAGE)
      setYearPage(yearPageStart(target));
    pendingPickerFocus.current = true;
  };

  /* ---- Rendering ---- */

  const range = effectiveRange();
  const todayDate = parseISODate(todayIso);
  const labels = getUiCoreConfig().labels.calendar;

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

  const renderDayGrid = () => {
    const weeks = buildWeeks(view.year, view.month, resolvedFirstDay);
    const weekdays = weekdayLabels(resolvedLocale, resolvedFirstDay);
    return (
      <div
        {...pickAriaProps(aria)}
        className="ui-calendar__grid"
        role="grid"
        aria-labelledby={monthLabelId}
        onKeyDown={handleGridKeyDown}
        onMouseLeave={() => setHoverISO(null)}
      >
        <div className="ui-calendar__week" role="row">
          {weekdays.map((l, i) => (
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
    );
  };

  const renderPickerCell = (cell: PickerCellState) => {
    const itemClass = [
      'ui-calendar__picker-item',
      cell.selected && 'ui-calendar__picker-item--selected',
      cell.current && !cell.selected && 'ui-calendar__picker-item--current',
      cell.disabled && 'ui-calendar__picker-item--disabled',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div
        key={cell.key}
        role="gridcell"
        className="ui-calendar__picker-cell"
        aria-selected={cell.selected}
      >
        <button
          type="button"
          className={itemClass}
          tabIndex={cell.focused ? 0 : -1}
          aria-label={cell.ariaLabel}
          aria-current={cell.current ? 'date' : undefined}
          aria-disabled={cell.disabled ? 'true' : undefined}
          onClick={cell.onSelect}
        >
          {cell.text}
        </button>
      </div>
    );
  };

  const renderPickerGrid = (
    cells: PickerCellState[],
    columns: number,
    onKeyDown: typeof handleMonthGridKeyDown,
  ) => {
    const rows = Array.from({ length: cells.length / columns }, (_, r) => r * columns);
    return (
      <div
        {...pickAriaProps(aria)}
        className="ui-calendar__picker"
        role="grid"
        aria-labelledby={monthLabelId}
        onKeyDown={onKeyDown}
      >
        {rows.map((offset) => (
          <div key={offset} className="ui-calendar__picker-row" role="row">
            {cells.slice(offset, offset + columns).map(renderPickerCell)}
          </div>
        ))}
      </div>
    );
  };

  const renderMonthGrid = () => {
    const names = monthShortLabels(resolvedLocale);
    const selectedMonths = new Set(
      [startDate, endDate].filter(Boolean).map((iso) => (iso as string).slice(0, 7)),
    );
    const cells = names.map((name, i) => {
      const month = i + 1;
      return {
        key: name + month,
        text: name,
        ariaLabel: monthLabel(resolvedLocale, view.year, month),
        focused: month === focusedMonth,
        selected: selectedMonths.has(monthKey(view.year, month)),
        current:
          !!todayDate &&
          todayDate.getFullYear() === view.year &&
          todayDate.getMonth() + 1 === month,
        disabled: isMonthDisabled(view.year, month),
        onSelect: () => selectMonth(month),
      };
    });
    return renderPickerGrid(cells, MONTH_COLUMNS, handleMonthGridKeyDown);
  };

  const renderYearGrid = () => {
    const selectedYears = new Set(
      [startDate, endDate].filter(Boolean).map((iso) => (iso as string).slice(0, 4)),
    );
    const cells = Array.from({ length: YEARS_PER_PAGE }, (_, i) => {
      const year = yearPage + i;
      const text = yearLabel(resolvedLocale, year);
      return {
        key: String(year),
        text,
        ariaLabel: text,
        focused: year === focusedYear,
        selected: selectedYears.has(String(year).padStart(4, '0')),
        current: !!todayDate && todayDate.getFullYear() === year,
        disabled: isYearDisabled(year),
        onSelect: () => selectYear(year),
      };
    });
    return renderPickerGrid(cells, YEAR_COLUMNS, handleYearGridKeyDown);
  };

  const heading =
    viewMode === 'days'
      ? monthLabel(resolvedLocale, view.year, view.month)
      : viewMode === 'months'
        ? yearLabel(resolvedLocale, view.year)
        : yearRangeLabel(resolvedLocale, yearPage, yearPage + YEARS_PER_PAGE - 1);

  // Each level keeps the same two chevrons and only changes their stride:
  // a month, a year, then a whole year page.
  const prevLabel =
    viewMode === 'days'
      ? (prevMonthLabel ?? labels.previousMonth)
      : viewMode === 'months'
        ? (prevYearLabel ?? labels.previousYear)
        : (prevYearsLabel ?? labels.previousYears);
  const nextLabel =
    viewMode === 'days'
      ? (nextMonthLabel ?? labels.nextMonth)
      : viewMode === 'months'
        ? (nextYearLabel ?? labels.nextYear)
        : (nextYearsLabel ?? labels.nextYears);

  const navigate = (direction: -1 | 1): void => {
    if (viewMode === 'days') navigateMonth(direction);
    else if (viewMode === 'months') showYearMonth(view.year + direction, view.month);
    else setYearPage((page) => page + direction * YEARS_PER_PAGE);
  };

  const zoomLabel =
    viewMode === 'days'
      ? (chooseMonthLabel ?? labels.chooseMonth)(heading)
      : (chooseYearLabel ?? labels.chooseYear)(heading);

  return (
    <div
      ref={rootRef}
      className={['ui-calendar', className].filter(Boolean).join(' ')}
      style={style}
      onKeyDown={handleRootKeyDown}
      onBlur={handleRootBlur}
    >
      <div className="ui-calendar__header">
        <button
          type="button"
          className="ui-calendar__nav"
          aria-label={prevLabel}
          onClick={() => navigate(-1)}
        >
          <IconChevronLeft />
        </button>
        {viewMode === 'years' ? (
          // The year grid is the top level — nothing left to zoom out to.
          <span className="ui-calendar__month-label" id={monthLabelId}>
            {heading}
          </span>
        ) : (
          <button
            type="button"
            className="ui-calendar__zoom"
            aria-label={zoomLabel}
            onClick={viewMode === 'days' ? openMonthGrid : openYearGrid}
          >
            <span className="ui-calendar__month-label" id={monthLabelId}>
              {heading}
            </span>
            <span className="ui-calendar__zoom-icon">
              <IconChevronDown />
            </span>
          </button>
        )}
        <button
          type="button"
          className="ui-calendar__nav"
          aria-label={nextLabel}
          onClick={() => navigate(1)}
        >
          <IconChevronRight />
        </button>
      </div>
      {viewMode === 'days'
        ? renderDayGrid()
        : viewMode === 'months'
          ? renderMonthGrid()
          : renderYearGrid()}
    </div>
  );
}
