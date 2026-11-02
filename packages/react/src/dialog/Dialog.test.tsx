import { createRef, useState } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { Dialog } from './Dialog.tsx';

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });
}

describe('Dialog', () => {
  it('passes its ref to its native dialog', async () => {
    const ref = createRef<HTMLDialogElement>();
    await render(<Dialog ref={ref} heading="Delete" />);
    expect(ref.current).toBeInstanceOf(HTMLDialogElement);
    expect(ref.current?.open).toBe(false);
  });

  it('renders closed on a server and hydrates without a warning', async () => {
    const element = <Dialog heading="Delete" defaultOpen footer={<button>Done</button>} />;
    const html = renderToString(element);
    expect(html).not.toContain(' open');
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.append(container);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const recoverable = vi.fn();
    const root = hydrateRoot(container, element, { onRecoverableError: recoverable });
    await nextFrame();
    await nextFrame();
    expect(recoverable).not.toHaveBeenCalled();
    expect(errors).not.toHaveBeenCalled();
    // The default opens it once it hydrates, as a modal.
    expect(container.querySelector('dialog')?.matches(':modal')).toBe(true);
    root.unmount();
    container.remove();
    errors.mockRestore();
  });

  it('stays open while controlled, and reports the request to close', async () => {
    const onOpenChange = vi.fn();
    const screen = await render(<Dialog heading="Delete" open onOpenChange={onOpenChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: 'close-button', returnValue: '' }),
    );
    expect(screen.container.querySelector('dialog')?.open).toBe(true);
  });

  it('closes when its controlling parent agrees', async () => {
    function Parent() {
      const [open, setOpen] = useState(true);
      return <Dialog heading="Delete" open={open} onOpenChange={setOpen} />;
    }
    const screen = await render(<Parent />);
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.container.querySelector('dialog')?.open).toBe(false);
  });

  it('focuses the element marked with data-autofocus', async () => {
    const screen = await render(
      <Dialog heading="Rename" defaultOpen>
        <input aria-label="First" />
        <input aria-label="Second" data-autofocus />
      </Dialog>,
    );
    await expect.element(screen.getByRole('textbox', { name: 'Second' })).toHaveFocus();
  });
});
