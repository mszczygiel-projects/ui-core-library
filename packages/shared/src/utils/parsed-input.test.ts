import { describe, expect, it } from 'vitest';

import { dateMaskPattern, formatDateText, parseDateText, validateDate } from './date.ts';
import {
  boundNumberValue,
  formatNumberText,
  nextNumberValue,
  parseNumberText,
  parseSerializedNumber,
  serializeNumber,
  validateNumber,
} from './numeric.ts';

const valid = (value: number | null) => ({ value, inputState: 'valid' as const });

describe('localized number input', () => {
  it.each([
    ['12,5', 'pl-PL', 12.5],
    ['1 234,5', 'pl-PL', 1234.5],
    ['1,234.5', 'en-US', 1234.5],
    ['12,34,567.5', 'en-IN', 1234567.5],
    ['١٢٫٥', 'ar-EG', 12.5],
    ['-0', 'en-US', 0],
    ['.5', 'en-US', 0.5],
    ['0001.2300', 'en-US', 1.23],
  ])('parses the entire %s string in %s', (text, locale, value) => {
    expect(parseNumberText(text, locale)).toEqual({ value, inputState: 'valid' });
  });
  it.each([
    'NaN',
    'Infinity',
    '0x10',
    '1e3',
    '12,34',
    '1,23,456',
    '1.2.3',
    '9007199254740992',
    '0.1234567890123456789',
  ])('rejects %s without losing significant data', (text) => {
    expect(parseNumberText(text, 'en-US')).toEqual({ value: null, inputState: 'invalid' });
  });
  it.each(['-', '+', '12,', ','])('keeps %s incomplete', (text) => {
    expect(parseNumberText(text, 'pl-PL')).toEqual({ value: null, inputState: 'incomplete' });
  });
  it('distinguishes empty input and formats without grouping or rounding', () => {
    expect(parseNumberText('', 'pl-PL').inputState).toBe('empty');
    expect(formatNumberText(1234.567, 'pl-PL')).toBe('1234,567');
    expect(serializeNumber(0.0000001)).toBe('0.0000001');
    expect(serializeNumber(null)).toBe('');
  });
  it('validates without correcting the parsed value', () => {
    const parsed = parseNumberText('12.345', 'en-US');
    expect(validateNumber(parsed, { max: 10 })).toBe('max');
    expect(validateNumber(parsed, { min: 20 })).toBe('min');
    expect(validateNumber(parsed, { precision: 2 })).toBe('precision');
    expect(validateNumber(parsed, {})).toBe('step');
    expect(validateNumber(parsed, { step: 0.001 })).toBeNull();
    expect(parsed.value).toBe(12.345);
    expect(validateNumber(parseNumberText('0.0000000001', 'en-US'), {})).toBe('step');
    expect(nextNumberValue(valid(0.0000000001), -1, { step: 1 })).toBe(0);
  });
  it('takes ten decimal steps without drift and stops at the bound', () => {
    let value: number | null = 0;
    for (let index = 0; index < 10; index += 1) {
      value = nextNumberValue(valid(value), 1, { step: 0.1, max: 1 });
    }
    expect(value).toBe(1);
    expect(nextNumberValue(valid(value), 1, { step: 0.1, max: 1 })).toBe(1);
    expect(nextNumberValue(valid(0.35), 1, { min: 0.05, step: 0.1 })).toBe(0.45);
  });
  it('keeps values on a fractional grid from a nonzero min', () => {
    expect(validateNumber({ value: 10.3, inputState: 'valid' }, { min: 10, step: 0.1 })).toBeNull();
    expect(
      validateNumber({ value: 1000000.3, inputState: 'valid' }, { min: 1000000, step: 0.1 }),
    ).toBeNull();
    expect(validateNumber({ value: 10.35, inputState: 'valid' }, { min: 10, step: 0.1 })).toBe(
      'step',
    );
    expect(nextNumberValue(valid(10.2), 1, { min: 10, step: 0.1 })).toBe(10.3);
    expect(nextNumberValue(valid(10.3), -1, { min: 10, step: 0.1 })).toBe(10.2);
  });
  it('never steps over unfinished or malformed text', () => {
    for (const text of ['12,', '1,23,456']) {
      const parsed = parseNumberText(text, text === '12,' ? 'pl-PL' : 'en-US');
      expect(nextNumberValue(parsed, 1, {})).toBeNull();
      expect(boundNumberValue(parsed, 1, { max: 10 })).toBeUndefined();
    }
    expect(nextNumberValue(parseNumberText('', 'pl-PL'), 1, {})).toBe(1);
  });
  it('chooses the allowed value inside a bound for Home and End', () => {
    const current = valid(5);
    expect(boundNumberValue(current, -1, { min: 1, max: 10 })).toBe(1);
    expect(boundNumberValue(current, 1, { min: 1, max: 10 })).toBe(10);
    expect(boundNumberValue(current, 1, { min: 0, max: 12, step: 5 })).toBe(10);
    expect(boundNumberValue(current, -1, { max: 12, step: 5 })).toBeUndefined();
    expect(boundNumberValue(current, -1, { min: 0.005, precision: 2 })).toBeUndefined();
  });
  it.each([
    ['12', 12],
    ['-0.5', -0.5],
    [' 3 ', 3],
    ['', null],
    [' ', null],
    ['1e3', null],
    ['0x10', null],
    ['Infinity', null],
    ['1,5', null],
  ])('reads the canonical attribute %j as %s', (text, value) => {
    expect(parseSerializedNumber(text)).toBe(value);
  });
});

describe('localized calendar-date input', () => {
  it.each([
    ['31.12.2026', 'pl-PL', '2026-12-31'],
    ['12/31/2026', 'en-US', '2026-12-31'],
    ['31122026', 'pl-PL', '2026-12-31'],
    ['2026-12-31', 'pl-PL', '2026-12-31'],
    ['29.02.2024', 'pl-PL', '2024-02-29'],
    ['01.01.0001', 'pl-PL', '0001-01-01'],
    ['31.12.9999', 'pl-PL', '9999-12-31'],
    ['2026. 12. 31', 'hu-HU', '2026-12-31'],
    ['2026. 12. 31.', 'hu-HU', '2026-12-31'],
    ['31.12.2026', 'bg-BG', '2026-12-31'],
    [formatDateText('2026-12-31', 'bg-BG').slice(0, -1), 'bg-BG', '2026-12-31'],
  ])('parses %s with the %s grammar', (text, locale, value) => {
    expect(parseDateText(text, locale)).toEqual({ value, inputState: 'valid' });
  });
  it.each(['31.02.2026', '29.02.2025', '01.13.2026', '01.01.0000', 'January 1, 2026'])(
    'rejects %s without guessing',
    (text) => {
      expect(parseDateText(text, 'pl-PL').inputState).toBe('invalid');
    },
  );
  it.each(['3', '31.', '31.12.', '31.12.26'])('keeps %s incomplete', (text) => {
    expect(parseDateText(text, 'pl-PL')).toEqual({ value: '', inputState: 'incomplete' });
  });
  it('round-trips local digits and supplies a four-digit Gregorian mask', () => {
    for (const locale of ['pl-PL', 'en-US', 'ar-EG', 'fa-IR', 'th-TH', 'ja-JP']) {
      expect(parseDateText(formatDateText('2026-12-31', locale), locale).value).toBe('2026-12-31');
      expect(dateMaskPattern(locale).match(/0/g)).toHaveLength(8);
    }
  });
  it('checks inclusive bounds and both exclusion forms', () => {
    const parsed = parseDateText('2026-12-31', 'en-US');
    expect(validateDate(parsed, { min: '2026-12-31', max: '2026-12-31' })).toBeNull();
    expect(validateDate(parsed, { max: '2026-12-30' })).toBe('max');
    expect(validateDate(parsed, { min: '2027-01-01' })).toBe('min');
    expect(validateDate(parsed, { disabledDates: ['2026-12-31'] })).toBe('disabled');
    expect(validateDate(parsed, { disabledDates: (iso) => iso.endsWith('-31') })).toBe('disabled');
  });
});
