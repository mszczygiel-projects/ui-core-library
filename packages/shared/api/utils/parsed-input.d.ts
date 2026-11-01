import type { TextControlProps } from '../components/text-field.ts';
export type InputState = 'empty' | 'incomplete' | 'invalid' | 'valid';
export interface ParsedInput<Value> {
    readonly value: Value;
    readonly inputState: InputState;
}
export interface ParsedInputDetails<OriginalEvent, Error extends string> {
    readonly originalEvent: OriginalEvent;
    readonly text: string;
    readonly inputState: InputState;
    readonly validationError: Error | null;
}
export declare function withoutBidiMarks(text: string): string;
export declare function localeDigits(locale: string): readonly string[];
export declare function asciiDigits(text: string, locale: string): string;
export interface ParsedFieldProps extends Omit<TextControlProps, 'value' | 'minLength' | 'maxLength'> {
    locale?: string;
}
