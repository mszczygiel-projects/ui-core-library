import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { Dialog } from './Dialog.js';

afterEach(() => cleanup());

/*
 * jsdom has no real <dialog> — see the stand-in in test-setup.ts. These tests
 * cover prop-to-DOM mapping, callbacks and ARIA. The genuinely modal behaviour
 * (top layer, focus trap, inerting, Escape) lives in the web-components suite,
 * which runs on real Chromium.
 */

const panel = (container: HTMLElement) => container.querySelector('dialog.ui-dialog')!;

describe('Dialog', () => {
  it('renders without error', () => {
    const { container } = render(<Dialog title="Title">Body</Dialog>);
    expect(panel(container)).not.toBeNull();
  });

  it('maps size and variant to modifier classes', () => {
    const sizes = ['small', 'medium', 'large', 'fullscreen'] as const;
    for (const size of sizes) {
      const { container } = render(<Dialog size={size}>Body</Dialog>);
      expect(panel(container).classList.contains(`ui-dialog--${size}`)).toBe(true);
      cleanup();
    }
    const { container } = render(<Dialog variant="alert">Body</Dialog>);
    expect(panel(container).classList.contains('ui-dialog--alert')).toBe(true);
  });

  it('forwards className and style to the root', () => {
    const { container } = render(
      <Dialog className="custom" style={{ marginTop: '4px' }}>
        Body
      </Dialog>,
    );
    const root = panel(container) as HTMLElement;
    expect(root.classList.contains('custom')).toBe(true);
    expect(root.classList.contains('ui-dialog')).toBe(true);
    expect(root.style.marginTop).toBe('4px');
  });

  it('opens and closes the underlying dialog from the open prop', () => {
    const { container, rerender } = render(<Dialog open={false}>Body</Dialog>);
    expect(panel(container).hasAttribute('open')).toBe(false);
    rerender(<Dialog open>Body</Dialog>);
    expect(panel(container).hasAttribute('open')).toBe(true);
    rerender(<Dialog open={false}>Body</Dialog>);
    expect(panel(container).hasAttribute('open')).toBe(false);
  });

  it('uses role="alertdialog" for the alert variant', () => {
    const { container } = render(<Dialog variant="alert">Body</Dialog>);
    expect(panel(container).getAttribute('role')).toBe('alertdialog');
    cleanup();
    const { container: plain } = render(<Dialog>Body</Dialog>);
    expect(panel(plain).getAttribute('role')).toBe('dialog');
  });

  it('wires aria-labelledby and aria-describedby when title and description exist', () => {
    const { container } = render(
      <Dialog title="Delete account?" description="Cannot be undone.">
        Body
      </Dialog>,
    );
    const root = panel(container);
    expect(root.getAttribute('aria-labelledby')).toBe('ui-dialog-title');
    expect(root.getAttribute('aria-describedby')).toBe('ui-dialog-description');
    expect(container.querySelector('#ui-dialog-title')?.textContent).toBe('Delete account?');
  });

  it('falls back to aria-label when there is no title', () => {
    const { container } = render(<Dialog label="Settings">Body</Dialog>);
    const root = panel(container);
    expect(root.getAttribute('aria-label')).toBe('Settings');
    expect(root.hasAttribute('aria-labelledby')).toBe(false);
  });

  it('requests close from the close button without changing its own state', () => {
    const onOpenChange = vi.fn();
    const { container } = render(
      <Dialog open onOpenChange={onOpenChange}>
        Body
      </Dialog>,
    );
    fireEvent.click(container.querySelector('.ui-dialog__close')!);
    expect(onOpenChange).toHaveBeenCalledWith({ open: false, reason: 'close-button' });
    // Controlled: the DOM state must not change on its own.
    expect(panel(container).hasAttribute('open')).toBe(true);
  });

  it('requests close on backdrop click but not from content clicks', () => {
    const onOpenChange = vi.fn();
    const { container } = render(
      <Dialog open onOpenChange={onOpenChange}>
        <span data-testid="content">Body</span>
      </Dialog>,
    );
    fireEvent.click(container.querySelector('[data-testid="content"]')!);
    expect(onOpenChange).not.toHaveBeenCalled();

    fireEvent.click(panel(container));
    expect(onOpenChange).toHaveBeenCalledWith({ open: false, reason: 'outside-click' });
  });

  it('never dismisses an alert dialog by backdrop click', () => {
    const onOpenChange = vi.fn();
    const { container } = render(
      <Dialog open variant="alert" onOpenChange={onOpenChange}>
        Body
      </Dialog>,
    );
    fireEvent.click(panel(container));
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('honours dismissOn when deciding which requests to raise', () => {
    const onOpenChange = vi.fn();
    const { container } = render(
      <Dialog open dismissOn="escape" onOpenChange={onOpenChange}>
        Body
      </Dialog>,
    );
    fireEvent.click(panel(container));
    expect(onOpenChange).not.toHaveBeenCalled();
    cleanup();

    const none = vi.fn();
    const { container: c2 } = render(
      <Dialog open dismissOn="none" onOpenChange={none}>
        Body
      </Dialog>,
    );
    fireEvent.click(panel(c2));
    expect(none).not.toHaveBeenCalled();
  });

  it('hides the close button when hasCloseButton is false', () => {
    const { container } = render(<Dialog hasCloseButton={false}>Body</Dialog>);
    expect(container.querySelector('.ui-dialog__close')).toBeNull();
  });

  it('omits the header entirely when nothing would fill it', () => {
    const { container } = render(<Dialog hasCloseButton={false}>Body</Dialog>);
    expect(container.querySelector('.ui-dialog__header')).toBeNull();
  });

  it('renders the footer only when actions are supplied', () => {
    const { container } = render(<Dialog>Body</Dialog>);
    expect(container.querySelector('.ui-dialog__footer')).toBeNull();
    cleanup();
    const { container: withFooter } = render(<Dialog footer={<button>Act</button>}>Body</Dialog>);
    expect(withFooter.querySelector('.ui-dialog__footer')).not.toBeNull();
  });

  it('locks page scroll while open and restores it on close', () => {
    const before = document.documentElement.style.overflow;
    const { rerender } = render(<Dialog open>Body</Dialog>);
    expect(document.documentElement.style.overflow).toBe('hidden');
    rerender(<Dialog open={false}>Body</Dialog>);
    expect(document.documentElement.style.overflow).toBe(before);
  });

  it('renders the drag affordance only when dragToDismiss is on', () => {
    const { container } = render(<Dialog open>Body</Dialog>);
    expect(container.querySelector('.ui-dialog__grabber')).toBeNull();
    cleanup();
    const { container: withDrag } = render(
      <Dialog open dragToDismiss>
        Body
      </Dialog>,
    );
    const grabber = withDrag.querySelector('.ui-dialog__grabber');
    expect(grabber).not.toBeNull();
    // Decorative: keyboard and screen-reader users close by other means.
    expect(grabber?.getAttribute('aria-hidden')).toBe('true');
  });

  it('releases the scroll lock if unmounted while still open', () => {
    const before = document.documentElement.style.overflow;
    const { unmount } = render(<Dialog open>Body</Dialog>);
    expect(document.documentElement.style.overflow).toBe('hidden');
    unmount();
    expect(document.documentElement.style.overflow).toBe(before);
  });
});
