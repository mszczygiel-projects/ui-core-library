import type { TextControlProps } from '../components/text-field.ts';

/** Whether editable text is empty, unfinished, malformed, or a complete value. */
export type InputState = 'empty' | 'incomplete' | 'invalid' | 'valid';

/** A pure parser result, keeping unfinished text distinct from an empty field. */
export interface ParsedInput<Value> {
  /** The canonical value, or the field's empty value when parsing is unfinished. */
  readonly value: Value;
  /** The state of the editable text, independent of range constraints. */
  readonly inputState: InputState;
}

/** What accompanies a user edit; the caller supplies its platform's event type. */
export interface ParsedInputDetails<OriginalEvent, Error extends string> {
  /** The event that caused the edit. */
  readonly originalEvent: OriginalEvent;
  /** The editable text, including incomplete input. */
  readonly text: string;
  /** Whether the text can be parsed. */
  readonly inputState: InputState;
  /** The failed constraint, or null when the value is valid. */
  readonly validationError: Error | null;
}

/** Removes bidi formatting marks, which Intl inserts around numeric content. */
export function withoutBidiMarks(text: string): string {
  return text.replace(/[\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, '');
}

/** The ten digits of an explicitly selected locale, in numeric order. */
export function localeDigits(locale: string): readonly string[] {
  const formatter = new Intl.NumberFormat(locale, { useGrouping: false });
  return Array.from({ length: 10 }, (_, digit) => withoutBidiMarks(formatter.format(digit)));
}

/** Converts a locale's digits to ASCII without changing punctuation. */
export function asciiDigits(text: string, locale: string): string {
  let result = withoutBidiMarks(text);
  for (const [digit, character] of localeDigits(locale).entries()) {
    result = result.split(character).join(String(digit));
  }
  return result;
}
/** Appearance and native constraints shared by fields with a parsed value. */
export interface ParsedFieldProps extends Omit<
  TextControlProps,
  'value' | 'minLength' | 'maxLength'
> {
  /** BCP 47 locale, before the configured locale and browser language. */
  locale?: string;
}
