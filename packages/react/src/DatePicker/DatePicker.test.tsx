import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { DatePicker } from './DatePicker.js';

afterEach(() => cleanup());

const day = (container: HTMLElement, iso: string) =>
  container.querySelector<HTMLButtonElement>(`button[data-iso="${iso}"]`);

describe('DatePicker', () => {
  it('renders the anchor and calendar inside a popover panel', () => {
    const { container, getByText } = render(
      <DatePicker open today="2026-07-19" anchor={<button>Pick</button>} />,
    );
    expect(getByText('Pick')).not.toBeNull();
    expect(container.querySelector('.ui-popover')).not.toBeNull();
    expect(container.querySelector('.ui-calendar')).not.toBeNull();
    expect(container.querySelector('.ui-date-picker__footer')).toBeNull();
  });

  it('single mode: day click commits via onDateChange and requests close', () => {
    const onDateChange = vi.fn();
    const onOpenChange = vi.fn();
    const { container } = render(
      <DatePicker
        open
        today="2026-07-19"
        startDate="2026-07-08"
        onDateChange={onDateChange}
        onOpenChange={onOpenChange}
      />,
    );
    fireEvent.click(day(container, '2026-07-10')!);
    expect(onDateChange).toHaveBeenCalledTimes(1);
    expect(onDateChange).toHaveBeenCalledWith({ date: '2026-07-10' });
    expect(onOpenChange).toHaveBeenCalledWith({ open: false, reason: 'select' });
  });

  it('range mode: renders Clear/Apply footer with custom labels', () => {
    const { container } = render(
      <DatePicker
        selectionMode="range"
        open
        today="2026-07-19"
        clearLabel="Wyczyść"
        applyLabel="Zastosuj"
      />,
    );
    const buttons = container.querySelectorAll('.ui-date-picker__footer button');
    expect(buttons).toHaveLength(2);
    expect(buttons[0].textContent).toContain('Wyczyść');
    expect(buttons[1].textContent).toContain('Zastosuj');
    expect(buttons[0].className).toContain('ui-button--ghost');
    expect(buttons[1].className).toContain('ui-button--primary');
  });

  it('range mode: clicks build a pending selection without committing', () => {
    const onRangeChange = vi.fn();
    const { container } = render(
      <DatePicker selectionMode="range" open today="2026-07-19" onRangeChange={onRangeChange} />,
    );
    fireEvent.click(day(container, '2026-07-08')!);
    fireEvent.click(day(container, '2026-07-14')!);
    expect(day(container, '2026-07-08')!.className).toContain('ui-calendar__day--range-start');
    expect(day(container, '2026-07-14')!.className).toContain('ui-calendar__day--range-end');
    expect(day(container, '2026-07-10')!.className).toContain('ui-calendar__day--in-range');
    expect(onRangeChange).not.toHaveBeenCalled();
  });

  it('range mode: Apply commits the pending range and requests close', () => {
    const onRangeChange = vi.fn();
    const onOpenChange = vi.fn();
    const { container, getByText } = render(
      <DatePicker
        selectionMode="range"
        open
        today="2026-07-19"
        onRangeChange={onRangeChange}
        onOpenChange={onOpenChange}
      />,
    );
    fireEvent.click(day(container, '2026-07-08')!);
    fireEvent.click(day(container, '2026-07-14')!);
    fireEvent.click(getByText('Apply').closest('button')!);
    expect(onRangeChange).toHaveBeenCalledWith({ startDate: '2026-07-08', endDate: '2026-07-14' });
    expect(onOpenChange).toHaveBeenCalledWith({ open: false, reason: 'apply' });
  });

  it('range mode: opening seeds pending from committed values; Clear resets without commit', () => {
    const onRangeChange = vi.fn();
    const { container, getByText, rerender } = render(
      <DatePicker
        selectionMode="range"
        open={false}
        today="2026-07-19"
        startDate="2026-07-08"
        endDate="2026-07-14"
        onRangeChange={onRangeChange}
      />,
    );
    rerender(
      <DatePicker
        selectionMode="range"
        open
        today="2026-07-19"
        startDate="2026-07-08"
        endDate="2026-07-14"
        onRangeChange={onRangeChange}
      />,
    );
    expect(day(container, '2026-07-08')!.className).toContain('ui-calendar__day--range-start');

    fireEvent.click(getByText('Clear').closest('button')!);
    expect(day(container, '2026-07-08')!.className).not.toContain('ui-calendar__day--range-start');
    expect(onRangeChange).not.toHaveBeenCalled();

    fireEvent.click(getByText('Apply').closest('button')!);
    expect(onRangeChange).toHaveBeenCalledWith({ startDate: null, endDate: null });
  });

  it('forwards calendar constraints (minDate disables days)', () => {
    const { container } = render(
      <DatePicker open today="2026-07-19" minDate="2026-07-05" locale="pl-PL" />,
    );
    expect(day(container, '2026-07-02')!.className).toContain('ui-calendar__day--disabled');
  });
});
