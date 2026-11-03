import { createRef } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { Popover } from './Popover.tsx';

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });
}

describe('Popover', () => {
  it('passes its ref to its root element', async () => {
    const ref = createRef<HTMLSpanElement>();
    await render(<Popover ref={ref} label="Filters" />);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it('renders closed on a server and hydrates without a warning', async () => {
    const element = (
      <Popover label="Filters" defaultOpen trigger={<button type="button">Filters</button>}>
        <p>Content</p>
      </Popover>
    );
    const html = renderToString(element);
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
    // The default opens it once it hydrates.
    expect(container.querySelector('[role="dialog"]')?.matches(':popover-open')).toBe(true);
    root.unmount();
    container.remove();
    errors.mockRestore();
  });

  it('keeps the ref and the press of the page on its trigger', async () => {
    const ref = createRef<HTMLButtonElement>();
    const onClick = vi.fn();
    const screen = await render(
      <Popover
        label="Filters"
        trigger={
          <button ref={ref} type="button" onClick={onClick}>
            Filters
          </button>
        }
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Filters' }));
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(onClick).toHaveBeenCalledOnce();
    expect(ref.current?.getAttribute('aria-expanded')).toBe('true');
  });

  it('stays closed when the press of the page prevents the default', async () => {
    const onOpenChange = vi.fn();
    const screen = await render(
      <Popover
        label="Filters"
        onOpenChange={onOpenChange}
        trigger={
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
            }}
          >
            Filters
          </button>
        }
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Filters' }));
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.container.querySelector('[role="dialog"]')?.matches(':popover-open')).toBe(false);
  });
});
