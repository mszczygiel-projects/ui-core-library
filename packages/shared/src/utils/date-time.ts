import {
  type DateConstraints,
  type DateMaskOptions,
  dateMaskOptions,
  dateMaskPattern,
  formatDateText,
  parseDateText,
  prepareDateText,
  validateDate,
} from './date.ts';
import { asciiDigits, localeDigits, type ParsedInput } from './parsed-input.ts';
import {
  isIsoLocalDateTime,
  isIsoTime,
  type LocalDateTimeParts,
  splitLocalDateTime,
  type TimeConstraints,
  validateTimeValue,
} from './time.ts';

/** Constraints of a local date-time, including dates that cannot be picked. */
export interface DateTimeConstraints
  extends TimeConstraints, Pick<DateConstraints, 'disabledDates'> {}

/** Formats a complete local date-time without converting a time zone. */
export function formatDateTimeText(value: string, locale: string): string {
  if (!isIsoLocalDateTime(value)) {
    return '';
  }
  const digits = localeDigits(locale);
  const time = value.slice(11).replace(/\d/g, (digit) => digits[Number(digit)] ?? digit);
  return `${formatDateText(value.slice(0, 10), locale)} ${time}`;
}

/** Parses a complete locale date and 24-hour time, retaining partial and invalid states. */
export function parseDateTimeText(text: string, locale: string): ParsedInput<string> {
  const normalized = asciiDigits(text, locale).trim();
  if (normalized === '') {
    return { value: '', inputState: 'empty' };
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalized)) {
    return isIsoLocalDateTime(normalized)
      ? { value: normalized, inputState: 'valid' }
      : { value: '', inputState: 'invalid' };
  }
  const dateLength = asciiDigits(formatDateText('2026-12-31', locale), locale).length;
  const dateText = normalized.slice(0, dateLength);
  const date = parseDateText(dateText, locale);
  if (date.inputState === 'invalid') {
    return { value: '', inputState: 'invalid' };
  }
  if (date.inputState !== 'valid' || normalized.length <= dateLength) {
    return { value: '', inputState: 'incomplete' };
  }
  if (normalized[dateLength] !== ' ') {
    return { value: '', inputState: 'invalid' };
  }
  const time = normalized.slice(dateLength + 1);
  if (!/^\d{0,2}(?::\d{0,2})?$/.test(time)) {
    return { value: '', inputState: 'invalid' };
  }
  if (time.length < 5) {
    return { value: '', inputState: 'incomplete' };
  }
  return isIsoTime(time)
    ? { value: `${date.value}T${time}`, inputState: 'valid' }
    : { value: '', inputState: 'invalid' };
}

/** Complete parts of a draft, used to initialize the picker without discarding a partial date. */
export function dateTimeDraftParts(text: string, locale: string): LocalDateTimeParts {
  const parsed = parseDateTimeText(text, locale);
  if (parsed.inputState === 'valid') {
    return splitLocalDateTime(parsed.value);
  }
  const normalized = asciiDigits(text, locale).trim();
  const dateLength = asciiDigits(formatDateText('2026-12-31', locale), locale).length;
  const date = parseDateText(normalized.slice(0, dateLength), locale);
  const time = normalized.slice(dateLength + 1);
  return { date: date.value, time: isIsoTime(time) ? time : '' };
}

/** Reorders a complete ISO paste into the locale's editable date-time grammar. */
export function prepareDateTimeText(text: string, locale: string): string {
  const normalized = asciiDigits(text, locale).trim();
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/.exec(normalized);
  if (match === null) {
    return text;
  }
  const digits = localeDigits(locale);
  const time = (match[2] ?? '').replace(/\d/g, (digit) => digits[Number(digit)] ?? digit);
  return `${prepareDateText(match[1] ?? '', locale)} ${time}`;
}

/** Plain-data IMask options shared by both implementations. */
export function dateTimeMaskOptions(locale: string): DateMaskOptions {
  return {
    ...dateMaskOptions(locale),
    mask: `${dateMaskPattern(locale)}\` 00\`:00`,
    prepare: (text) => prepareDateTimeText(text, locale),
  };
}

/** Validates a parsed local date-time and the excluded calendar dates. */
export function validateDateTime(parsed: ParsedInput<string>, constraints: DateTimeConstraints) {
  if (parsed.inputState === 'invalid' || parsed.inputState === 'incomplete') {
    return parsed.inputState;
  }
  const reason = validateTimeValue(parsed.value, constraints, isIsoLocalDateTime);
  if (reason !== null || parsed.value === '') {
    return reason;
  }
  return validateDate(
    { value: parsed.value.slice(0, 10), inputState: 'valid' },
    { disabledDates: constraints.disabledDates },
  );
}
