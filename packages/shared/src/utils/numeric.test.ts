import { describe, expect, it } from 'vitest';

import { clamp, roundTo, stepValue } from './numeric.ts';

describe('roundTo', () => {
  it('rounds decimals without binary drift', () => {
    expect(roundTo(1.005, 2)).toBe(1.01);
    expect(roundTo(2.345, 2)).toBe(2.35);
    expect(roundTo(0.1 + 0.2, 2)).toBe(0.3);
  });

  it('rounds half away from zero, and never returns a negative zero', () => {
    expect(roundTo(2.5, 0)).toBe(3);
    expect(roundTo(-2.5, 0)).toBe(-3);
    expect(Object.is(roundTo(-0.001, 2), 0)).toBe(true);
  });

  it('works for numbers written with an exponent', () => {
    expect(roundTo(1e21, 2)).toBe(1e21);
    expect(roundTo(1e-7, 2)).toBe(0);
    expect(roundTo(1.23456e-5, 8)).toBe(1.235e-5);
  });

  it('rounds to tens and hundreds with negative decimals', () => {
    expect(roundTo(1234, -2)).toBe(1200);
    expect(roundTo(1250, -2)).toBe(1300);
  });

  it('leaves what is not finite as it is', () => {
    expect(roundTo(Number.NaN, 2)).toBeNaN();
    expect(roundTo(Number.POSITIVE_INFINITY, 2)).toBe(Number.POSITIVE_INFINITY);
  });

  it('leaves a value with no digits at that place as it is', () => {
    expect(roundTo(1.5, 400)).toBe(1.5);
    expect(roundTo(1e300, 10)).toBe(1e300);
    expect(roundTo(-1e300, 10)).toBe(-1e300);
    expect(roundTo(1.5, -400)).toBe(0);
  });
});

describe('clamp', () => {
  it('keeps a value within the bounds', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });

  it('lets the upper bound win when the bounds cross', () => {
    expect(clamp(5, 10, 0)).toBe(0);
  });
});

describe('stepValue', () => {
  it('moves a value on a step by one step', () => {
    expect(stepValue(1, 1, { step: 0.5 })).toBe(1.5);
    expect(stepValue(1, -1, { step: 0.5 })).toBe(0.5);
  });

  it('moves a value between two steps to the next step in that direction', () => {
    expect(stepValue(1.3, 1, { step: 0.5 })).toBe(1.5);
    expect(stepValue(1.3, -1, { step: 0.5 })).toBe(1);
  });

  it('adds up steps without binary drift', () => {
    let value = 0;
    for (let i = 0; i < 10; i++) {
      value = stepValue(value, 1, { step: 0.1 });
    }
    expect(value).toBe(1);
    expect(stepValue(0.2, 1, { step: 0.1 })).toBe(0.3);
  });

  it('counts the steps from the lowest value', () => {
    expect(stepValue(2, 1, { step: 2, min: 1 })).toBe(3);
    expect(stepValue(3, 1, { step: 2, min: 1 })).toBe(5);
    expect(stepValue(0.5, 1, { step: 1, min: 0.25 })).toBe(1.25);
  });

  it('stays within the bounds, on a step', () => {
    expect(stepValue(9, 1, { step: 2, max: 10 })).toBe(10);
    expect(stepValue(8, 1, { step: 3, max: 10 })).toBe(9);
    expect(stepValue(1, -1, { step: 2, min: 0 })).toBe(0);
  });

  it('keeps the value where it is when the bounds leave no step in that direction', () => {
    expect(stepValue(10, 1, { step: 3, max: 10 })).toBe(10);
    expect(stepValue(4, 1, { step: 2, max: 5 })).toBe(4);
  });

  it('brings a value outside the bounds back when it steps towards them', () => {
    expect(stepValue(12, -1, { step: 2, max: 10 })).toBe(10);
    expect(stepValue(-5, 1, { step: 2, min: 0 })).toBe(0);
  });

  it('steps an empty value from 0, as the number field does, and keeps it within the bounds', () => {
    expect(stepValue(null, 1, { step: 1 })).toBe(1);
    expect(stepValue(null, -1, { step: 1 })).toBe(-1);
    expect(stepValue(null, 1, { step: 1, min: -10, max: 10 })).toBe(1);
    expect(stepValue(null, -1, { step: 1, min: -10, max: 10 })).toBe(-1);
    expect(stepValue(null, 1, { step: 1, min: 5 })).toBe(5);
    expect(stepValue(null, -1, { step: 1, min: 5 })).toBe(5);
    expect(stepValue(null, 1, { step: 2, max: -3 })).toBe(-4);
  });

  it('moves an empty value from 0 to the next step when 0 is between two steps', () => {
    expect(stepValue(null, 1, { step: 0.5, min: -10.25 })).toBe(0.25);
    expect(stepValue(Number.NaN, -1, { step: 0.5, min: -10.25 })).toBe(-0.25);
  });

  it('leaves the value as it is when the step is not greater than zero', () => {
    expect(stepValue(3, 1, { step: 0 })).toBe(3);
    expect(stepValue(3, 1, { step: -1 })).toBe(3);
    expect(stepValue(3, 1, { step: Number.NaN })).toBe(3);
    expect(stepValue(null, 1, { step: 0, min: 5 })).toBe(5);
  });

  it('ignores a bound or a number of decimals that is not a finite number', () => {
    expect(stepValue(5, 1, { step: 1, min: Number.NaN })).toBe(6);
    expect(stepValue(5, 1, { step: 1, max: Number.NaN })).toBe(6);
    expect(stepValue(5, -1, { step: 1, min: Number.POSITIVE_INFINITY })).toBe(4);
    expect(stepValue(1, 1, { step: 0.5, decimals: Number.NaN })).toBe(1.5);
  });

  it('rounds to the decimals asked for', () => {
    expect(stepValue(1, 1, { step: 0.125, decimals: 2 })).toBe(1.13);
  });
});
