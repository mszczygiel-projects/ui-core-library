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
  const positionOf = (number: number): number => roundTo((number - base) / step, 9);
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
