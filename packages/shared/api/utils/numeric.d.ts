import { type ParsedInput } from './parsed-input.ts';
export declare function roundTo(value: number, decimals: number): number;
export declare function clamp(value: number, min: number, max: number): number;
export interface StepOptions {
    readonly step: number;
    readonly min?: number;
    readonly max?: number;
    readonly decimals?: number;
}
export declare function stepValue(value: number | null, direction: 1 | -1, options: StepOptions): number;
export interface NumberConstraints {
    readonly min?: number;
    readonly max?: number;
    readonly step?: number;
    readonly precision?: number;
}
export type NumberValidationError = 'incomplete' | 'invalid' | 'min' | 'max' | 'step' | 'precision' | 'constraints';
export interface NumberValidationContext extends NumberConstraints {
    readonly reason: NumberValidationError;
    readonly locale: string;
}
export declare function safeNumber(value: unknown): number | null;
export declare function serializeNumber(value: number | null): string;
export declare function parseNumberText(text: string, locale: string): ParsedInput<number | null>;
export declare function formatNumberText(value: number | null, locale: string): string;
export declare function numberStep(step: number | undefined): number;
export declare function validateNumber(parsed: ParsedInput<number | null>, constraints: NumberConstraints): NumberValidationError | null;
export declare function parseSerializedNumber(text: string): number | null;
export declare function nextNumberValue(parsed: ParsedInput<number | null>, direction: 1 | -1, constraints: NumberConstraints): number | null;
export declare function boundNumberValue(parsed: ParsedInput<number | null>, direction: 1 | -1, constraints: NumberConstraints): number | undefined;
