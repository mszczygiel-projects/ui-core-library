import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { Drawer } from './Drawer.js';

afterEach(() => cleanup());

/*
 * jsdom has no real <dialog> — see the stand-in in test-setup.ts. These tests
 * cover prop-to-DOM mapping, callbacks and ARIA. The genuinely modal behaviour
 * (top layer, focus trap, inerting, Escape) lives in the web-components suite,
 * which runs on real Chromium.
 */

const panel = (container: HTMLElement) => container.querySelector('dialog.ui-drawer')!;

describe('Drawer', () => {
  it('renders without error', () => {
    const { container } = render(<Drawer label="Filters">Body</Drawer>);
    expect(panel(container)).not.toBeNull();
  });

  it('maps placement to a modifier class and defaults to right', () => {
    const { container } = render(<Drawer>Body</Drawer>);
    expect(panel(container).classList.contains('ui-drawer--right')).toBe(true);
    cleanup();

    for (const placement of ['right', 'left', 'bottom'] as const) {
      const { container: c } = render(<Drawer placement={placement}>Body</Drawer>);
      expect(panel(c).classList.contains(`ui-drawer--${placement}`)).toBe(true);
      cleanup();
    }
  });

  it('forwards className and style to the root', () => {
    const { container } = render(
      <Drawer className="custom" style={{ marginTop: '4px' }}>
        Body
      </Drawer>,
    );
    const root = panel(container) as HTMLElement;
    expect(root.classList.contains('custom')).toBe(true);
    expect(root.classList.contains('ui-drawer')).toBe(true);
    expect(root.style.marginTop).toBe('4px');
  });

  it('opens and closes the underlying dialog from the open prop', () => {
    const { container, rerender } = render(<Drawer open={false}>Body</Drawer>);
    expect(panel(container).hasAttribute('open')).toBe(false);
    rerender(<Drawer open>Body</Drawer>);
    expect(panel(container).hasAttribute('open')).toBe(true);
    rerender(<Drawer open={false}>Body</Drawer>);
    expect(panel(container).hasAttribute('open')).toBe(false);
  });

  it('names the drawer from label, or defers to aria-labelledby', () => {
    const { container } = render(<Drawer label="Filters">Body</Drawer>);
    expect(panel(container).getAttribute('aria-label')).toBe('Filters');
    expect(panel(container).getAttribute('role')).toBe('dialog');
    cleanup();

    const { container: c } = render(
      <Drawer aria-labelledby="my-heading">
        <h2 id="my-heading">Filters</h2>
      </Drawer>,
    );
    expect(panel(c).getAttribute('aria-labelledby')).toBe('my-heading');
  });

  it('renders children into the body region', () => {
    const { container } = render(<Drawer>Body text</Drawer>);
    expect(container.querySelector('.ui-drawer__body')!.textContent).toBe('Body text');
  });

  it('requests a close from the close button', () => {
    const onOpenChange = vi.fn();
    const { container } = render(
      <Drawer open onOpenChange={onOpenChange}>
        Body
      </Drawer>,
    );
    fireEvent.click(container.querySelector('.ui-drawer__close')!);
    expect(onOpenChange).toHaveBeenCalledWith({ open: false, reason: 'close-button' });
  });

  it('omits the dismiss region when hasCloseButton is false', () => {
    const { container } = render(<Drawer hasCloseButton={false}>Body</Drawer>);
    expect(container.querySelector('.ui-drawer__dismiss')).toBeNull();
  });

  it('requests a close when the backdrop is clicked', () => {
    const onOpenChange = vi.fn();
    const { container } = render(
      <Drawer open onOpenChange={onOpenChange}>
        Body
      </Drawer>,
    );
    // A click whose target is the dialog element itself is a backdrop click.
    fireEvent.click(panel(container));
    expect(onOpenChange).toHaveBeenCalledWith({ open: false, reason: 'outside-click' });
  });

  it('ignores the backdrop when dismissOn excludes outside clicks', () => {
    const onOpenChange = vi.fn();
    const { container } = render(
      <Drawer open dismissOn="escape" onOpenChange={onOpenChange}>
        Body
      </Drawer>,
    );
    fireEvent.click(panel(container));
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('requests a close on cancel without applying it itself', () => {
    const onOpenChange = vi.fn();
    const { container } = render(
      <Drawer open onOpenChange={onOpenChange}>
        Body
      </Drawer>,
    );
    fireEvent(panel(container), new Event('cancel', { bubbles: false, cancelable: true }));
    expect(onOpenChange).toHaveBeenCalledWith({ open: false, reason: 'escape' });
    // Controlled: the request alone must not flip the rendered state.
    expect(panel(container).hasAttribute('open')).toBe(true);
  });

  it('ignores cancel when dismissOn is none', () => {
    const onOpenChange = vi.fn();
    const { container } = render(
      <Drawer open dismissOn="none" onOpenChange={onOpenChange}>
        Body
      </Drawer>,
    );
    fireEvent(panel(container), new Event('cancel', { bubbles: false, cancelable: true }));
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('renders the grabber only for a bottom sheet with dragToDismiss', () => {
    // Default placement is `right` — the gesture does not apply there.
    const { container } = render(
      <Drawer open dragToDismiss>
        Body
      </Drawer>,
    );
    expect(container.querySelector('.ui-drawer__grabber')).toBeNull();
    cleanup();

    const { container: c } = render(
      <Drawer open placement="bottom" dragToDismiss>
        Body
      </Drawer>,
    );
    expect(c.querySelector('.ui-drawer__grabber')).not.toBeNull();
    cleanup();

    const { container: d } = render(
      <Drawer open placement="bottom">
        Body
      </Drawer>,
    );
    expect(d.querySelector('.ui-drawer__grabber')).toBeNull();
  });

  it('does not fire open-change requests while already closed', () => {
    const onOpenChange = vi.fn();
    const { container } = render(
      <Drawer open={false} onOpenChange={onOpenChange}>
        Body
      </Drawer>,
    );
    fireEvent.click(container.querySelector('.ui-drawer__close')!);
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
