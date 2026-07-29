/**
 * Numeric helpers for the NumberField internals.
 *
 * Lit and React are separate implementations that share tokens, not code, so
 * this mirrors `packages/react/src/NumberField/numeric.ts` deliberately.
 */

/**
 * Rounds to `precision` decimal places without inheriting binary float drift.
 *
 * Exponent-shifting via string beats `Math.round(v * 10 ** p) / 10 ** p`, which
 * still leaks artefacts (`2.3000000000000003` survives a naive round-trip).
 */
export function roundToPrecision(value: number, precision: number): number {
  if (!Number.isFinite(value)) return value;
  const shifted = Math.round(Number(`${value}e${precision}`));
  return Number(`${shifted}e-${precision}`);
}

/** Constrains `value` to the inclusive `[min, max]` range. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Rounds first, then clamps.
 *
 * The order matters: rounding can push a value just past a bound
 * (`1.996` at precision 2 with `max: 2` rounds to `2.00`, not out of range),
 * so clamping has to be the final word.
 */
export function commitValue(value: number, min: number, max: number, precision: number): number {
  return clamp(roundToPrecision(value, precision), min, max);
}

/** Parses user-typed text; returns `null` for empty or non-numeric input. */
export function parseValue(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed === '') return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Renders a committed value for display; `null` renders as an empty field. */
export function formatValue(value: number | null, precision: number): string {
  if (value === null) return '';
  return value.toFixed(precision);
}

/**
 * Applies one stepper increment.
 *
 * Re-rounds after the addition so repeated ticks can't accumulate drift
 * (`0.1 + 0.2` never becomes `0.30000000000000004` in the input).
 */
export function stepValue(
  current: number | null,
  direction: 1 | -1,
  step: number,
  min: number,
  max: number,
  precision: number,
): number {
  const base = current ?? (Number.isFinite(min) ? min : 0);
  return commitValue(base + direction * step, min, max, precision);
}
