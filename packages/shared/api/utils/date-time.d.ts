import { type DateConstraints, type DateMaskOptions } from './date.ts';
import { type ParsedInput } from './parsed-input.ts';
import { type LocalDateTimeParts, type TimeConstraints } from './time.ts';
export interface DateTimeConstraints extends TimeConstraints, Pick<DateConstraints, 'disabledDates'> {
}
export declare function formatDateTimeText(value: string, locale: string): string;
export declare function parseDateTimeText(text: string, locale: string): ParsedInput<string>;
export declare function dateTimeDraftParts(text: string, locale: string): LocalDateTimeParts;
export declare function prepareDateTimeText(text: string, locale: string): string;
export declare function dateTimeMaskOptions(locale: string): DateMaskOptions;
export declare function validateDateTime(parsed: ParsedInput<string>, constraints: DateTimeConstraints): "disabled" | "incomplete" | "invalid" | "min" | "max" | "constraints" | null;
