import { describe, expect, it } from 'vitest';

import {
  isIsoLocalDateTime,
  isIsoTime,
  joinLocalDateTime,
  splitLocalDateTime,
  timeBoundsForDate,
  validateTimeValue,
} from './time.ts';

describe('time values', () => {
  it('accepts only valid 24-hour times with minute precision', () => {
    for (const value of ['00:00', '09:05', '23:59']) {
      expect(isIsoTime(value), value).toBe(true);
    }
    for (const value of ['24:00', '12:60', '9:05', '12:00:00', '12:00Z', '']) {
      expect(isIsoTime(value), value).toBe(false);
    }
  });

  it('checks the complete calendar date without interpreting a time zone', () => {
    expect(isIsoLocalDateTime('2024-02-29T23:59')).toBe(true);
    for (const value of [
      '2025-02-29T12:00',
      '0000-01-01T12:00',
      '2026-01-01T24:00',
      '2026-01-01T12:00Z',
    ]) {
      expect(isIsoLocalDateTime(value), value).toBe(false);
    }
  });

  it('joins and splits complete parts without treating a partial edit as a value', () => {
    const parts = { date: '2026-12-31', time: '23:59' };
    expect(joinLocalDateTime(parts)).toBe('2026-12-31T23:59');
    expect(splitLocalDateTime('2026-12-31T23:59')).toEqual(parts);
    expect(joinLocalDateTime({ date: parts.date, time: '' })).toBe('');
    expect(joinLocalDateTime({ date: '', time: parts.time })).toBe('');
    expect(splitLocalDateTime('2026-12-31T23:59Z')).toEqual({ date: '', time: '' });
  });

  it('checks inclusive bounds and refuses reversed bounds', () => {
    const bounds = { min: '09:00', max: '17:00' };
    expect(validateTimeValue('', bounds, isIsoTime)).toBeNull();
    expect(validateTimeValue('09:00', bounds, isIsoTime)).toBeNull();
    expect(validateTimeValue('17:00', bounds, isIsoTime)).toBeNull();
    expect(validateTimeValue('08:59', bounds, isIsoTime)).toBe('min');
    expect(validateTimeValue('17:01', bounds, isIsoTime)).toBe('max');
    expect(validateTimeValue('24:00', bounds, isIsoTime)).toBe('invalid');
    expect(validateTimeValue('12:00', { min: '17:00', max: '09:00' }, isIsoTime)).toBe(
      'constraints',
    );
    expect(
      validateTimeValue('2026-01-02T00:00', { min: '2026-01-01T23:59' }, isIsoLocalDateTime),
    ).toBeNull();
  });

  it('limits the time only when the selected date is a date-time boundary', () => {
    const bounds = { min: '2026-04-01T09:00', max: '2026-04-03T17:00' };
    expect(timeBoundsForDate('2026-04-01', bounds)).toEqual({ min: '09:00' });
    expect(timeBoundsForDate('2026-04-02', bounds)).toEqual({});
    expect(timeBoundsForDate('2026-04-03', bounds)).toEqual({ max: '17:00' });
    expect(timeBoundsForDate('2026-04-01', { ...bounds, max: '2026-04-01T17:00' })).toEqual({
      min: '09:00',
      max: '17:00',
    });
  });
});
