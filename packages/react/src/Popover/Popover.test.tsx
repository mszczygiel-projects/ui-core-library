import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { Popover } from './Popover.js';
import type { PopoverOpenChangeDetail } from './Popover.js';

afterEach(() => cleanup());

const anchorButton = <button>Open</button>;

describe('Popover', () => {
  it('renders anchor and panel content', () => {
    const { container, getByText } = render(
      <Popover anchor={anchorButton}>Floating content</Popover>,
    );
    expect(container.querySelector('.ui-popover')).not.toBeNull();
    expect(getByText('Open')).not.toBeNull();
    expect(getByText('Floating content')).not.toBeNull();
    expect(container.querySelector('.ui-popover__panel')).not.toBeNull();
    expect(container.querySelector('.ui-popover__content')).not.toBeNull();
  });

  it('anchor click requests open but never mutates state itself (controlled)', () => {
    const onOpenChange = vi.fn();
    const { getByText } = render(
      <Popover anchor={anchorButton} onOpenChange={onOpenChange}>
        C
      </Popover>,
    );
    fireEvent.click(getByText('Open'));
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith({
      open: true,
      reason: 'trigger',
    } satisfies PopoverOpenChangeDetail);
  });

  it('anchor click requests close when open', () => {
    const onOpenChange = vi.fn();
    const { getByText } = render(
      <Popover open anchor={anchorButton} onOpenChange={onOpenChange}>
        C
      </Popover>,
    );
    fireEvent.click(getByText('Open'));
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith({ open: false, reason: 'trigger' });
  });

  it('clicks inside the panel content do not toggle', () => {
    const onOpenChange = vi.fn();
    const { getByText } = render(
      <Popover open anchor={anchorButton} onOpenChange={onOpenChange}>
        <button>Inside</button>
      </Popover>,
    );
    fireEvent.click(getByText('Inside'));
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('manual trigger makes no requests from clicks', () => {
    const onOpenChange = vi.fn();
    const { getByText } = render(
      <Popover trigger="manual" anchor={anchorButton} onOpenChange={onOpenChange}>
        C
      </Popover>,
    );
    fireEvent.click(getByText('Open'));
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('Escape requests close while open', () => {
    const onOpenChange = vi.fn();
    render(
      <Popover open anchor={anchorButton} onOpenChange={onOpenChange}>
        C
      </Popover>,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith({ open: false, reason: 'escape' });
  });

  it('outside pointerdown requests close while open', () => {
    const onOpenChange = vi.fn();
    render(
      <Popover open anchor={anchorButton} onOpenChange={onOpenChange}>
        C
      </Popover>,
    );
    fireEvent.pointerDown(document.body);
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith({ open: false, reason: 'outside-click' });
  });

  it('pointerdown inside the popover does not request close', () => {
    const onOpenChange = vi.fn();
    const { getByText } = render(
      <Popover open anchor={anchorButton} onOpenChange={onOpenChange}>
        Inside
      </Popover>,
    );
    fireEvent.pointerDown(getByText('Inside'));
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("dismissOn='escape' ignores outside clicks", () => {
    const onOpenChange = vi.fn();
    render(
      <Popover open dismissOn="escape" anchor={anchorButton} onOpenChange={onOpenChange}>
        C
      </Popover>,
    );
    fireEvent.pointerDown(document.body);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("dismissOn='outside-click' ignores Escape", () => {
    const onOpenChange = vi.fn();
    render(
      <Popover open dismissOn="outside-click" anchor={anchorButton} onOpenChange={onOpenChange}>
        C
      </Popover>,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('dismiss listeners are inactive while closed', () => {
    const onOpenChange = vi.fn();
    render(
      <Popover anchor={anchorButton} onOpenChange={onOpenChange}>
        C
      </Popover>,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.pointerDown(document.body);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('hover trigger requests open on mouse enter and delayed close on leave', () => {
    vi.useFakeTimers();
    try {
      const onOpenChange = vi.fn();
      const { container } = render(
        <Popover trigger="hover" anchor={anchorButton} onOpenChange={onOpenChange}>
          C
        </Popover>,
      );
      const host = container.querySelector('.ui-popover')!;
      fireEvent.mouseEnter(host);
      expect(onOpenChange).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith({ open: true, reason: 'hover' });

      cleanup();
      const second = render(
        <Popover open trigger="hover" anchor={anchorButton} onOpenChange={onOpenChange}>
          C
        </Popover>,
      );
      fireEvent.mouseLeave(second.container.querySelector('.ui-popover')!);
      expect(onOpenChange).toHaveBeenCalledTimes(1);
      vi.advanceTimersByTime(200);
      expect(onOpenChange).toHaveBeenCalledTimes(2);
      expect(onOpenChange).toHaveBeenLastCalledWith({ open: false, reason: 'hover' });
    } finally {
      vi.useRealTimers();
    }
  });

  it('injects aria-expanded onto the anchor element for non-manual triggers', () => {
    const { getByText, rerender } = render(<Popover anchor={anchorButton}>C</Popover>);
    expect(getByText('Open').getAttribute('aria-expanded')).toBe('false');

    rerender(
      <Popover open anchor={anchorButton}>
        C
      </Popover>,
    );
    expect(getByText('Open').getAttribute('aria-expanded')).toBe('true');
  });

  it('manual trigger leaves anchor ARIA to the consumer', () => {
    const { getByText } = render(
      <Popover trigger="manual" anchor={anchorButton}>
        C
      </Popover>,
    );
    expect(getByText('Open').hasAttribute('aria-expanded')).toBe(false);
  });

  it('renders the arrow element only when arrow is set', () => {
    const { container, rerender } = render(<Popover anchor={anchorButton}>C</Popover>);
    expect(container.querySelector('.ui-popover__arrow')).toBeNull();

    rerender(
      <Popover arrow anchor={anchorButton}>
        C
      </Popover>,
    );
    expect(container.querySelector('.ui-popover__arrow')).not.toBeNull();
  });

  it('trapFocus moves focus into the panel on open and restores it on close', async () => {
    const { getByText, rerender } = render(
      <Popover trapFocus anchor={anchorButton}>
        <button>First</button>
      </Popover>,
    );
    const trigger = getByText('Open');
    trigger.focus();

    rerender(
      <Popover open trapFocus anchor={anchorButton}>
        <button>First</button>
      </Popover>,
    );
    await waitFor(() => expect(document.activeElement).toBe(getByText('First')));

    rerender(
      <Popover trapFocus anchor={anchorButton}>
        <button>First</button>
      </Popover>,
    );
    expect(document.activeElement).toBe(trigger);
  });

  it('Tab wraps focus inside the panel when trapFocus is set', async () => {
    const { getByText } = render(
      <Popover open trapFocus anchor={anchorButton}>
        <button>First</button>
        <button>Second</button>
      </Popover>,
    );
    await waitFor(() => expect(document.activeElement).toBe(getByText('First')));

    const second = getByText('Second');
    second.focus();
    fireEvent.keyDown(second, { key: 'Tab' });
    expect(document.activeElement).toBe(getByText('First'));
  });

  it('forwards className and style to the root element', () => {
    const { container } = render(
      <Popover className="custom" style={{ marginTop: 4 }} anchor={anchorButton}>
        C
      </Popover>,
    );
    const root = container.querySelector('.ui-popover') as HTMLSpanElement;
    expect(root.className).toContain('custom');
    expect(root.style.marginTop).toBe('4px');
  });
});
