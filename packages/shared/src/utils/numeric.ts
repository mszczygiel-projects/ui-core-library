import { asciiDigits, localeDigits, type ParsedInput, withoutBidiMarks } from './parsed-input.ts';

/**
 * Arithmetic for numeric input: rounding to a number of decimals, keeping a value within bounds
 * and stepping it, without the drift of binary floating point.
 */

/**
 * Moves the decimal point of a finite number by `places`. It works on the shortest decimal form
 * of the number, because multiplying by a power of ten adds binary drift.
 */
function shift(value: number, places: number): number {
  const [mantissa = '0', exponent = '0'] = value.toExponential().split('e');
  return Number(`${mantissa}e${String(Number(exponent) + places)}`);
}

/** How many decimals the shortest form of a number has: 2 for 0.25, 0 for 300. */
function decimalsOf(value: number): number {
  const [mantissa = '', exponent = '0'] = value.toExponential().split('e');
  const fraction = mantissa.split('.')[1] ?? '';
  return Math.max(0, fraction.length - Number(exponent));
}

/**
 * Rounds `value` to `decimals` decimal places, half away from zero, as people round by hand:
 * 1.005 rounds to 1.01 and -2.5 to -3. A negative `decimals` rounds to tens, hundreds and so on.
 * A value that is not finite stays as it is, and so does a value with no digits at that place.
 */
export function roundTo(value: number, decimals: number): number {
  if (!Number.isFinite(value)) {
    return value;
  }
  const places = Number.isFinite(decimals) ? Math.trunc(decimals) : 0;
  const shifted = shift(value, places);
  if (!Number.isFinite(shifted)) {
    // Shifted beyond the range of a number: the value has no digits that far right.
    return value;
  }
  const rounded = Math.round(Math.abs(shifted));
  return rounded === 0 ? 0 : Math.sign(value) * shift(rounded, -places);
}

/** `value` when it is a finite number, or `fallback`. */
function finiteOr(value: number | undefined, fallback: number): number {
  return value !== undefined && Number.isFinite(value) ? value : fallback;
}

/**
 * Removes division drift without treating a small nonzero fraction as zero steps. The drift of
 * `value - base` is relative to the operands, not to the position, so the nearest grid value is
 * compared with `value` at their own magnitude.
 */
function gridPosition(value: number, base: number, step: number): number {
  const position = (value - base) / step;
  const nearest = Math.round(position);
  const magnitude = Math.max(Math.abs(value), Math.abs(base));
  return Number.isFinite(position) &&
    Math.abs(value - (base + nearest * step)) <= Number.EPSILON * magnitude * 4
    ? nearest
    : position;
}

/** `value` kept within `min` and `max`; when the bounds cross, `max` wins. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export interface StepOptions {
  /** The size of one step, greater than zero. */
  readonly step: number;
  /**
   * The lowest value. The steps are counted from it, or from 0 without it.
   * @default no lower bound
   */
  readonly min?: number;
  /**
   * The highest value.
   * @default no upper bound
   */
  readonly max?: number;
  /**
   * The decimals of the result.
   * @default as many as the step and the start of the steps have
   */
  readonly decimals?: number;
}

/**
 * The value one step up (`direction` 1) or down (-1), as `<input type="number">` steps it.
 *
 * The steps are counted from `min`, or from 0 without it. A value between two steps moves to the
 * next step in that direction, not a whole step further, and the result stays within the bounds
 * on a step; when the bounds leave no step in that direction, the value stays where it is. An
 * empty value steps from 0, as the field does, and lands within the bounds. A bound or a number of
 * decimals that is not a finite number counts as not given, as the field ignores a `min` or `max`
 * it cannot read. A step that is not greater than zero leaves the value as it is.
 */
export function stepValue(value: number | null, direction: 1 | -1, options: StepOptions): number {
  const { step } = options;
  const min = finiteOr(options.min, Number.NEGATIVE_INFINITY);
  const max = finiteOr(options.max, Number.POSITIVE_INFINITY);
  const base = Number.isFinite(min) ? min : 0;
  const current = value !== null && Number.isFinite(value) ? value : null;
  if (!(step > 0 && Number.isFinite(step))) {
    return current ?? clamp(0, min, max);
  }
  const decimals = finiteOr(options.decimals, Math.max(decimalsOf(step), decimalsOf(base)));

  // Positions on the grid of steps, counted from the base and freed from binary drift.
  const positionOf = (number: number): number => gridPosition(number, base, step);
  const lowest = Math.ceil(positionOf(min));
  const highest = Math.floor(positionOf(max));
  const valueAt = (position: number): number =>
    roundTo(base + clamp(position, lowest, highest) * step, decimals);

  const position = positionOf(current ?? 0);
  const next = valueAt(
    Number.isInteger(position)
      ? position + direction
      : direction > 0
        ? Math.ceil(position)
        : Math.floor(position),
  );
  if (current === null) {
    return next;
  }
  return direction > 0 ? Math.max(next, current) : Math.min(next, current);
}

/** Constraints of a number input; omitted bounds impose no restriction. */
export interface NumberConstraints {
  /** Inclusive lower bound. */
  readonly min?: number;
  /** Inclusive upper bound. */
  readonly max?: number;
  /** Positive step, counted from min or zero. @default 1 */
  readonly step?: number;
  /** Maximum decimal places, from 0 through 20; never rounds input. */
  readonly precision?: number;
}

/** Why a number input cannot be submitted. */
export type NumberValidationError =
  'incomplete' | 'invalid' | 'min' | 'max' | 'step' | 'precision' | 'constraints';

/** The context of a complete, translatable number validation message. */
export interface NumberValidationContext extends NumberConstraints {
  /** The failed constraint. */
  readonly reason: NumberValidationError;
  /** The effective formatting locale. */
  readonly locale: string;
}

/** A finite value that can be represented safely by the number field. */
export function safeNumber(value: unknown): number | null {
  return typeof value === 'number' &&
    Number.isFinite(value) &&
    Math.abs(value) <= Number.MAX_SAFE_INTEGER
    ? Object.is(value, -0)
      ? 0
      : value
    : null;
}

/** A finite number as a decimal string, with neither grouping nor an exponent. */
export function serializeNumber(value: number | null): string {
  const safe = safeNumber(value);
  if (safe === null) {
    return '';
  }
  const [mantissa = '', rawExponent] = String(safe).split('e');
  if (rawExponent === undefined) {
    return mantissa;
  }
  const sign = mantissa.startsWith('-') ? '-' : '';
  const unsigned = mantissa.replace('-', '');
  const [integer = '', fraction = ''] = unsigned.split('.');
  const digits = integer + fraction;
  const point = integer.length + Number(rawExponent);
  if (point <= 0) {
    return `${sign}0.${'0'.repeat(-point)}${digits}`;
  }
  return point >= digits.length
    ? sign + digits + '0'.repeat(point - digits.length)
    : `${sign}${digits.slice(0, point)}.${digits.slice(point)}`;
}

function numberSymbols(locale: string) {
  const parts = new Intl.NumberFormat(locale).formatToParts(-123456789.5);
  return {
    decimal: parts.find((part) => part.type === 'decimal')?.value ?? '.',
    group: parts.find((part) => part.type === 'group')?.value ?? ',',
    minus: parts.find((part) => part.type === 'minusSign')?.value ?? '-',
  };
}

function normalizedDecimal(text: string): string {
  const negative = text.startsWith('-');
  const [integer = '', fraction = ''] = text.replace(/^[+-]/, '').split('.');
  const whole = integer.replace(/^0+(?=\d)/, '') || '0';
  const decimals = fraction.replace(/0+$/, '');
  const value = `${whole}${decimals ? `.${decimals}` : ''}`;
  return negative && value !== '0' ? `-${value}` : value;
}

/** Parses the whole localized string, without silently discarding incorrect grouping or digits. */
export function parseNumberText(text: string, locale: string): ParsedInput<number | null> {
  let normalized = asciiDigits(text, locale).trim();
  if (normalized === '') {
    return { value: null, inputState: 'empty' };
  }
  const { decimal, group, minus } = numberSymbols(locale);
  normalized = normalized.split(minus).join('-');
  // Spaces exported by spreadsheets are accepted only where this locale actually groups digits.
  const groupCharacter = /\s/u.test(group) ? ' ' : group;
  if (groupCharacter === ' ') {
    normalized = normalized.replace(/[\u00a0\u202f]/g, ' ');
  }
  if (normalized.includes(groupCharacter)) {
    const ungrouped = normalized.split(groupCharacter).join('');
    const wholeText = ungrouped.split(decimal)[0] ?? '';
    const number = Number(wholeText);
    if (!/^[+-]?\d+$/.test(wholeText) || !Number.isSafeInteger(number)) {
      return { value: null, inputState: 'invalid' };
    }
    const expected = asciiDigits(
      new Intl.NumberFormat(locale, {
        maximumFractionDigits: 0,
        useGrouping: true,
      }).format(Math.abs(number)),
      locale,
    ).replace(/[\u00a0\u202f]/g, ' ');
    const actual = (normalized.split(decimal)[0] ?? '').replace(/^[+-]/, '');
    if (actual !== expected || (normalized.split(decimal)[1] ?? '').includes(groupCharacter)) {
      return { value: null, inputState: 'invalid' };
    }
    normalized = ungrouped;
  }
  normalized = normalized.split(decimal).join('.');
  if (/^[+-]?$/.test(normalized) || /^[+-]?\d*\.$/.test(normalized)) {
    return { value: null, inputState: 'incomplete' };
  }
  if (!/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(normalized)) {
    return { value: null, inputState: 'invalid' };
  }
  const value = safeNumber(Number(normalized));
  if (value === null || normalizedDecimal(normalized) !== serializeNumber(value)) {
    return { value: null, inputState: 'invalid' };
  }
  return { value, inputState: 'valid' };
}

/** Localized decimal text without grouping, padding, or rounding. */
export function formatNumberText(value: number | null, locale: string): string {
  const { decimal, minus } = numberSymbols(locale);
  const digits = localeDigits(locale);
  return withoutBidiMarks(
    serializeNumber(value)
      .replace(/\d/g, (digit) => digits[Number(digit)] ?? digit)
      .replace('.', decimal)
      .replace('-', minus),
  );
}

/** A positive finite step; invalid runtime values fall back to the field default. */
export function numberStep(step: number | undefined): number {
  return step !== undefined && Number.isFinite(step) && step > 0 ? step : 1;
}

/** Validates a parsed number without changing its value or editable text. */
export function validateNumber(
  parsed: ParsedInput<number | null>,
  constraints: NumberConstraints,
): NumberValidationError | null {
  if (parsed.inputState === 'incomplete' || parsed.inputState === 'invalid') {
    return parsed.inputState;
  }
  const { value } = parsed;
  if (value === null) {
    return null;
  }
  const min = finiteOr(constraints.min, Number.NEGATIVE_INFINITY);
  const max = finiteOr(constraints.max, Number.POSITIVE_INFINITY);
  if (min > max) {
    return 'constraints';
  }
  if (value < min) {
    return 'min';
  }
  if (value > max) {
    return 'max';
  }
  const precision = constraints.precision;
  if (
    precision !== undefined &&
    Number.isInteger(precision) &&
    precision >= 0 &&
    precision <= 20 &&
    decimalsOf(value) > precision
  ) {
    return 'precision';
  }
  const position = gridPosition(
    value,
    Number.isFinite(min) ? min : 0,
    numberStep(constraints.step),
  );
  return Number.isInteger(position) ? null : 'step';
}

/** The number in a canonical form value or attribute, such as `-12.5`; null otherwise. */
export function parseSerializedNumber(text: string): number | null {
  // Number() would also take exponents, hex and blank text, which the field never submits.
  return /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(text.trim())
    ? parseNumberText(text, 'en-US').value
    : null;
}

/** Unfinished or malformed text belongs to the user; stepping would replace it. */
function steppable(parsed: ParsedInput<number | null>): boolean {
  return parsed.inputState === 'empty' || parsed.inputState === 'valid';
}

function allowed(value: number, constraints: NumberConstraints): boolean {
  return (
    safeNumber(value) !== null &&
    validateNumber({ value, inputState: 'valid' }, constraints) === null
  );
}

/**
 * The next allowed value, or the current one if no valid step exists in that direction or the
 * text is unfinished or malformed.
 */
export function nextNumberValue(
  parsed: ParsedInput<number | null>,
  direction: 1 | -1,
  constraints: NumberConstraints,
): number | null {
  const { value } = parsed;
  if (
    !steppable(parsed) ||
    (constraints.min !== undefined &&
      constraints.max !== undefined &&
      constraints.min > constraints.max)
  ) {
    return value;
  }
  const next = stepValue(value, direction, { ...constraints, step: numberStep(constraints.step) });
  return allowed(next, constraints) ? next : value;
}

/**
 * The allowed value nearest the finite min (-1) or max (1), for Home and End. A bound off the
 * step grid gives the grid value inside it. Undefined when there is no such value or the text
 * is unfinished or malformed, so the key keeps its native caret movement.
 */
export function boundNumberValue(
  parsed: ParsedInput<number | null>,
  direction: 1 | -1,
  constraints: NumberConstraints,
): number | undefined {
  const bound = direction < 0 ? constraints.min : constraints.max;
  if (bound === undefined || !Number.isFinite(bound) || !steppable(parsed)) {
    return undefined;
  }
  if (allowed(bound, constraints)) {
    return bound;
  }
  const inside = stepValue(bound, direction < 0 ? 1 : -1, {
    ...constraints,
    step: numberStep(constraints.step),
  });
  return allowed(inside, constraints) ? inside : undefined;
}
