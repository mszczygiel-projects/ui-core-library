import { describe, expect, it } from 'vitest';

import {
  dateTimeDraftParts,
  dateTimeMaskOptions,
  formatDateTimeText,
  parseDateTimeText,
  prepareDateTimeText,
  validateDateTime,
} from './date-time.ts';

describe('local date-time text', () => {
  it('formats and parses a single locale-aware field without a time-zone conversion', () => {
    for (const locale of ['pl-PL', 'en-US', 'ar-EG']) {
      const iso = '2026-12-31T09:30';
      const display = formatDateTimeText(iso, locale);
      expect(parseDateTimeText(display, locale), locale).toEqual({
        value: iso,
        inputState: 'valid',
      });
      expect(prepareDateTimeText(iso, locale)).toBe(display);
      expect(dateTimeMaskOptions(locale).mask).toContain('00`:00');
    }
  });

  it('does not turn an unfinished or impossible value into a complete value', () => {
    expect(parseDateTimeText('', 'pl-PL').inputState).toBe('empty');
    for (const text of ['31.12.2026', '31.12.2026 09', '31.12.2026 09:3']) {
      expect(parseDateTimeText(text, 'pl-PL'), text).toEqual({
        value: '',
        inputState: 'incomplete',
      });
    }
    for (const text of ['31.02.2026 09:30', '31.12.2026 24:00', '31.12.2026 09:60']) {
      expect(parseDateTimeText(text, 'pl-PL'), text).toEqual({ value: '', inputState: 'invalid' });
    }
    expect(prepareDateTimeText('2026-02-31T24:00', 'pl-PL')).toBe('31.02.2026 24:00');
  });

  it('keeps a complete date available while its time is unfinished', () => {
    expect(dateTimeDraftParts('31.12.2026 09:3', 'pl-PL')).toEqual({
      date: '2026-12-31',
      time: '',
    });
    expect(dateTimeDraftParts('31.12.2026 09:30', 'pl-PL')).toEqual({
      date: '2026-12-31',
      time: '09:30',
    });
    expect(dateTimeDraftParts('31.02.2026', 'pl-PL')).toEqual({ date: '', time: '' });
  });

  it('checks whole-value bounds and excluded dates', () => {
    const constraints = {
      min: '2026-12-31T09:00',
      max: '2026-12-31T17:00',
      disabledDates: ['2026-12-30'],
    };
    const parse = (value: string) => parseDateTimeText(value, 'pl-PL');
    expect(validateDateTime(parse('2026-12-31T08:59'), constraints)).toBe('min');
    expect(validateDateTime(parse('2026-12-31T09:00'), constraints)).toBeNull();
    expect(validateDateTime(parse('2026-12-31T17:01'), constraints)).toBe('max');
    expect(
      validateDateTime(parse('2026-12-30T09:00'), { disabledDates: constraints.disabledDates }),
    ).toBe('disabled');
  });
});
