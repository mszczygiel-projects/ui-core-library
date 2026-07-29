import { render, screen, cleanup, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { NumberField } from './NumberField.js';
import { commitValue, formatValue, parseValue, roundToPrecision, stepValue } from './numeric.js';

afterEach(cleanup);

describe('numeric helpers', () => {
  it('rounds without leaking float drift', () => {
    expect(roundToPrecision(2.3000000000000003, 1)).toBe(2.3);
    expect(roundToPrecision(0.1 + 0.2, 2)).toBe(0.3);
    expect(roundToPrecision(1.005, 2)).toBe(1.01);
  });

  it('clamps after rounding, not before', () => {
    // 1.996 is out of range before rounding but lands exactly on max after.
    expect(commitValue(1.996, 0, 2, 2)).toBe(2);
    expect(commitValue(150, 1, 99, 0)).toBe(99);
    expect(commitValue(-5, 1, 99, 0)).toBe(1);
  });

  it('parses empty and invalid text as null', () => {
    expect(parseValue('')).toBeNull();
    expect(parseValue('   ')).toBeNull();
    expect(parseValue('abc')).toBeNull();
    expect(parseValue('12')).toBe(12);
  });

  it('formats to the configured precision', () => {
    expect(formatValue(null, 0)).toBe('');
    expect(formatValue(12, 0)).toBe('12');
    expect(formatValue(2.5, 2)).toBe('2.50');
  });

  it('re-rounds after each step so repeated ticks do not accumulate drift', () => {
    let value = 0.1;
    for (let i = 0; i < 3; i += 1) value = stepValue(value, 1, 0.1, 0, 10, 2);
    expect(value).toBe(0.4);
  });

  it('steps from min when the value is empty', () => {
    expect(stepValue(null, 1, 1, 5, 10, 0)).toBe(6);
  });
});

describe('NumberField', () => {
  it('renders a labelled input', () => {
    render(<NumberField label="Quantity" />);
    expect(screen.getByLabelText('Quantity')).toBeDefined();
  });

  it('renders no stepper buttons by default', () => {
    render(<NumberField label="Quantity" />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('renders both steppers when controls is inline', () => {
    render(<NumberField label="Quantity" controls="inline" />);
    expect(screen.getByLabelText('Decrease')).toBeDefined();
    expect(screen.getByLabelText('Increase')).toBeDefined();
  });

  it('renders bare markup when label and hint are omitted', () => {
    const { container } = render(<NumberField controls="inline" />);
    expect(container.querySelector('label')).toBeNull();
    expect(container.querySelector('p')).toBeNull();
  });

  it('exposes spinbutton semantics', () => {
    render(<NumberField label="Quantity" min={1} max={99} defaultValue={12} />);
    const input = screen.getByRole('spinbutton');
    expect(input.getAttribute('aria-valuenow')).toBe('12');
    expect(input.getAttribute('aria-valuemin')).toBe('1');
    expect(input.getAttribute('aria-valuemax')).toBe('99');
  });

  it('uses decimal inputmode only when precision allows decimals', () => {
    const { rerender } = render(<NumberField label="Q" />);
    expect(screen.getByLabelText('Q').getAttribute('inputmode')).toBe('numeric');
    rerender(<NumberField label="Q" precision={2} />);
    expect(screen.getByLabelText('Q').getAttribute('inputmode')).toBe('decimal');
  });

  it('does not round while typing, only on blur', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<NumberField label="Q" precision={2} onValueChange={onValueChange} />);
    const input = screen.getByLabelText('Q') as HTMLInputElement;

    await user.click(input);
    await user.keyboard('1.');
    expect(input.value).toBe('1.');
    expect(onValueChange).not.toHaveBeenCalled();

    await user.tab();
    expect(input.value).toBe('1.00');
    expect(onValueChange).toHaveBeenCalledWith(1);
  });

  it('clamps to max on commit', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<NumberField label="Q" min={1} max={99} onValueChange={onValueChange} />);
    const input = screen.getByLabelText('Q') as HTMLInputElement;

    await user.click(input);
    await user.keyboard('150');
    await user.tab();

    expect(input.value).toBe('99');
    expect(onValueChange).toHaveBeenCalledWith(99);
  });

  it('commits an empty field as null', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<NumberField label="Q" defaultValue={5} onValueChange={onValueChange} />);
    const input = screen.getByLabelText('Q') as HTMLInputElement;

    await user.clear(input);
    await user.tab();

    expect(onValueChange).toHaveBeenCalledWith(null);
  });

  it('steps with arrow keys', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<NumberField label="Q" defaultValue={5} onValueChange={onValueChange} />);
    const input = screen.getByLabelText('Q') as HTMLInputElement;

    await user.click(input);
    await user.keyboard('{ArrowUp}');
    expect(input.value).toBe('6');
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(input.value).toBe('4');
    expect(onValueChange).toHaveBeenLastCalledWith(4);
  });

  it('steps once per stepper click', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <NumberField label="Q" controls="inline" defaultValue={5} onValueChange={onValueChange} />,
    );

    await user.click(screen.getByLabelText('Increase'));
    expect(onValueChange).toHaveBeenCalledWith(6);
    expect((screen.getByLabelText('Q') as HTMLInputElement).value).toBe('6');
  });

  it('disables the stepper that would cross a bound', () => {
    render(<NumberField label="Q" controls="inline" min={1} max={5} defaultValue={5} />);
    expect((screen.getByLabelText('Increase') as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByLabelText('Decrease') as HTMLButtonElement).disabled).toBe(false);
  });

  it('disables both steppers when read-only', () => {
    render(<NumberField label="Q" controls="inline" readOnly defaultValue={5} />);
    expect((screen.getByLabelText('Increase') as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByLabelText('Decrease') as HTMLButtonElement).disabled).toBe(true);
  });

  it('repeats while a stepper is held, then stops on release', async () => {
    vi.useFakeTimers();
    try {
      const onValueChange = vi.fn();
      render(
        <NumberField label="Q" controls="inline" defaultValue={0} onValueChange={onValueChange} />,
      );
      const increase = screen.getByLabelText('Increase');

      // pointerdown fires the first step immediately
      act(() => {
        increase.dispatchEvent(
          new PointerEvent('pointerdown', { bubbles: true, cancelable: true }),
        );
      });
      expect(onValueChange).toHaveBeenLastCalledWith(1);

      // nothing repeats until the initial delay elapses
      act(() => void vi.advanceTimersByTime(490));
      expect(onValueChange).toHaveBeenCalledTimes(1);

      act(() => void vi.advanceTimersByTime(10 + 300));
      expect(onValueChange).toHaveBeenLastCalledWith(4);

      act(() => {
        window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
      });
      const callsAfterRelease = onValueChange.mock.calls.length;
      act(() => void vi.advanceTimersByTime(500));
      expect(onValueChange).toHaveBeenCalledTimes(callsAfterRelease);
    } finally {
      vi.useRealTimers();
    }
  });

  it('stops repeating when the value reaches a bound mid-hold', async () => {
    vi.useFakeTimers();
    try {
      const onValueChange = vi.fn();
      render(
        <NumberField
          label="Q"
          controls="inline"
          min={0}
          max={3}
          defaultValue={0}
          onValueChange={onValueChange}
        />,
      );
      const increase = screen.getByLabelText('Increase');

      act(() => {
        increase.dispatchEvent(
          new PointerEvent('pointerdown', { bubbles: true, cancelable: true }),
        );
      });
      act(() => void vi.advanceTimersByTime(500 + 100 * 10));

      expect(onValueChange).toHaveBeenLastCalledWith(3);
      // never overshoots the bound, however long the hold lasts
      expect(onValueChange.mock.calls.every(([v]) => v !== null && v <= 3)).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('leaves no live timer behind when unmounted mid-hold', () => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');
    try {
      const { unmount } = render(<NumberField label="Q" controls="inline" defaultValue={0} />);
      act(() => {
        screen
          .getByLabelText('Increase')
          .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
      });
      unmount();
      expect(clearTimeoutSpy).toHaveBeenCalled();
    } finally {
      clearTimeoutSpy.mockRestore();
      vi.useRealTimers();
    }
  });

  it('respects the controlled value', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<NumberField label="Q" controls="inline" value={7} onValueChange={onValueChange} />);

    await user.click(screen.getByLabelText('Increase'));
    expect(onValueChange).toHaveBeenCalledWith(8);
    // the parent owns the value, so the input still shows 7
    expect((screen.getByLabelText('Q') as HTMLInputElement).value).toBe('7');
  });

  it('forwards className and style to the root element', () => {
    const { container } = render(
      <NumberField label="Q" className="custom" style={{ marginTop: 8 }} />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.classList.contains('custom')).toBe(true);
    expect(root.style.marginTop).toBe('8px');
  });
});
