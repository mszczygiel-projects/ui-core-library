import { describe, expect, it } from 'vitest';

import {
  type CalendarContext,
  type CalendarKeyOptions,
  calendarModel,
  dayLabel,
  firstDayOfWeek,
  focusInMonth,
  formatIsoMonth,
  formatIsoRange,
  fullDateLabel,
  initialFocus,
  isDateDisabled,
  isMonthDisabled,
  isYearDisabled,
  monthLabel,
  monthWeeks,
  monthYearLabel,
  nextFocusedDate,
  parseIsoMonth,
  parseIsoRange,
  pickCell,
  selectedDate,
  selectionOf,
  shiftMonth,
  stepDate,
  weekdayLabels,
  weekdayOrder,
  yearPage,
  yearPageLabel,
  zoomIn,
  zoomOut,
} from './calendar-grid.ts';

describe('months', () => {
  it('reads and writes ISO months of the years 0001 to 9999', () => {
    expect(parseIsoMonth('2026-07')).toEqual({ year: 2026, month: 7 });
    expect(parseIsoMonth('2026-13')).toBeNull();
    expect(parseIsoMonth('0000-01')).toBeNull();
    expect(parseIsoMonth('2026-7')).toBeNull();
    expect(formatIsoMonth({ year: 5, month: 3 })).toBe('0005-03');
  });

  it('shifts a month and stops at the ends of the years 0001 to 9999', () => {
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftMonth('2026-01', -13)).toBe('2024-12');
    expect(shiftMonth('0001-01', -1)).toBeNull();
    expect(shiftMonth('9999-12', 1)).toBeNull();
  });
});

describe('weeks', () => {
  it('orders the weekdays from the first day of the week', () => {
    expect(weekdayOrder(1)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(weekdayOrder(7)).toEqual([7, 1, 2, 3, 4, 5, 6]);
    expect(weekdayOrder(0)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('takes the first day of the week from the week data of the locale', () => {
    expect(firstDayOfWeek('pl-PL')).toBe(1);
    expect(firstDayOfWeek('en-US')).toBe(7);
    expect(firstDayOfWeek('not a locale')).toBe(1);
  });

  it('fills the first and last week of July 2026 with the months around it', () => {
    const weeks = monthWeeks('2026-07', 1);
    expect(weeks).toHaveLength(5);
    expect(weeks[0]).toEqual([
      '2026-06-29',
      '2026-06-30',
      '2026-07-01',
      '2026-07-02',
      '2026-07-03',
      '2026-07-04',
      '2026-07-05',
    ]);
    expect(weeks[4]?.[6]).toBe('2026-08-02');
  });

  it('starts every week on the given day', () => {
    const weeks = monthWeeks('2026-02', 7);
    expect(weeks[0]?.[0]).toBe('2026-02-01');
    expect(weeks).toHaveLength(4);
    expect(weeks.flat()).toHaveLength(28);
  });

  it('leaves the days before 0001-01-01 empty', () => {
    expect(monthWeeks('0001-01', 7)[0]?.[0]).toBe('');
    expect(monthWeeks('0001-01', 7)[0]?.[1]).toBe('0001-01-01');
  });
});

describe('years', () => {
  it('pages years in fixed blocks of 24', () => {
    expect(yearPage(2026)[0]).toBe(2016);
    expect(yearPage(2039)).toEqual(yearPage(2016));
    expect(yearPage(1991)[0]).toBe(1968);
    expect(yearPage(10)[0]).toBe(1);
    expect(yearPage(9990).at(-1)).toBe(9999);
  });
});

describe('constraints', () => {
  it('disables days as DateField validates them', () => {
    const constraints = { min: '2026-07-05', max: '2026-07-20', disabledDates: ['2026-07-10'] };
    expect(isDateDisabled('2026-07-04', constraints)).toBe(true);
    expect(isDateDisabled('2026-07-05', constraints)).toBe(false);
    expect(isDateDisabled('2026-07-10', constraints)).toBe(true);
    expect(isDateDisabled('2026-07-21', constraints)).toBe(true);
    expect(isDateDisabled('2026-07-11', { disabledDates: (date) => date.endsWith('11') })).toBe(
      true,
    );
    expect(isDateDisabled('2026-07-11', { min: '2026-08-01', max: '2026-07-01' })).toBe(true);
  });

  it('disables a month or a year only when min and max rule out all of it', () => {
    const constraints = { min: '2026-07-31', max: '2027-01-01', disabledDates: () => true };
    expect(isMonthDisabled('2026-06', constraints)).toBe(true);
    expect(isMonthDisabled('2026-07', constraints)).toBe(false);
    expect(isMonthDisabled('2027-01', constraints)).toBe(false);
    expect(isMonthDisabled('2027-02', constraints)).toBe(true);
    expect(isYearDisabled(2025, constraints)).toBe(true);
    expect(isYearDisabled(2027, constraints)).toBe(false);
    expect(isYearDisabled(0, constraints)).toBe(true);
  });
});

describe('ranges', () => {
  it('reads an ISO interval and refuses one that ends before it starts', () => {
    expect(parseIsoRange('2026-07-08/2026-07-14')).toEqual({
      start: '2026-07-08',
      end: '2026-07-14',
    });
    expect(parseIsoRange('2026-07-14/2026-07-08')).toBeNull();
    expect(parseIsoRange('2026-07-08')).toBeNull();
    expect(parseIsoRange('2026-07-08/2026-07-14/2026-07-20')).toBeNull();
  });

  it('orders the ends of a range', () => {
    expect(formatIsoRange('2026-07-14', '2026-07-08')).toBe('2026-07-08/2026-07-14');
  });

  it('marks the ends and the middle of a range', () => {
    const context = { value: '2026-07-08/2026-07-10', range: true };
    expect(selectionOf('2026-07-07', context)).toBe('none');
    expect(selectionOf('2026-07-08', context)).toBe('start');
    expect(selectionOf('2026-07-09', context)).toBe('middle');
    expect(selectionOf('2026-07-10', context)).toBe('end');
    expect(selectionOf('2026-07-08', { value: '2026-07-08/2026-07-08', range: true })).toBe(
      'selected',
    );
  });

  it('shows only the first date of a range in progress', () => {
    const context = { value: '2026-07-08/2026-07-10', range: true, anchor: '2026-07-20' };
    expect(selectionOf('2026-07-09', context)).toBe('none');
    expect(selectionOf('2026-07-20', context)).toBe('selected');
  });

  it('opens on the date of the value or the start of its range', () => {
    expect(selectedDate('2026-07-08', false)).toBe('2026-07-08');
    expect(selectedDate('2026-07-08/2026-07-10', true)).toBe('2026-07-08');
    expect(selectedDate('', false)).toBeUndefined();
  });
});

describe('nextFocusedDate', () => {
  const days: CalendarKeyOptions = {
    view: 'days',
    direction: 'ltr',
    firstDayOfWeek: 1,
    shiftKey: false,
  };

  it('moves by days, weeks and months in the day grid', () => {
    expect(nextFocusedDate('ArrowRight', '2026-07-31', days)).toBe('2026-08-01');
    expect(nextFocusedDate('ArrowLeft', '2026-07-01', days)).toBe('2026-06-30');
    expect(nextFocusedDate('ArrowDown', '2026-07-29', days)).toBe('2026-08-05');
    expect(nextFocusedDate('ArrowUp', '2026-07-01', days)).toBe('2026-06-24');
    expect(nextFocusedDate('PageDown', '2026-01-31', days)).toBe('2026-02-28');
    expect(nextFocusedDate('PageUp', '2026-07-08', days)).toBe('2026-06-08');
    expect(nextFocusedDate('Enter', '2026-07-08', days)).toBeUndefined();
  });

  it('moves by a year with Shift and Page Up or Page Down', () => {
    const shifted = { ...days, shiftKey: true };
    expect(nextFocusedDate('PageDown', '2024-02-29', shifted)).toBe('2025-02-28');
    expect(nextFocusedDate('PageUp', '2026-07-08', shifted)).toBe('2025-07-08');
  });

  it('jumps to the edges of the week of the locale', () => {
    // 2026-07-08 is a Wednesday.
    expect(nextFocusedDate('Home', '2026-07-08', days)).toBe('2026-07-06');
    expect(nextFocusedDate('End', '2026-07-08', days)).toBe('2026-07-12');
    const sunday = { ...days, firstDayOfWeek: 7 };
    expect(nextFocusedDate('Home', '2026-07-08', sunday)).toBe('2026-07-05');
    expect(nextFocusedDate('End', '2026-07-08', sunday)).toBe('2026-07-11');
  });

  it('turns the horizontal arrows in right-to-left text', () => {
    const rtl = { ...days, direction: 'rtl' as const };
    expect(nextFocusedDate('ArrowLeft', '2026-07-08', rtl)).toBe('2026-07-09');
    expect(nextFocusedDate('ArrowRight', '2026-07-08', rtl)).toBe('2026-07-07');
  });

  it('keeps the date at the ends of the years 0001 to 9999', () => {
    expect(nextFocusedDate('ArrowLeft', '0001-01-01', days)).toBe('0001-01-01');
    expect(nextFocusedDate('PageDown', '9999-12-31', days)).toBe('9999-12-31');
  });

  it('moves months within their year in the month grid', () => {
    const months = { ...days, view: 'months' as const };
    expect(nextFocusedDate('ArrowRight', '2026-07-31', months)).toBe('2026-08-31');
    expect(nextFocusedDate('ArrowRight', '2026-12-15', months)).toBe('2026-12-15');
    expect(nextFocusedDate('ArrowLeft', '2026-01-15', months)).toBe('2026-01-15');
    expect(nextFocusedDate('ArrowDown', '2026-08-31', months)).toBe('2026-11-30');
    expect(nextFocusedDate('ArrowDown', '2026-11-15', months)).toBe('2026-11-15');
    expect(nextFocusedDate('Home', '2026-08-15', months)).toBe('2026-07-15');
    expect(nextFocusedDate('End', '2026-07-15', months)).toBe('2026-09-15');
    expect(nextFocusedDate('PageDown', '2026-07-15', months)).toBe('2027-07-15');
  });

  it('moves years across pages in the year grid', () => {
    const years = { ...days, view: 'years' as const };
    expect(nextFocusedDate('ArrowRight', '2039-07-15', years)).toBe('2040-07-15');
    expect(nextFocusedDate('ArrowUp', '2017-07-15', years)).toBe('2013-07-15');
    expect(nextFocusedDate('Home', '2026-07-15', years)).toBe('2024-07-15');
    expect(nextFocusedDate('End', '2026-07-15', years)).toBe('2027-07-15');
    expect(nextFocusedDate('PageUp', '2024-02-29', years)).toBe('2000-02-29');
  });
});

describe('labels', () => {
  it('names months, days and weekdays in the locale, in UTC whatever the machine', () => {
    expect(monthYearLabel('2026-07', 'en-US')).toBe('July 2026');
    expect(monthYearLabel('2026-07', 'pl-PL')).toBe('lipiec 2026');
    expect(monthLabel('2026-07', 'en-US')).toBe('Jul');
    expect(dayLabel('2026-07-08', 'en-US')).toBe('8');
    expect(dayLabel('2026-07-08', 'ar-EG')).toBe('٨');
    expect(fullDateLabel('2026-07-08', 'en-US')).toBe('Wednesday, July 8, 2026');
    expect(weekdayLabels('en-US', 7)[0]).toEqual({ short: 'Sun', long: 'Sunday' });
    expect(weekdayLabels('pl-PL', 1)[0]?.long).toBe('poniedziałek');
  });

  it('names a page of years by its first and last year', () => {
    expect(yearPageLabel(2026, 'en-US')).toMatch(/^2016\s?–\s?2039$/);
  });
});

describe('calendarModel', () => {
  const context: CalendarContext = {
    value: '2026-07-08',
    range: false,
    constraints: { min: '2026-06-15', max: '2026-08-20', disabledDates: ['2026-07-10'] },
    locale: 'en-US',
    firstDayOfWeek: 1,
    today: '2026-07-19',
  };

  it('describes the days of the focused month', () => {
    const model = calendarModel({ view: 'days', focused: '2026-07-08' }, context);
    expect(model.heading).toBe('July 2026');
    expect(model.zoom).toEqual({ label: 'chooseMonth', text: 'July 2026' });
    expect(model.weekdays.map((weekday) => weekday.short)).toEqual([
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
      'Sun',
    ]);
    const cells = model.rows.flat();
    const cell = (date: string) => cells.find((candidate) => candidate.date === date);
    expect(cell('2026-06-29')).toMatchObject({ outside: true, disabled: false });
    expect(cell('2026-07-08')).toMatchObject({
      selection: 'selected',
      focusable: true,
      name: 'Wednesday, July 8, 2026',
    });
    expect(cell('2026-07-10')?.disabled).toBe(true);
    expect(cell('2026-07-19')?.current).toBe(true);
    expect(cells.filter((candidate) => candidate.focusable)).toHaveLength(1);
  });

  it('disables a step to a month that min or max rules out', () => {
    expect(calendarModel({ view: 'days', focused: '2026-06-20' }, context).previous).toEqual({
      label: 'previousMonth',
      disabled: true,
    });
    expect(calendarModel({ view: 'days', focused: '2026-08-20' }, context).next.disabled).toBe(
      true,
    );
    expect(calendarModel({ view: 'days', focused: '2026-07-20' }, context).next.disabled).toBe(
      false,
    );
  });

  it('describes the months of the focused year in rows of three', () => {
    const model = calendarModel({ view: 'months', focused: '2026-07-31' }, context);
    expect(model.heading).toBe('2026');
    expect(model.rows).toHaveLength(4);
    const cells = model.rows.flat();
    expect(cells[1]).toMatchObject({ label: 'Feb', date: '2026-02-28', disabled: true });
    expect(cells[6]).toMatchObject({ selection: 'selected', current: true, focusable: true });
    expect(model.previous).toEqual({ label: 'previousYear', disabled: true });
  });

  it('describes a page of years in rows of four, with a heading that opens nothing', () => {
    const model = calendarModel({ view: 'years', focused: '2026-07-08' }, context);
    expect(model.zoom).toBeNull();
    expect(model.rows).toHaveLength(6);
    expect(model.rows[0]?.[0]).toMatchObject({ label: '2016', disabled: true });
    expect(model.rows.flat().find((cell) => cell.focusable)?.date).toBe('2026-07-08');
    expect(model.previous.disabled).toBe(true);
    expect(model.next.disabled).toBe(true);
  });
});

describe('the state of a calendar', () => {
  it('focuses the value, then today, then the first day of the month', () => {
    expect(initialFocus('2026-07-08', false, undefined, '2026-01-01')).toBe('2026-07-08');
    expect(initialFocus('', false, undefined, '2026-01-01')).toBe('2026-01-01');
    expect(initialFocus('', false, '2026-03', '2026-01-01')).toBe('2026-03-01');
    expect(initialFocus('2026-03-09/2026-03-12', true, '2026-03', undefined)).toBe('2026-03-09');
    expect(initialFocus('', false, undefined, undefined)).toBeUndefined();
  });

  it('keeps the day when a month is set', () => {
    expect(focusInMonth('2026-01-31', '2026-02')).toBe('2026-02-28');
    expect(focusInMonth('2026-01-31', 'not a month')).toBe('2026-01-31');
  });

  it('steps by a month, a year or a page of years', () => {
    expect(stepDate('days', '2026-03-31', -1)).toBe('2026-02-28');
    expect(stepDate('months', '2026-03-31', 1)).toBe('2027-03-31');
    expect(stepDate('years', '2026-03-31', 1)).toBe('2050-03-31');
    expect(stepDate('days', '0001-01-15', -1)).toBeNull();
  });

  it('picks a date, a range in two steps, a month and a year', () => {
    const days = { view: 'days' as const, focused: '2026-07-08' };
    expect(pickCell(days, { date: '2026-07-09', disabled: false }, false)).toEqual({
      state: { view: 'days', focused: '2026-07-09' },
      value: '2026-07-09',
    });
    expect(pickCell(days, { date: '2026-07-09', disabled: true }, false)).toBeUndefined();
    const started = pickCell(days, { date: '2026-07-14', disabled: false }, true);
    expect(started).toEqual({
      state: { view: 'days', focused: '2026-07-14', anchor: '2026-07-14' },
    });
    expect(
      started && pickCell(started.state, { date: '2026-07-08', disabled: false }, true)?.value,
    ).toBe('2026-07-08/2026-07-14');
    expect(
      pickCell(
        { view: 'months', focused: '2026-07-08' },
        { date: '2026-03-08', disabled: false },
        false,
      ),
    ).toEqual({ state: { view: 'days', focused: '2026-03-08' } });
    expect(
      pickCell(
        { view: 'years', focused: '2026-07-08' },
        { date: '2030-07-08', disabled: false },
        false,
      ),
    ).toEqual({ state: { view: 'months', focused: '2030-07-08' } });
  });

  it('zooms out from the days to the years and back in', () => {
    expect(zoomOut('days')).toBe('months');
    expect(zoomOut('months')).toBe('years');
    expect(zoomIn('years')).toBe('months');
    expect(zoomIn('months')).toBe('days');
    expect(zoomIn('days')).toBeUndefined();
  });
});
