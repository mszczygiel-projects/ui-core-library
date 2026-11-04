import { type ParsedInput } from './parsed-input.ts';
export interface DateParts {
    readonly year: number;
    readonly month: number;
    readonly day: number;
}
export declare function daysInMonth(year: number, month: number): number;
export declare function parseIsoDate(text: string): DateParts | null;
export declare function formatIsoDate(parts: DateParts): string;
export declare function addDays(date: string, days: number): string;
export declare function addMonths(date: string, months: number): string;
export declare function epochDay(date: string): number;
export declare function isoWeekday(date: string): number;
export declare function isoDateAt(instant: Date, timeZone: string): string;
export interface DateConstraints {
    readonly min?: string;
    readonly max?: string;
    readonly disabledDates?: readonly string[] | ((iso: string) => boolean);
}
export type DateValidationError = 'incomplete' | 'invalid' | 'min' | 'max' | 'disabled' | 'constraints';
export interface DateValidationContext {
    readonly reason: DateValidationError;
    readonly locale: string;
    readonly min?: string;
    readonly max?: string;
}
export interface DateFormatPart {
    readonly type: 'year' | 'month' | 'day' | 'literal';
    readonly value: string;
}
export declare function dateFormatParts(locale: string): readonly DateFormatPart[];
export declare function dateMaskPattern(locale: string): string;
export interface DateMaskOptions {
    readonly mask: string;
    readonly lazy: true;
    readonly overwrite: false;
    readonly autofix: false;
    readonly definitions: {
        readonly '0': RegExp;
    };
    readonly prepare: (value: string) => string;
}
export declare function dateMaskOptions(locale: string): DateMaskOptions;
export declare function formatDateText(iso: string, locale: string): string;
export declare function prepareDateText(text: string, locale: string): string;
export declare function parseDateText(text: string, locale: string): ParsedInput<string>;
export declare function validateDate(parsed: ParsedInput<string>, constraints: DateConstraints): DateValidationError | null;
