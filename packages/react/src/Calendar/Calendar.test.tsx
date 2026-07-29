import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { Calendar } from './Calendar.js';

afterEach(() => cleanup());

const day = (container: HTMLElement, iso: string) =>
  container.querySelector<HTMLButtonElement>(`button[data-iso="${iso}"]`);

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
});
