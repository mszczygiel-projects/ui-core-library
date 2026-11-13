export declare function isIsoTime(value: string): boolean;
export declare function isIsoLocalDateTime(value: string): boolean;
export interface LocalDateTimeParts {
    readonly date: string;
    readonly time: string;
}
export declare function splitLocalDateTime(value: string): LocalDateTimeParts;
export declare function joinLocalDateTime(parts: LocalDateTimeParts): string;
export interface TimeConstraints {
    readonly min?: string;
    readonly max?: string;
}
export declare function timeBoundsForDate(date: string, bounds: TimeConstraints): TimeConstraints;
export type TimeValidationError = 'invalid' | 'min' | 'max' | 'constraints';
export declare function validateTimeValue(value: string, constraints: TimeConstraints, isValue: (candidate: string) => boolean): TimeValidationError | null;
