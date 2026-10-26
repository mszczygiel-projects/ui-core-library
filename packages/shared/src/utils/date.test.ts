import { describe, expect, it } from 'vitest';

import {
  addDays,
  addMonths,
  daysInMonth,
  formatIsoDate,
  isoDateAt,
  isoWeekday,
  parseIsoDate,
} from './date.ts';

describe('parseIsoDate', () => {
  it('reads the parts of a date', () => {
    expect(parseIsoDate('2026-10-16')).toEqual({ year: 2026, month: 10, day: 16 });
  });

  it('reads every year from 0001 to 9999, those before 100 included', () => {
    expect(parseIsoDate('0001-01-01')).toEqual({ year: 1, month: 1, day: 1 });
    expect(parseIsoDate('0050-01-01')).toEqual({ year: 50, month: 1, day: 1 });
    expect(parseIsoDate('0048-02-29')).toEqual({ year: 48, month: 2, day: 29 });
    expect(parseIsoDate('9999-12-31')).toEqual({ year: 9999, month: 12, day: 31 });
    expect(parseIsoDate('0000-01-01')).toBeNull();
  });

  it('refuses days that do not exist', () => {
    expect(parseIsoDate('2024-02-29')).not.toBeNull();
    expect(parseIsoDate('2000-02-29')).not.toBeNull();
    for (const text of [
      '2026-02-29',
      '1900-02-29',
      '2026-04-31',
      '2026-13-01',
      '2026-00-10',
      '2026-01-00',
    ]) {
      expect(parseIsoDate(text), text).toBeNull();
    }
  });

  it('reads only the ISO form', () => {
    for (const text of [
      '2026-1-5',
      ' 2026-01-05',
      '2026-01-05T00:00',
      '+002026-01-05',
      '20260105',
      '2026/01/05',
      '',
    ]) {
      expect(parseIsoDate(text), text).toBeNull();
    }
  });
});

describe('formatIsoDate', () => {
  it('writes four digits for the year and two for the month and the day', () => {
    expect(formatIsoDate({ year: 48, month: 2, day: 9 })).toBe('0048-02-09');
    expect(formatIsoDate({ year: 2026, month: 10, day: 16 })).toBe('2026-10-16');
  });

  it('refuses parts that are no date of the years 0001 to 9999', () => {
    expect(() => formatIsoDate({ year: 2026, month: 2, day: 30 })).toThrow(RangeError);
    expect(() => formatIsoDate({ year: 0, month: 1, day: 1 })).toThrow(RangeError);
    expect(() => formatIsoDate({ year: 10000, month: 1, day: 1 })).toThrow(RangeError);
    expect(() => formatIsoDate({ year: 2026, month: 1.5, day: 1 })).toThrow(RangeError);
  });
});

describe('daysInMonth', () => {
  it('gives February 29 days in leap years, the year 0 included', () => {
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2023, 2)).toBe(28);
    expect(daysInMonth(2000, 2)).toBe(29);
    expect(daysInMonth(1900, 2)).toBe(28);
    expect(daysInMonth(0, 2)).toBe(29);
  });

  it('gives the other months 30 or 31 days', () => {
    expect(daysInMonth(2026, 4)).toBe(30);
    expect(daysInMonth(2026, 12)).toBe(31);
  });

  it('refuses a month outside 1 to 12', () => {
    expect(() => daysInMonth(2026, 0)).toThrow(RangeError);
    expect(() => daysInMonth(2026, 13)).toThrow(RangeError);
    expect(() => daysInMonth(2026.5, 1)).toThrow(RangeError);
  });
});

describe('addDays', () => {
  it('adds and subtracts days across months, years and leap days', () => {
    expect(addDays('2026-10-16', 1)).toBe('2026-10-17');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDays('2023-02-28', 1)).toBe('2023-03-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
    expect(addDays('2000-01-01', 36525)).toBe('2100-01-01');
    expect(addDays('0048-12-31', 1)).toBe('0049-01-01');
  });

  it('agrees with the UTC calendar of the platform on every day of three centuries', () => {
    const mismatches: string[] = [];
    let date = '1900-01-01';
    for (let day = 0; day < 109_574; day++) {
      const expected = new Date(Date.UTC(1900, 0, 1 + day)).toISOString().slice(0, 10);
      if (date !== expected) {
        mismatches.push(`${date} is not ${expected}`);
      }
      date = addDays(date, 1);
    }
    expect(mismatches).toEqual([]);
  });

  it('refuses a result outside the years 0001 to 9999, and a date that is not ISO', () => {
    expect(() => addDays('9999-12-31', 1)).toThrow(RangeError);
    expect(() => addDays('0001-01-01', -1)).toThrow(RangeError);
    expect(() => addDays('2026-02-30', 1)).toThrow(RangeError);
    expect(() => addDays('2026-10-16', 0.5)).toThrow(RangeError);
  });
});

describe('addMonths', () => {
  it('keeps the day, or takes the last day of a shorter month', () => {
    expect(addMonths('2026-01-15', 1)).toBe('2026-02-15');
    expect(addMonths('2024-01-31', 1)).toBe('2024-02-29');
    expect(addMonths('2023-01-31', 1)).toBe('2023-02-28');
    expect(addMonths('2026-03-31', -1)).toBe('2026-02-28');
    expect(addMonths('2026-10-16', 12)).toBe('2027-10-16');
    expect(addMonths('2026-10-16', -22)).toBe('2024-12-16');
  });

  it('refuses a result outside the years 0001 to 9999', () => {
    expect(() => addMonths('9999-12-01', 1)).toThrow(RangeError);
    expect(() => addMonths('0001-01-31', -1)).toThrow(RangeError);
    expect(() => addMonths('2026-10-16', 1.5)).toThrow(RangeError);
  });
});

describe('isoWeekday', () => {
  it('counts from 1 for Monday to 7 for Sunday', () => {
    expect(isoWeekday('2026-10-16')).toBe(5);
    expect(isoWeekday('2026-10-18')).toBe(7);
    expect(isoWeekday('2026-10-19')).toBe(1);
    expect(isoWeekday('1970-01-01')).toBe(4);
    expect(isoWeekday('0001-01-01')).toBe(1);
  });
});

describe('isoDateAt', () => {
  const morning = new Date('2026-01-01T09:00:00Z');

  it('gives the date of an instant in a time zone', () => {
    expect(isoDateAt(morning, 'UTC')).toBe('2026-01-01');
    expect(isoDateAt(morning, 'Pacific/Kiritimati')).toBe('2026-01-01');
    expect(isoDateAt(morning, 'Pacific/Pago_Pago')).toBe('2025-12-31');
    expect(isoDateAt(new Date('2026-01-01T11:00:00Z'), 'Pacific/Kiritimati')).toBe('2026-01-02');
  });

  it('gives the same dates whatever the time zone of the machine', () => {
    const machineZone = process.env['TZ'];
    try {
      const results = ['Pacific/Kiritimati', 'Pacific/Pago_Pago', 'UTC'].map((zone) => {
        process.env['TZ'] = zone;
        return [
          isoDateAt(morning, 'Europe/Warsaw'),
          addDays('2026-03-28', 2),
          addMonths('2026-10-25', 1),
          isoWeekday('2026-03-29'),
        ].join();
      });
      expect(new Set(results).size).toBe(1);
    } finally {
      if (machineZone === undefined) {
        Reflect.deleteProperty(process.env, 'TZ');
      } else {
        process.env['TZ'] = machineZone;
      }
    }
  });

  it('refuses an unknown time zone and an invalid instant', () => {
    expect(() => isoDateAt(morning, 'Mars/Olympus_Mons')).toThrow(RangeError);
    expect(() => isoDateAt(new Date(Number.NaN), 'UTC')).toThrow(RangeError);
  });

  it('refuses an instant whose date in the time zone is outside the years 0001 to 9999', () => {
    expect(() => isoDateAt(new Date('0000-06-01T00:00:00Z'), 'UTC')).toThrow(RangeError);
    expect(() => isoDateAt(new Date('-000005-06-01T00:00:00Z'), 'UTC')).toThrow(RangeError);
    const firstMorning = new Date('0001-01-01T03:00:00Z');
    expect(isoDateAt(firstMorning, 'UTC')).toBe('0001-01-01');
    expect(() => isoDateAt(firstMorning, 'America/New_York')).toThrow(RangeError);
    const lastNight = new Date('9999-12-31T23:00:00Z');
    expect(isoDateAt(lastNight, 'UTC')).toBe('9999-12-31');
    expect(() => isoDateAt(lastNight, 'Pacific/Kiritimati')).toThrow(RangeError);
  });
});
