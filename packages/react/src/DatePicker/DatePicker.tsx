import { useEffect, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Popover } from '../Popover/Popover.js';
import type { PopoverOpenChangeDetail, PopoverPlacement } from '../Popover/Popover.js';
import { Calendar } from '../Calendar/Calendar.js';
import type { CalendarDateSelectDetail, CalendarSelectionMode } from '../Calendar/Calendar.js';
import { Button } from '../Button/Button.js';
import './DatePicker.css';

export interface DatePickerDateChangeDetail {
  /** Committed date, ISO `YYYY-MM-DD`. */
  date: string;
}

export interface DatePickerRangeChangeDetail {
  /** Committed range, ISO `YYYY-MM-DD`; both null after Clear + Apply. */
  startDate: string | null;
  endDate: string | null;
}

export type DatePickerOpenChangeReason =
  | PopoverOpenChangeDetail['reason']
  | 'select'
  | 'apply';

export interface DatePickerOpenChangeDetail {
  open: boolean;
  reason: DatePickerOpenChangeReason;
}

/**
 * Date picker: composes `Popover` (`trigger="manual"`, focus trap) with
 * `Calendar` and — in range mode — a Clear/Apply footer.
 *
 * Commit model is mode-dependent: `single` auto-commits on day click
 * (`onDateChange` + close request), `range` collects a pending selection and
 * commits only on Apply (`onRangeChange` + close request). Clear resets the
 * pending selection without committing.
 *
 * Fully controlled: `open` and the committed dates are owned by the consumer;
 * the component calls `onOpenChange` (own close requests plus forwarded
 * popover dismissals) and never mutates its own props.
 *
 * @example
 * <DatePicker
 *   selectionMode="range"
 *   open={open}
 *   startDate={range.start ?? undefined}
 *   endDate={range.end ?? undefined}
 *   anchor={<Button onClick={() => setOpen(true)}>Pick dates</Button>}
 *   onRangeChange={(d) => setRange({ start: d.startDate, end: d.endDate })}
 *   onOpenChange={(d) => setOpen(d.open)}
 * />
 */
export interface DatePickerProps {
  /**
   * Selection behavior — also switches the commit model (single: auto-commit
   * on click, range: Apply/Clear footer).
   * @default 'single'
   */
  selectionMode?: CalendarSelectionMode;
  /**
   * Controlled open state of the popover.
   * @default false
   */
  open?: boolean;
  /**
   * Preferred panel position relative to the anchor.
   * @default 'bottom-start'
   */
  placement?: PopoverPlacement;
  /** Committed date (single) or range start, ISO `YYYY-MM-DD`. */
  startDate?: string;
  /** Committed range end, ISO `YYYY-MM-DD` (range mode only). */
  endDate?: string;
  /** Earliest selectable date, ISO `YYYY-MM-DD`. */
  minDate?: string;
  /** Latest selectable date, ISO `YYYY-MM-DD`. */
  maxDate?: string;
  /** Disabled dates: array of ISO strings or a predicate. */
  disabledDates?: string[] | ((iso: string) => boolean);
  /** First day of week, ISO 1-7; defaults to the locale's week info. */
  firstDayOfWeek?: number;
  /** BCP 47 locale tag; defaults to the runtime locale. */
  locale?: string;
  /** Override of "today" (ISO) — deterministic rendering for tests/SSR. */
  today?: string;
  /**
   * Label of the Apply button (range mode).
   * @default 'Apply'
   */
  applyLabel?: string;
  /**
   * Label of the Clear button (range mode).
   * @default 'Clear'
   */
  clearLabel?: string;
  /** Accessible name of the previous-month button. */
  prevMonthLabel?: string;
  /** Accessible name of the next-month button. */
  nextMonthLabel?: string;
  /** Anchor element (DateField's input in the final composition). */
  anchor?: ReactNode;
  /** Called with the committed date (single mode, on day click). */
  onDateChange?: (detail: DatePickerDateChangeDetail) => void;
  /** Called with the committed range (range mode, on Apply). */
  onRangeChange?: (detail: DatePickerRangeChangeDetail) => void;
  /** Called with close requests and forwarded popover dismissals. */
  onOpenChange?: (detail: DatePickerOpenChangeDetail) => void;
  /** Extra class names appended to the root element. */
  className?: string;
  /** Inline styles forwarded to the root element (positioning only — never visual styles). */
  style?: CSSProperties;
}

export function DatePicker({
  selectionMode = 'single',
  open = false,
  placement = 'bottom-start',
  startDate,
  endDate,
  minDate,
  maxDate,
  disabledDates,
  firstDayOfWeek,
  locale,
  today,
  applyLabel = 'Apply',
  clearLabel = 'Clear',
  prevMonthLabel,
  nextMonthLabel,
  anchor,
  onDateChange,
  onRangeChange,
  onOpenChange,
  className,
  style,
}: DatePickerProps) {
  const range = selectionMode === 'range';
  const [pending, setPending] = useState<{ start: string | null; end: string | null }>({
    start: startDate ?? null,
    end: endDate ?? null,
  });

  // (Re)opening seeds the pending range from the committed values.
  useEffect(() => {
    if (open && range) setPending({ start: startDate ?? null, end: endDate ?? null });
  }, [open, range, startDate, endDate]);

  const handleDateSelect = (detail: CalendarDateSelectDetail): void => {
    if (!range) {
      onDateChange?.({ date: detail.date });
      onOpenChange?.({ open: false, reason: 'select' });
      return;
    }
    setPending({ start: detail.startDate, end: detail.endDate });
  };

  const handleApply = (): void => {
    onRangeChange?.({ startDate: pending.start, endDate: pending.end });
    onOpenChange?.({ open: false, reason: 'apply' });
  };

  const handleClear = (): void => setPending({ start: null, end: null });

  return (
    <Popover
      open={open}
      trigger="manual"
      trapFocus
      placement={placement}
      anchor={anchor}
      onOpenChange={(d) => onOpenChange?.(d)}
      className={['ui-date-picker', className].filter(Boolean).join(' ')}
      style={style}
    >
      <div className="ui-date-picker__content">
        <Calendar
          selectionMode={selectionMode}
          startDate={(range ? pending.start : startDate) ?? undefined}
          endDate={(range ? pending.end : endDate) ?? undefined}
          minDate={minDate}
          maxDate={maxDate}
          disabledDates={disabledDates}
          firstDayOfWeek={firstDayOfWeek}
          locale={locale}
          today={today}
          prevMonthLabel={prevMonthLabel}
          nextMonthLabel={nextMonthLabel}
          onDateSelect={handleDateSelect}
        />
        {range && (
          <div className="ui-date-picker__footer">
            <Button variant="ghost" size="small" onClick={handleClear}>
              {clearLabel}
            </Button>
            <Button variant="primary" size="small" onClick={handleApply}>
              {applyLabel}
            </Button>
          </div>
        )}
      </div>
    </Popover>
  );
}
