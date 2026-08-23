import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { Calendar } from './Calendar.js';

afterEach(() => cleanup());

const day = (container: HTMLElement, iso: string) =>
  container.querySelector<HTMLButtonElement>(`button[data-iso="${iso}"]`);

const zoom = (container: HTMLElement) =>
  container.querySelector<HTMLButtonElement>('.ui-calendar__zoom')!;

const heading = (container: HTMLElement) =>
  container.querySelector('.ui-calendar__month-label')!.textContent!.trim();

/** Month/year picker cells, in grid order. */
const pickerItems = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLButtonElement>('.ui-calendar__picker-item'));

const pickerItem = (container: HTMLElement, text: string) =>
  pickerItems(container).find((b) => b.textContent!.trim() === text);

const focusedItem = (container: HTMLElement) =>
  pickerItems(container)
    .find((b) => b.getAttribute('tabindex') === '0')!
    .textContent!.trim();

describe('Calendar', () => {
  it('renders a full July 2026 grid with adjacent-month padding', () => {
    const { container } = render(<Calendar today="2026-07-19" locale="pl-PL" />);
    expect(day(container, '2026-07-01')).not.toBeNull();
    expect(day(container, '2026-07-31')).not.toBeNull();
    expect(day(container, '2026-06-29')).not.toBeNull();
    expect(day(container, '2026-06-29')!.className).toContain('ui-calendar__day--outside');
    expect(container.querySelectorAll('[role="columnheader"]')).toHaveLength(7);
  });

  it('marks today with aria-current and renders the localized month label', () => {
    const { container } = render(<Calendar today="2026-07-19" locale="pl-PL" />);
    expect(day(container, '2026-07-19')!.getAttribute('aria-current')).toBe('date');
    expect(day(container, '2026-07-19')!.className).toContain('ui-calendar__day--today');
    expect(
      container.querySelector('.ui-calendar__month-label')!.textContent!.toLowerCase(),
    ).toContain('lipiec');
  });

  it('respects an explicit firstDayOfWeek over the locale default', () => {
    const { container } = render(<Calendar today="2026-07-19" locale="pl-PL" firstDayOfWeek={7} />);
    expect(day(container, '2026-06-28')).not.toBeNull();
  });

  it('single mode: marks the selected date', () => {
    const { container } = render(<Calendar today="2026-07-19" startDate="2026-07-08" />);
    const btn = day(container, '2026-07-08')!;
    expect(btn.className).toContain('ui-calendar__day--selected');
    expect(btn.closest('[role="gridcell"]')!.getAttribute('aria-selected')).toBe('true');
  });

  it('range mode: endpoint and in-range classes plus tint bands', () => {
    const { container } = render(
      <Calendar
        selectionMode="range"
        today="2026-07-19"
        startDate="2026-07-08"
        endDate="2026-07-14"
      />,
    );
    expect(day(container, '2026-07-08')!.className).toContain('ui-calendar__day--range-start');
    expect(day(container, '2026-07-14')!.className).toContain('ui-calendar__day--range-end');
    expect(day(container, '2026-07-10')!.className).toContain('ui-calendar__day--in-range');
    expect(container.querySelectorAll('.ui-calendar__band--start')).toHaveLength(1);
    expect(container.querySelectorAll('.ui-calendar__band--end')).toHaveLength(1);
    expect(container.querySelectorAll('.ui-calendar__band--full')).toHaveLength(5);
  });

  it('click calls onDateSelect with a proposal (controlled)', () => {
    const onDateSelect = vi.fn();
    const { container } = render(
      <Calendar today="2026-07-19" startDate="2026-07-08" onDateSelect={onDateSelect} />,
    );
    fireEvent.click(day(container, '2026-07-10')!);
    expect(onDateSelect).toHaveBeenCalledTimes(1);
    expect(onDateSelect).toHaveBeenCalledWith({
      date: '2026-07-10',
      startDate: '2026-07-10',
      endDate: null,
    });
  });

  it('range mode: second click completes the range, swapping when needed', () => {
    const onDateSelect = vi.fn();
    const { container } = render(
      <Calendar
        selectionMode="range"
        today="2026-07-19"
        startDate="2026-07-08"
        onDateSelect={onDateSelect}
      />,
    );
    fireEvent.click(day(container, '2026-07-14')!);
    expect(onDateSelect).toHaveBeenLastCalledWith({
      date: '2026-07-14',
      startDate: '2026-07-08',
      endDate: '2026-07-14',
    });
    fireEvent.click(day(container, '2026-07-02')!);
    expect(onDateSelect).toHaveBeenLastCalledWith({
      date: '2026-07-02',
      startDate: '2026-07-02',
      endDate: '2026-07-08',
    });
  });

  it('disabled dates (min/max, array, predicate) block onDateSelect', () => {
    const onDateSelect = vi.fn();
    const { container, rerender } = render(
      <Calendar
        today="2026-07-19"
        minDate="2026-07-05"
        maxDate="2026-07-25"
        disabledDates={['2026-07-15']}
        onDateSelect={onDateSelect}
      />,
    );
    expect(day(container, '2026-07-02')!.className).toContain('ui-calendar__day--disabled');
    expect(day(container, '2026-07-28')!.className).toContain('ui-calendar__day--disabled');
    expect(day(container, '2026-07-15')!.className).toContain('ui-calendar__day--disabled');
    fireEvent.click(day(container, '2026-07-15')!);
    expect(onDateSelect).not.toHaveBeenCalled();

    rerender(
      <Calendar
        today="2026-07-19"
        disabledDates={(iso: string) => iso === '2026-07-20'}
        onDateSelect={onDateSelect}
      />,
    );
    expect(day(container, '2026-07-20')!.className).toContain('ui-calendar__day--disabled');
  });

  it('roving tabindex: exactly one focusable day, arrow keys move it', () => {
    const { container } = render(<Calendar today="2026-07-19" startDate="2026-07-08" />);
    const focusable = container.querySelectorAll('button.ui-calendar__day[tabindex="0"]');
    expect(focusable).toHaveLength(1);
    expect((focusable[0] as HTMLElement).dataset.iso).toBe('2026-07-08');

    fireEvent.keyDown(container.querySelector('.ui-calendar__grid')!, { key: 'ArrowRight' });
    expect(day(container, '2026-07-09')!.getAttribute('tabindex')).toBe('0');
    expect(day(container, '2026-07-08')!.getAttribute('tabindex')).toBe('-1');
  });

  it('keyboard navigation across a month boundary switches the view', () => {
    const onMonthChange = vi.fn();
    const { container } = render(
      <Calendar today="2026-07-19" startDate="2026-07-31" onMonthChange={onMonthChange} />,
    );
    fireEvent.keyDown(container.querySelector('.ui-calendar__grid')!, { key: 'ArrowRight' });
    expect(onMonthChange).toHaveBeenCalledWith({ year: 2026, month: 8 });
    expect(day(container, '2026-08-01')!.getAttribute('tabindex')).toBe('0');
  });

  it('header navigation calls onMonthChange and re-renders the label', () => {
    const onMonthChange = vi.fn();
    const { container, getByLabelText } = render(
      <Calendar today="2026-07-19" locale="pl-PL" onMonthChange={onMonthChange} />,
    );
    fireEvent.click(getByLabelText('Next month'));
    expect(onMonthChange).toHaveBeenCalledWith({ year: 2026, month: 8 });
    expect(
      container.querySelector('.ui-calendar__month-label')!.textContent!.toLowerCase(),
    ).toContain('sierpie');
  });

  it('forwards className and style to the root, aria-* to the grid', () => {
    const { container } = render(
      <Calendar
        today="2026-07-19"
        className="custom"
        style={{ marginTop: 4 }}
        aria-describedby="hint-1"
      />,
    );
    const root = container.querySelector('.ui-calendar') as HTMLElement;
    expect(root.className).toContain('custom');
    expect(root.style.marginTop).toBe('4px');
    expect(container.querySelector('[role="grid"]')!.getAttribute('aria-describedby')).toBe(
      'hint-1',
    );
  });
  describe('month / year picker', () => {
    it('the heading opens the month grid, then the year grid', () => {
      const { container } = render(<Calendar today="2026-07-19" locale="en-US" />);
      expect(heading(container)).toContain('July');

      fireEvent.click(zoom(container));
      expect(pickerItems(container)).toHaveLength(12);
      expect(heading(container)).toBe('2026');

      fireEvent.click(zoom(container));
      expect(pickerItems(container)).toHaveLength(24);
      // Pages are aligned to fixed 24-year blocks: 2016-2039 holds 2026.
      expect(pickerItems(container)[0].textContent).toBe('2016');
      expect(heading(container)).toContain('2016');
      expect(heading(container)).toContain('2039');
      // Top level — the heading is a plain label again.
      expect(container.querySelector('.ui-calendar__zoom')).toBeNull();
    });

    it('picking a year then a month lands on that month of the day grid', () => {
      const onMonthChange = vi.fn();
      const { container, getByLabelText } = render(
        <Calendar today="2026-07-19" locale="en-US" onMonthChange={onMonthChange} />,
      );
      fireEvent.click(zoom(container));
      fireEvent.click(zoom(container));

      // Two pages back reaches 1968-1991.
      fireEvent.click(getByLabelText('Previous years'));
      fireEvent.click(getByLabelText('Previous years'));
      fireEvent.click(pickerItem(container, '1987')!);
      expect(heading(container)).toBe('1987');
      expect(onMonthChange).toHaveBeenCalledWith({ year: 1987, month: 7 });

      fireEvent.click(pickerItem(container, 'Oct')!);
      expect(onMonthChange).toHaveBeenCalledWith({ year: 1987, month: 10 });
      expect(day(container, '1987-10-01')).not.toBeNull();
      expect(heading(container)).toContain('October');
      expect(heading(container)).toContain('1987');
    });

    it('keeps the roving day focus inside the month picked', () => {
      const { container } = render(<Calendar today="2026-07-31" locale="en-US" />);
      fireEvent.click(zoom(container));
      fireEvent.click(pickerItem(container, 'Feb')!);
      // Feb has no 31st — the focus clamps to the last day of the month.
      expect(day(container, '2026-02-28')!.getAttribute('tabindex')).toBe('0');
    });

    it('marks the selected month and year, and disables what min/max exclude', () => {
      const { container } = render(
        <Calendar
          today="2026-07-19"
          locale="en-US"
          startDate="2026-07-08"
          minDate="2026-03-01"
          maxDate="2026-09-30"
        />,
      );
      fireEvent.click(zoom(container));
      expect(pickerItem(container, 'Jul')!.className).toContain(
        'ui-calendar__picker-item--selected',
      );
      expect(pickerItem(container, 'Feb')!.className).toContain(
        'ui-calendar__picker-item--disabled',
      );
      expect(pickerItem(container, 'Oct')!.className).toContain(
        'ui-calendar__picker-item--disabled',
      );

      fireEvent.click(pickerItem(container, 'Feb')!);
      // Still on the month grid — a disabled month is not a selection.
      expect(pickerItems(container)).toHaveLength(12);

      fireEvent.click(zoom(container));
      expect(pickerItem(container, '2026')!.className).toContain(
        'ui-calendar__picker-item--selected',
      );
      expect(pickerItem(container, '2025')!.className).toContain(
        'ui-calendar__picker-item--disabled',
      );
    });

    it('arrow keys rove the month grid without leaving the year', () => {
      const { container } = render(<Calendar today="2026-07-19" locale="en-US" />);
      fireEvent.click(zoom(container));
      const grid = container.querySelector('.ui-calendar__picker')!;
      expect(focusedItem(container)).toBe('Jul');

      fireEvent.keyDown(grid, { key: 'ArrowDown' });
      expect(focusedItem(container)).toBe('Oct');

      fireEvent.keyDown(grid, { key: 'End' });
      expect(focusedItem(container)).toBe('Dec');

      // December + 1 would be January of the next year — the roving focus stays put.
      fireEvent.keyDown(grid, { key: 'ArrowRight' });
      expect(focusedItem(container)).toBe('Dec');
    });

    it('arrow keys past a year-grid edge turn the page', () => {
      const { container } = render(<Calendar today="2026-07-19" locale="en-US" />);
      fireEvent.click(zoom(container));
      fireEvent.click(zoom(container));

      const grid = container.querySelector('.ui-calendar__picker')!;
      fireEvent.keyDown(grid, { key: 'Home' });
      fireEvent.keyDown(grid, { key: 'ArrowLeft' });
      expect(pickerItems(container)[0].textContent).toBe('1992');
      expect(focusedItem(container)).toBe('2015');
    });

    it('the header chevrons step by year, then by page', () => {
      const onMonthChange = vi.fn();
      const { container, getByLabelText } = render(
        <Calendar today="2026-07-19" locale="en-US" onMonthChange={onMonthChange} />,
      );
      fireEvent.click(zoom(container));
      fireEvent.click(getByLabelText('Next year'));
      expect(onMonthChange).toHaveBeenCalledWith({ year: 2027, month: 7 });
      expect(heading(container)).toBe('2027');

      fireEvent.click(zoom(container));
      fireEvent.click(getByLabelText('Next years'));
      expect(pickerItems(container)[0].textContent).toBe('2040');
    });

    it('Escape steps one level back down', () => {
      const { container } = render(<Calendar today="2026-07-19" locale="en-US" />);
      fireEvent.click(zoom(container));
      fireEvent.click(zoom(container));

      const root = container.querySelector('.ui-calendar')!;
      fireEvent.keyDown(root, { key: 'Escape' });
      expect(pickerItems(container)).toHaveLength(12);

      fireEvent.keyDown(root, { key: 'Escape' });
      expect(pickerItems(container)).toHaveLength(0);
      expect(day(container, '2026-07-19')).not.toBeNull();
    });

    it('the picker grids expose the same ARIA pattern as the day grid', () => {
      const { container } = render(
        <Calendar today="2026-07-19" locale="en-US" startDate="2026-07-08" />,
      );
      expect(zoom(container).getAttribute('aria-label')).toBe('July 2026, choose month and year');

      fireEvent.click(zoom(container));
      const grid = container.querySelector('.ui-calendar__picker')!;
      expect(grid.getAttribute('role')).toBe('grid');
      expect(grid.getAttribute('aria-labelledby')).toBe(
        container.querySelector('.ui-calendar__month-label')!.id,
      );
      expect(grid.querySelectorAll('[role="row"]')).toHaveLength(4);
      expect(pickerItem(container, 'Jul')!.getAttribute('aria-label')).toBe('July 2026');
      expect(pickerItem(container, 'Jul')!.getAttribute('aria-current')).toBe('date');
      expect(zoom(container).getAttribute('aria-label')).toBe('2026, choose year');
    });
  });
});
