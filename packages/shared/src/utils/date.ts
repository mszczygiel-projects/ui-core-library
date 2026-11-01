import { asciiDigits, localeDigits, type ParsedInput, withoutBidiMarks } from './parsed-input.ts';

/**
 * Calendar dates as ISO 8601 strings, `YYYY-MM-DD`, for the years 0001 to 9999, which ISO 8601
 * writes with four digits. Dates are counted in whole days on the proleptic Gregorian calendar,
 * without `Date` objects, so no time zone changes a result.
 */

/** The parts of a calendar date; `month` and `day` count from 1. */
export interface DateParts {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MIN_YEAR = 1;
const MAX_YEAR = 9999;

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * The number of days in a month, `month` counting from 1. February has 29 in a leap year,
 * including the year 0 of the proleptic Gregorian calendar.
 */
export function daysInMonth(year: number, month: number): number {
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError(`${String(year)}-${String(month)} is not a month`);
  }
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function isDate({ year, month, day }: DateParts): boolean {
  return (
    Number.isInteger(year) &&
    year >= MIN_YEAR &&
    year <= MAX_YEAR &&
    Number.isInteger(month) &&
    month >= 1 &&
    month <= 12 &&
    Number.isInteger(day) &&
    day >= 1 &&
    day <= daysInMonth(year, month)
  );
}

/** The parts of an ISO date such as `2026-10-16`, or null for anything else, 2026-02-30 included. */
export function parseIsoDate(text: string): DateParts | null {
  const match = ISO_DATE.exec(text);
  if (match === null) {
    return null;
  }
  const [, year = '', month = '', day = ''] = match;
  const parts = { year: Number(year), month: Number(month), day: Number(day) };
  return isDate(parts) ? parts : null;
}

/** The ISO form of a date. Parts that are no date of the years 0001 to 9999 throw a RangeError. */
export function formatIsoDate(parts: DateParts): string {
  if (!isDate(parts)) {
    throw new RangeError(`${JSON.stringify(parts)} is not a date of the years 0001 to 9999`);
  }
  const pad = (value: number, length: number): string => String(value).padStart(length, '0');
  return `${pad(parts.year, 4)}-${pad(parts.month, 2)}-${pad(parts.day, 2)}`;
}

function partsOf(date: string): DateParts {
  const parts = parseIsoDate(date);
  if (parts === null) {
    throw new RangeError(`${date} is not an ISO date of the years 0001 to 9999`);
  }
  return parts;
}

function wholeNumber(value: number, unit: string): number {
  if (!Number.isInteger(value)) {
    throw new RangeError(`${String(value)} is not a whole number of ${unit}`);
  }
  return value;
}

// Days since 1970-01-01 and back, after Howard Hinnant's days_from_civil and civil_from_days:
// the year is counted from March, so a leap day falls at its end, in eras of 400 years.

function toDayNumber({ year, month, day }: DateParts): number {
  const marchYear = month <= 2 ? year - 1 : year;
  const era = Math.floor(marchYear / 400);
  const yearOfEra = marchYear - era * 400;
  const dayOfYear = Math.floor((153 * ((month + 9) % 12) + 2) / 5) + day - 1;
  const dayOfEra =
    yearOfEra * 365 + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100) + dayOfYear;
  return era * 146097 + dayOfEra - 719468;
}

function fromDayNumber(dayNumber: number): DateParts {
  const days = dayNumber + 719468;
  const era = Math.floor(days / 146097);
  const dayOfEra = days - era * 146097;
  const yearOfEra = Math.floor(
    (dayOfEra -
      Math.floor(dayOfEra / 1460) +
      Math.floor(dayOfEra / 36524) -
      Math.floor(dayOfEra / 146096)) /
      365,
  );
  const dayOfYear =
    dayOfEra - (365 * yearOfEra + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100));
  const marchMonth = Math.floor((5 * dayOfYear + 2) / 153);
  const month = marchMonth < 10 ? marchMonth + 3 : marchMonth - 9;
  return {
    year: yearOfEra + era * 400 + (month <= 2 ? 1 : 0),
    month,
    day: dayOfYear - Math.floor((153 * marchMonth + 2) / 5) + 1,
  };
}

/** The date `days` days after `date`, or before it when `days` is negative. */
export function addDays(date: string, days: number): string {
  return formatIsoDate(fromDayNumber(toDayNumber(partsOf(date)) + wholeNumber(days, 'days')));
}

/**
 * The date `months` months after `date`, or before it when `months` is negative. The day stays
 * unless the new month is shorter: 31 January plus one month is the last day of February.
 */
export function addMonths(date: string, months: number): string {
  const { year, month, day } = partsOf(date);
  const index = year * 12 + month - 1 + wholeNumber(months, 'months');
  const newYear = Math.floor(index / 12);
  const newMonth = index - newYear * 12 + 1;
  return formatIsoDate({
    year: newYear,
    month: newMonth,
    day: Math.min(day, daysInMonth(newYear, newMonth)),
  });
}

/** The ISO weekday of a date: 1 for Monday to 7 for Sunday. */
export function isoWeekday(date: string): number {
  // 1970-01-01, day number 0, was a Thursday.
  return ((((toDayNumber(partsOf(date)) + 3) % 7) + 7) % 7) + 1;
}

const formatters = new Map<string, Intl.DateTimeFormat>();

/**
 * The calendar date of an instant in a time zone, such as today's date where the user is. The
 * caller passes both, so a server render and the browser come to the same date. An unknown time
 * zone, an invalid instant and an instant whose date there falls outside the years 0001 to 9999
 * throw a RangeError.
 */
export function isoDateAt(instant: Date, timeZone: string): string {
  let formatter = formatters.get(timeZone);
  if (formatter === undefined) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      calendar: 'gregory',
      numberingSystem: 'latn',
      era: 'short',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
    formatters.set(timeZone, formatter);
  }
  const parts = formatter.formatToParts(instant);
  const part = (type: Intl.DateTimeFormatPartTypes): string | undefined =>
    parts.find((candidate) => candidate.type === type)?.value;
  // The year is a year of its era, so the year before 0001 reads as 1 BC.
  if (part('era') !== 'AD') {
    throw new RangeError(`${instant.toISOString()} falls before the year 0001 in ${timeZone}`);
  }
  return formatIsoDate({
    year: Number(part('year')),
    month: Number(part('month')),
    day: Number(part('day')),
  });
}

/** The constraints of a single calendar date. */
export interface DateConstraints {
  /** Earliest allowed ISO date. */
  readonly min?: string;
  /** Latest allowed ISO date. */
  readonly max?: string;
  /** ISO dates that may not be submitted, or a predicate for them. */
  readonly disabledDates?: readonly string[] | ((iso: string) => boolean);
}

/** Why the date field cannot be submitted. */
export type DateValidationError =
  'incomplete' | 'invalid' | 'min' | 'max' | 'disabled' | 'constraints';

/** The arguments of a translatable date validation message. */
export interface DateValidationContext {
  /** The failed constraint. */
  readonly reason: DateValidationError;
  /** The locale of the editable date. */
  readonly locale: string;
  /** Earliest allowed ISO date, when supplied. */
  readonly min?: string;
  /** Latest allowed ISO date, when supplied. */
  readonly max?: string;
}

/** A numeric part or literal separator in the locale's Gregorian date format. */
export interface DateFormatPart {
  /** The calendar part, or a literal separator. */
  readonly type: 'year' | 'month' | 'day' | 'literal';
  /** The separator, or digit placeholders of the required width. */
  readonly value: string;
}

/** The locale's numeric Gregorian date shape; no calendar arithmetic uses an instant. */
export function dateFormatParts(locale: string): readonly DateFormatPart[] {
  // A fixed UTC probe discovers Intl's ordering and punctuation, never the user's current date.
  return new Intl.DateTimeFormat(locale, {
    calendar: 'gregory',
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .formatToParts(946684800000)
    .flatMap((part): DateFormatPart[] => {
      if (part.type === 'year' || part.type === 'month' || part.type === 'day') {
        return [{ type: part.type, value: part.type === 'year' ? '0000' : '00' }];
      }
      return part.type === 'literal'
        ? [{ type: 'literal', value: withoutBidiMarks(part.value) }]
        : [];
    });
}

/** An IMask-compatible digit pattern, without a dependency on IMask or browser types. */
export function dateMaskPattern(locale: string): string {
  return dateFormatParts(locale)
    .map((part) =>
      part.type === 'literal'
        ? part.value.replace(/./gu, (character) => `\`${character}`)
        : part.value,
    )
    .join('');
}

/** The IMask options of a date input, as plain data, so both implementations mask alike. */
export interface DateMaskOptions {
  readonly mask: string;
  readonly lazy: true;
  readonly overwrite: false;
  readonly autofix: false;
  readonly definitions: { readonly '0': RegExp };
  readonly prepare: (value: string) => string;
}

/** Digits of the locale or ASCII, with ISO pastes reordered into the locale's format. */
export function dateMaskOptions(locale: string): DateMaskOptions {
  return {
    mask: dateMaskPattern(locale),
    lazy: true,
    overwrite: false,
    autofix: false,
    definitions: { '0': new RegExp(`[0-9${localeDigits(locale).join('')}]`) },
    prepare: (value) => prepareDateText(value, locale),
  };
}

/** Formats a calendar date by parts, with no time-zone conversion or missing-year inference. */
export function formatDateText(iso: string, locale: string): string {
  const date = parseIsoDate(iso);
  if (date === null) {
    return '';
  }
  const digits = localeDigits(locale);
  return dateFormatParts(locale)
    .map((part) =>
      part.type === 'literal'
        ? part.value
        : String(date[part.type])
            .padStart(part.value.length, '0')
            .replace(/\d/g, (digit) => digits[Number(digit)] ?? digit),
    )
    .join('');
}

/** Reorders a complete ISO paste without correcting impossible calendar parts. */
export function prepareDateText(text: string, locale: string): string {
  const normalized = asciiDigits(text, locale).trim();
  if (!ISO_DATE.test(normalized)) {
    return text;
  }
  const parts = {
    year: normalized.slice(0, 4),
    month: normalized.slice(5, 7),
    day: normalized.slice(8, 10),
  };
  const digits = localeDigits(locale);
  return dateFormatParts(locale)
    .map((part) =>
      part.type === 'literal'
        ? part.value
        : parts[part.type].replace(/\d/g, (digit) => digits[Number(digit)] ?? digit),
    )
    .join('');
}

/** Parses ISO or the complete numeric locale format; partial input never becomes a date. */
export function parseDateText(text: string, locale: string): ParsedInput<string> {
  const normalized = asciiDigits(text, locale).trim();
  if (normalized === '') {
    return { value: '', inputState: 'empty' };
  }
  if (ISO_DATE.test(normalized)) {
    return parseIsoDate(normalized) === null
      ? { value: '', inputState: 'invalid' }
      : { value: normalized, inputState: 'valid' };
  }
  const parts = dateFormatParts(locale);
  const compact = /^\d{8}$/.test(normalized);
  let offset = 0;
  const values = { year: 0, month: 0, day: 0 };
  for (const [index, part] of parts.entries()) {
    if (part.type === 'literal' && compact) {
      continue;
    }
    // A lazy mask never types a trailing literal such as the final dot of hu-HU or the era of
    // bg-BG, so the date is complete once every number has been read.
    const rest = parts.slice(index);
    if (
      rest.every((remaining) => remaining.type === 'literal') &&
      rest
        .map((remaining) => remaining.value)
        .join('')
        .startsWith(normalized.slice(offset))
    ) {
      offset = normalized.length;
      break;
    }
    const piece = normalized.slice(offset, offset + part.value.length);
    if (part.type === 'literal' ? !part.value.startsWith(piece) : !/^\d*$/.test(piece)) {
      return { value: '', inputState: 'invalid' };
    }
    if (piece.length < part.value.length) {
      return { value: '', inputState: 'incomplete' };
    }
    if (part.type !== 'literal') {
      values[part.type] = Number(piece);
    }
    offset += part.value.length;
  }
  if (offset !== normalized.length || !isDate(values)) {
    return { value: '', inputState: 'invalid' };
  }
  return { value: formatIsoDate(values), inputState: 'valid' };
}

/** Checks date bounds and excluded dates without changing the supplied date. */
export function validateDate(
  parsed: ParsedInput<string>,
  constraints: DateConstraints,
): DateValidationError | null {
  if (parsed.inputState === 'incomplete' || parsed.inputState === 'invalid') {
    return parsed.inputState;
  }
  if (parsed.value === '') {
    return null;
  }
  const min =
    constraints.min !== undefined && parseIsoDate(constraints.min) !== null
      ? constraints.min
      : undefined;
  const max =
    constraints.max !== undefined && parseIsoDate(constraints.max) !== null
      ? constraints.max
      : undefined;
  if (min !== undefined && max !== undefined && min > max) {
    return 'constraints';
  }
  if (min !== undefined && parsed.value < min) {
    return 'min';
  }
  if (max !== undefined && parsed.value > max) {
    return 'max';
  }
  const excluded = constraints.disabledDates;
  return (
    typeof excluded === 'function' ? excluded(parsed.value) : excluded?.includes(parsed.value)
  )
    ? 'disabled'
    : null;
}
