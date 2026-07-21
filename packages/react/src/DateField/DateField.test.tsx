import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { DateField } from './DateField.js';

afterEach(() => cleanup());

const input = (c: HTMLElement) => c.querySelector<HTMLInputElement>('input')!;
const toggle = (c: HTMLElement) =>
  c.querySelector<HTMLButtonElement>('.ui-date-field__calendar-toggle')!;
const day = (c: HTMLElement, iso: string) =>
  c.querySelector<HTMLButtonElement>(`button[data-iso="${iso}"]`);

const typeAndEnter = (c: HTMLElement, text: string) => {
  fireEvent.change(input(c), { target: { value: text } });
  fireEvent.keyDown(input(c), { key: 'Enter' });
};

describe('DateField', () => {
  it('renders the TextField shell with a calendar toggle', () => {
    const { container, getByText } = render(
      <DateField label="Date" hint="Pick a day" today="2026-07-19" locale="pl-PL" />,
    );
    expect(getByText('Date')).not.toBeNull();
    expect(getByText('Pick a day')).not.toBeNull();
    expect(toggle(container).getAttribute('aria-haspopup')).toBe('dialog');
    expect(toggle(container).getAttribute('aria-expanded')).toBe('false');
  });

  it('formats the committed value with the locale medium style', () => {
    const { container } = render(
      <DateField locale="pl-PL" defaultStartDate="2026-07-05" today="2026-07-19" />,
    );
    expect(input(container).value).toContain('5 lip');
    expect(input(container).value).toContain('2026');
  });

  it('range mode: displays the combined en-dash string', () => {
    const { container } = render(
      <DateField
        mode="range"
        locale="pl-PL"
        defaultStartDate="2026-07-05"
        defaultEndDate="2026-07-12"
        today="2026-07-19"
      />,
    );
    expect(input(container).value.split(' – ')).toHaveLength(2);
  });

  it('parses typed ISO, locale numeric, and month-name forms on Enter', () => {
    const onChange = vi.fn();
    const { container } = render(
      <DateField locale="pl-PL" today="2026-07-19" onChange={onChange} />,
    );
    typeAndEnter(container, '2026-07-08');
    expect(onChange).toHaveBeenLastCalledWith({ startDate: '2026-07-08', endDate: null });
    expect(input(container).value).toContain('8 lip');

    typeAndEnter(container, '09.07.2026');
    expect(onChange).toHaveBeenLastCalledWith({ startDate: '2026-07-09', endDate: null });

    typeAndEnter(container, '10 lipca 2026');
    expect(onChange).toHaveBeenLastCalledWith({ startDate: '2026-07-10', endDate: null });
  });

  it('range mode: parses a typed range, swapping reversed endpoints', () => {
    const onChange = vi.fn();
    const { container } = render(
      <DateField mode="range" locale="pl-PL" today="2026-07-19" onChange={onChange} />,
    );
    typeAndEnter(container, '2026-07-14 - 2026-07-08');
    expect(onChange).toHaveBeenLastCalledWith({
      startDate: '2026-07-08',
      endDate: '2026-07-14',
    });
  });

  it('empty text commits a cleared value on blur', () => {
    const onChange = vi.fn();
    const { container } = render(
      <DateField
        locale="pl-PL"
        defaultStartDate="2026-07-05"
        today="2026-07-19"
        onChange={onChange}
      />,
    );
    fireEvent.change(input(container), { target: { value: '' } });
    fireEvent.blur(input(container));
    expect(onChange).toHaveBeenLastCalledWith({ startDate: null, endDate: null });
    expect(input(container).value).toBe('');
  });

  it('invalid or out-of-bounds text renders error state and calls onInvalid only', () => {
    const onChange = vi.fn();
    const onInvalid = vi.fn();
    const { container } = render(
      <DateField
        locale="pl-PL"
        minDate="2026-07-05"
        today="2026-07-19"
        onChange={onChange}
        onInvalid={onInvalid}
      />,
    );
    typeAndEnter(container, 'not a date');
    expect(onInvalid).toHaveBeenCalledWith('not a date');
    expect(onChange).not.toHaveBeenCalled();
    expect(container.querySelector('.ui-text-field--state-error')).not.toBeNull();

    typeAndEnter(container, '2026-07-02');
    expect(onInvalid).toHaveBeenLastCalledWith('2026-07-02');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('calendar toggle opens the picker; picking a day commits and closes (single)', () => {
    const onChange = vi.fn();
    const { container } = render(
      <DateField
        locale="pl-PL"
        defaultStartDate="2026-07-05"
        today="2026-07-19"
        onChange={onChange}
      />,
    );
    fireEvent.click(toggle(container));
    expect(toggle(container).getAttribute('aria-expanded')).toBe('true');
    expect(day(container, '2026-07-10')).not.toBeNull();

    fireEvent.click(day(container, '2026-07-10')!);
    expect(onChange).toHaveBeenCalledWith({ startDate: '2026-07-10', endDate: null });
    expect(toggle(container).getAttribute('aria-expanded')).toBe('false');
    expect(input(container).value).toContain('10 lip');
  });

  it('range mode: picking commits only on Apply and updates the input', () => {
    const onChange = vi.fn();
    const { container, getByText } = render(
      <DateField mode="range" locale="pl-PL" today="2026-07-19" onChange={onChange} />,
    );
    fireEvent.click(toggle(container));
    fireEvent.click(day(container, '2026-07-08')!);
    fireEvent.click(day(container, '2026-07-14')!);
    expect(onChange).not.toHaveBeenCalled();
    // Input still shows the committed (empty) value while pending lives in the panel.
    expect(input(container).value).toBe('');

    fireEvent.click(getByText('Apply').closest('button')!);
    expect(onChange).toHaveBeenCalledWith({ startDate: '2026-07-08', endDate: '2026-07-14' });
    expect(input(container).value.split(' – ')).toHaveLength(2);
  });

  it('controlled mode never mutates internally', () => {
    const onChange = vi.fn();
    const { container } = render(
      <DateField
        locale="pl-PL"
        startDate="2026-07-05"
        today="2026-07-19"
        onChange={onChange}
      />,
    );
    typeAndEnter(container, '2026-07-08');
    expect(onChange).toHaveBeenCalledWith({ startDate: '2026-07-08', endDate: null });
    // Committed prop unchanged → display falls back to the controlled value.
    expect(input(container).value).toContain('5 lip');
  });

  it('disabled disables input and toggle; readOnly keeps the picker usable', () => {
    const first = render(<DateField disabled locale="pl-PL" today="2026-07-19" />);
    expect(input(first.container).disabled).toBe(true);
    expect(toggle(first.container).disabled).toBe(true);
    first.unmount();

    const second = render(<DateField readOnly locale="pl-PL" today="2026-07-19" />);
    expect(input(second.container).readOnly).toBe(true);
    fireEvent.click(toggle(second.container));
    expect(toggle(second.container).getAttribute('aria-expanded')).toBe('true');
  });
});
