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
