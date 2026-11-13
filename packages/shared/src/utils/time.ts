import { parseIsoDate } from './date.ts';

/** Whether a value is a 24-hour time with minute precision. */
export function isIsoTime(value: string): boolean {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (match === null) {
    return false;
  }
  return Number(match[1]) < 24 && Number(match[2]) < 60;
}

/** Whether a value is a local Gregorian date and time with minute precision. */
export function isIsoLocalDateTime(value: string): boolean {
  return (
    value.length === 16 &&
    value[10] === 'T' &&
    parseIsoDate(value.slice(0, 10)) !== null &&
    isIsoTime(value.slice(11))
  );
}

/** The independently editable parts of a local date and time. */
export interface LocalDateTimeParts {
  /** A Gregorian ISO date, or an empty string. */
  readonly date: string;
  /** A 24-hour time with minute precision, or an empty string. */
  readonly time: string;
}

/** Splits a complete value; malformed or empty input has two empty parts. */
export function splitLocalDateTime(value: string): LocalDateTimeParts {
  return isIsoLocalDateTime(value)
    ? { date: value.slice(0, 10), time: value.slice(11) }
    : { date: '', time: '' };
}

/** Joins complete parts without assigning a time zone; incomplete parts have no value. */
export function joinLocalDateTime(parts: LocalDateTimeParts): string {
  const value = `${parts.date}T${parts.time}`;
  return isIsoLocalDateTime(value) ? value : '';
}

/** Bounds of a time or local date and time, in the same canonical form as the value. */
export interface TimeConstraints {
  /** Earliest permitted value, inclusive. */
  readonly min?: string;
  /** Latest permitted value, inclusive. */
  readonly max?: string;
}

/** The bounds of a time control for one date within date-time bounds. */
export function timeBoundsForDate(date: string, bounds: TimeConstraints): TimeConstraints {
  const min = bounds.min;
  const max = bounds.max;
  return {
    ...(min !== undefined && isIsoLocalDateTime(min) && min.slice(0, 10) === date
      ? { min: min.slice(11) }
      : {}),
    ...(max !== undefined && isIsoLocalDateTime(max) && max.slice(0, 10) === date
      ? { max: max.slice(11) }
      : {}),
  };
}

/** Why a complete time or local date and time cannot be submitted. */
export type TimeValidationError = 'invalid' | 'min' | 'max' | 'constraints';

/** Validates a canonical value without reading a clock or interpreting a time zone. */
export function validateTimeValue(
  value: string,
  constraints: TimeConstraints,
  isValue: (candidate: string) => boolean,
): TimeValidationError | null {
  if (value === '') {
    return null;
  }
  if (!isValue(value)) {
    return 'invalid';
  }
  const min =
    constraints.min !== undefined && isValue(constraints.min) ? constraints.min : undefined;
  const max =
    constraints.max !== undefined && isValue(constraints.max) ? constraints.max : undefined;
  if (min !== undefined && max !== undefined && min > max) {
    return 'constraints';
  }
  if (min !== undefined && value < min) {
    return 'min';
  }
  if (max !== undefined && value > max) {
    return 'max';
  }
  return null;
}
