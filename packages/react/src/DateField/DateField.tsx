import { useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { IconCalendar } from '@mszczygiel-projects/ui-core-icons/react';
import { TextField } from '../TextField/TextField.js';
import type {
  TextFieldVariant,
  TextFieldSize,
  TextFieldState,
  TextFieldLabelPlacement,
} from '../TextField/TextField.js';
import { DatePicker } from '../DatePicker/DatePicker.js';
import type { DatePickerOpenChangeDetail } from '../DatePicker/DatePicker.js';
import type { PopoverPlacement } from '../Popover/Popover.js';
import type { CalendarSelectionMode } from '../Calendar/Calendar.js';
import {
  formatDateDisplay,
  formatRangeDisplay,
  parseDateText,
  parseRangeText,
} from './date-format.js';
import { resolveLocale } from '../Calendar/date-utils.js';
import './DateField.css';
import { getUiCoreConfig } from '@mszczygiel-projects/ui-core-foundations';

export interface DateFieldChangeDetail {
  startDate: string | null;
  endDate: string | null;
}

/**
 * Date input built on TextField (SearchField pattern): one combined text input
 * in both modes, a trailing calendar button opening `DatePicker`, and a
 * locale-aware `Intl` parser/formatter — no i18n library.
 *
 * - `single` mode holds one formatted date (medium style); picking a day
 *   auto-commits and closes.
 * - `range` mode holds a combined string ("Jan 5, 2026 – Jan 12, 2026");
 *   picking commits on Apply. The input always shows the committed value —
 *   the pending selection lives in the panel.
 *
 * Typed input is parsed on blur/Enter (ISO, locale numeric, or month-name
 * forms) and validated against `minDate`/`maxDate`/`disabledDates`; invalid
 * text renders the error state and calls `onInvalid` without committing.
 *
 * @example
 * <DateField mode="range" label="Date range" locale="pl-PL"
 *   onChange={({ startDate, endDate }) => setRange({ startDate, endDate })} />
 */
export interface DateFieldProps {
  /**
   * Selection mode; drives display format and the picker's commit model.
   * @default 'single'
   */
  mode?: CalendarSelectionMode;
  /** Controlled committed date (single) or range start, ISO `YYYY-MM-DD`. */
  startDate?: string | null;
  /** Controlled committed range end, ISO `YYYY-MM-DD`. */
  endDate?: string | null;
  /** Initial committed dates in uncontrolled mode. */
  defaultStartDate?: string;
  defaultEndDate?: string;
  /** Called with the committed `{ startDate, endDate }` after any commit. */
  onChange?: (detail: DateFieldChangeDetail) => void;
  /** Called with the raw text when typed input fails parsing/validation. */
  onInvalid?: (text: string) => void;
  /**
   * Container style.
   * @default 'outline'
   */
  variant?: TextFieldVariant;
  /**
   * Field height and typography scale.
   * @default 'default'
   */
  size?: TextFieldSize;
  /** Label text. */
  label?: string;
  /** Label position. */
  labelPlacement?: TextFieldLabelPlacement;
  /** Placeholder text shown while empty. */
  placeholder?: string;
  /** Helper text rendered below the field. */
  hint?: string;
  /**
   * Validation state; typed-input failures render `error` on top of `default`.
   * @default 'default'
   */
  state?: TextFieldState;
  /** Native form field name (submits the displayed text). */
  name?: string;
  /** Disables the input and the calendar button. */
  disabled?: boolean;
  /** Marks the field as required. */
  required?: boolean;
  /** Makes the input read-only (typing blocked; the picker still works). */
  readOnly?: boolean;
  /** Earliest selectable date, ISO `YYYY-MM-DD`. */
  minDate?: string;
  /** Latest selectable date, ISO `YYYY-MM-DD`. */
  maxDate?: string;
  /** Disabled dates: array of ISO strings or a predicate. */
  disabledDates?: string[] | ((iso: string) => boolean);
  /** First day of week, ISO 1-7; defaults to the locale's week info. */
  firstDayOfWeek?: number;
  /** BCP 47 locale tag for formatting and parsing; defaults to the runtime locale. */
  locale?: string;
  /** Override of "today" (ISO) — deterministic rendering for tests/SSR. */
  today?: string;
  /**
   * Preferred panel position.
   * @default 'bottom-start'
   */
  placement?: PopoverPlacement;
  /** Accessible name of the calendar toggle button. */
  calendarButtonLabel?: string;
  /** Label of the Apply button (range mode). */
  applyLabel?: string;
  /** Label of the Clear button (range mode). */
  clearLabel?: string;
  /** Accessible names of the month navigation buttons. */
  prevMonthLabel?: string;
  nextMonthLabel?: string;
  /** Extra class names appended to the root element. */
  className?: string;
  /** Inline styles forwarded to the root element (positioning only — never visual styles). */
  style?: CSSProperties;
}

export function DateField({
  mode = 'single',
  startDate,
  endDate,
  defaultStartDate,
  defaultEndDate,
  onChange,
  onInvalid,
  variant = 'outline',
  size = 'default',
  label,
  labelPlacement,
  placeholder,
  hint,
  state = 'default',
  name,
  disabled,
  required,
  readOnly,
  minDate,
  maxDate,
  disabledDates,
  firstDayOfWeek,
  locale,
  today,
  placement = 'bottom-start',
  calendarButtonLabel,
  applyLabel,
  clearLabel,
  prevMonthLabel,
  nextMonthLabel,
  className,
  style,
}: DateFieldProps) {
  const range = mode === 'range';
  const isControlled = startDate !== undefined || endDate !== undefined;
  const [internal, setInternal] = useState<DateFieldChangeDetail>({
    startDate: defaultStartDate ?? null,
    endDate: defaultEndDate ?? null,
  });
  const effectiveStart = isControlled ? (startDate ?? null) : internal.startDate;
  const effectiveEnd = isControlled ? (endDate ?? null) : internal.endDate;

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');
  const [invalid, setInvalid] = useState(false);

  const resolvedLocale = resolveLocale(locale);
  const isDisabled = disabled || state === 'disabled';

  const display = editing
    ? text
    : range
      ? formatRangeDisplay(resolvedLocale, effectiveStart, effectiveEnd)
      : effectiveStart
        ? formatDateDisplay(resolvedLocale, effectiveStart)
        : '';

  const isDateBlocked = (iso: string): boolean => {
    if (minDate && iso < minDate) return true;
    if (maxDate && iso > maxDate) return true;
    if (Array.isArray(disabledDates)) return disabledDates.includes(iso);
    if (typeof disabledDates === 'function') return disabledDates(iso);
    return false;
  };

  const commit = (start: string | null, end: string | null): void => {
    if (!isControlled) setInternal({ startDate: start, endDate: end });
    setEditing(false);
    setInvalid(false);
    onChange?.({ startDate: start, endDate: end });
  };

  const markInvalid = (): void => {
    setInvalid(true);
    onInvalid?.(text);
  };

  const commitFromText = (): void => {
    if (!editing) return;
    const t = text.trim();
    if (!t) {
      commit(null, null);
      return;
    }
    if (range) {
      const parsed = parseRangeText(resolvedLocale, t);
      if (
        !parsed ||
        !parsed.start ||
        isDateBlocked(parsed.start) ||
        (parsed.end && isDateBlocked(parsed.end))
      ) {
        markInvalid();
        return;
      }
      commit(parsed.start, parsed.end);
      return;
    }
    const date = parseDateText(resolvedLocale, t);
    if (!date || isDateBlocked(date)) {
      markInvalid();
      return;
    }
    commit(date, null);
  };

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLElement>): void => {
    if (e.key === 'Enter') commitFromText();
  };

  const calendarButton = (
    <button
      className="ui-date-field__calendar-toggle"
      type="button"
      aria-label={calendarButtonLabel ?? getUiCoreConfig().labels.dateField.openCalendar}
      aria-haspopup="dialog"
      aria-expanded={open}
      disabled={isDisabled}
      onClick={() => setOpen((o) => !o)}
    >
      <IconCalendar />
    </button>
  );

  const field = (
    <span className="ui-date-field__anchor" onBlur={commitFromText} onKeyDown={handleKeyDown}>
      <TextField
        variant={variant}
        size={size}
        label={label}
        labelPlacement={labelPlacement}
        placeholder={placeholder}
        hint={hint}
        state={invalid && state === 'default' ? 'error' : state}
        name={name}
        disabled={disabled}
        required={required}
        readOnly={readOnly}
        autoComplete="off"
        value={display}
        onChange={(v: string) => {
          setText(v);
          setEditing(true);
          setInvalid(false);
        }}
        trailingIcon={calendarButton}
      />
    </span>
  );

  return (
    <DatePicker
      selectionMode={mode}
      open={open}
      placement={placement}
      startDate={effectiveStart ?? undefined}
      endDate={effectiveEnd ?? undefined}
      minDate={minDate}
      maxDate={maxDate}
      disabledDates={disabledDates}
      firstDayOfWeek={firstDayOfWeek}
      locale={locale}
      today={today}
      applyLabel={applyLabel}
      clearLabel={clearLabel}
      prevMonthLabel={prevMonthLabel}
      nextMonthLabel={nextMonthLabel}
      anchor={field}
      onDateChange={(d) => {
        commit(d.date, null);
        setOpen(false);
      }}
      onRangeChange={(d) => {
        commit(d.startDate, d.endDate);
        setOpen(false);
      }}
      onOpenChange={(d: DatePickerOpenChangeDetail) => setOpen(d.open)}
      className={['ui-date-field', className].filter(Boolean).join(' ')}
      style={style}
    />
  );
}
