import { createRef } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { Menu } from './Menu.tsx';

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });
}

describe('Menu', () => {
  it('passes its ref to its root element', async () => {
    const ref = createRef<HTMLSpanElement>();
    await render(<Menu ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it('renders on a server and hydrates without a warning', async () => {
    const html = renderToString(<Menu />);
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.append(container);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const recoverable = vi.fn();
    const root = hydrateRoot(container, <Menu />, { onRecoverableError: recoverable });
    await nextFrame();
    await nextFrame();
    expect(recoverable).not.toHaveBeenCalled();
    expect(errors).not.toHaveBeenCalled();
    root.unmount();
    container.remove();
    errors.mockRestore();
  });

  it('keeps the ref and the press of its trigger, and a prevented press opens nothing', async () => {
    const ref = createRef<HTMLButtonElement>();
    const pressed = vi.fn();
    const screen = await render(
      <Menu
        options={[{ value: 'copy', label: 'Copy' }]}
        trigger={
          <button type="button" ref={ref} onClick={pressed}>
            Actions
          </button>
        }
      />,
    );
    expect(ref.current?.getAttribute('aria-haspopup')).toBe('menu');
    await screen.getByRole('button', { name: 'Actions' }).click();
    expect(pressed).toHaveBeenCalledOnce();
    expect(ref.current?.getAttribute('aria-expanded')).toBe('true');
    await screen.rerender(
      <Menu
        options={[{ value: 'copy', label: 'Copy' }]}
        trigger={
          <button
            type="button"
            ref={ref}
            onClick={(event) => {
              event.preventDefault();
            }}
          >
            Actions
          </button>
        }
      />,
    );
    await screen.getByRole('button', { name: 'Actions' }).click();
    expect(ref.current?.getAttribute('aria-expanded')).toBe('true');
  });

  it('opens after hydration when it starts open', async () => {
    const menu = (
      <Menu
        defaultOpen
        options={[{ value: 'copy', label: 'Copy' }]}
        trigger={<button type="button">Actions</button>}
      />
    );
    const container = document.createElement('div');
    container.innerHTML = renderToString(menu);
    document.body.append(container);
    const root = hydrateRoot(container, menu);
    await nextFrame();
    await nextFrame();
    expect(container.querySelector('.ui-menu__menu')?.matches(':popover-open')).toBe(true);
    root.unmount();
    container.remove();
  });
});
