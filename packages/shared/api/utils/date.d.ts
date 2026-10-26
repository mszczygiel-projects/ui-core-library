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
export declare function isoWeekday(date: string): number;
export declare function isoDateAt(instant: Date, timeZone: string): string;
