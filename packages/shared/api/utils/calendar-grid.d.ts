import { type DateConstraints } from './date.ts';
import type { TextDirection } from './radio-navigation.ts';
export interface MonthParts {
    readonly year: number;
    readonly month: number;
}
export type CalendarView = 'days' | 'months' | 'years';
export type CalendarSelection = 'none' | 'selected' | 'start' | 'end' | 'middle';
export declare const MONTH_COLUMNS = 3;
export declare const YEAR_COLUMNS = 4;
export declare const YEARS_PER_PAGE = 24;
export declare function parseIsoMonth(text: string): MonthParts | null;
export declare function formatIsoMonth(parts: MonthParts): string;
export declare function monthOf(date: string): string;
export declare function firstDateOf(month: string): string;
export declare function shiftMonth(month: string, months: number): string | null;
export declare function isIsoWeekday(value: unknown): value is number;
export declare function firstDayOfWeek(locale: string): number;
export declare function weekdayOrder(firstDay: number): readonly number[];
export declare function monthWeeks(month: string, firstDay: number): readonly (readonly string[])[];
export declare function yearPage(year: number): readonly number[];
export declare function isDateDisabled(date: string, constraints: DateConstraints): boolean;
export declare function isMonthDisabled(month: string, constraints: DateConstraints): boolean;
export declare function isYearDisabled(year: number, constraints: DateConstraints): boolean;
export interface DateRange {
    readonly start: string;
    readonly end: string;
}
export declare function parseIsoRange(value: string): DateRange | null;
export declare function formatIsoRange(first: string, second: string): string;
export interface SelectionContext {
    readonly value: string;
    readonly range: boolean;
    readonly anchor?: string;
}
export declare function selectionOf(date: string, context: SelectionContext): CalendarSelection;
export declare function selectedDate(value: string, range: boolean): string | undefined;
export interface CalendarKeyOptions {
    readonly view: CalendarView;
    readonly direction: TextDirection;
    readonly firstDayOfWeek: number;
    readonly shiftKey: boolean;
}
export declare function nextFocusedDate(key: string, date: string, options: CalendarKeyOptions): string | undefined;
export declare function monthYearLabel(month: string, locale: string): string;
export declare function monthLabel(month: string, locale: string): string;
export declare function yearLabel(year: number, locale: string): string;
export declare function yearPageLabel(year: number, locale: string): string;
export declare function dayLabel(date: string, locale: string): string;
export declare function fullDateLabel(date: string, locale: string): string;
export interface WeekdayLabel {
    readonly short: string;
    readonly long: string;
}
export declare function weekdayLabels(locale: string, firstDay: number): readonly WeekdayLabel[];
