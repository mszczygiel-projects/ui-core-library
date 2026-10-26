import { createRef } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { IconButton } from './IconButton.tsx';

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });
}

describe('IconButton', () => {
  it('passes its ref and native attributes to the native button', async () => {
    const ref = createRef<HTMLButtonElement>();
    await render(
      <IconButton
        ref={ref}
        label="Close panel"
        id="close"
        className="spaced"
        data-owner="page"
        aria-expanded="true"
        form="editor"
      />,
    );
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current?.id).toBe('close');
    expect(ref.current?.classList.contains('spaced')).toBe(true);
    expect(ref.current?.dataset['owner']).toBe('page');
    expect(ref.current?.getAttribute('aria-expanded')).toBe('true');
    expect(ref.current?.getAttribute('form')).toBe('editor');
    expect(ref.current?.getAttribute('aria-label')).toBe('Close panel');
  });

  it('writes no name or value it was not given', async () => {
    const screen = await render(<IconButton label="Close panel" />);
    const button = screen.container.querySelector('button');
    expect(button?.hasAttribute('name')).toBe(false);
    expect(button?.hasAttribute('value')).toBe(false);
  });

  it('keeps an author description first while loading', async () => {
    const screen = await render(
      <IconButton label="Close panel" loading aria-describedby="instructions" />,
    );
    const ids = screen.container
      .querySelector('button')
      ?.getAttribute('aria-describedby')
      ?.split(' ');
    expect(ids?.[0]).toBe('instructions');
    expect(screen.container.querySelector('span[hidden]')?.id).toBe(ids?.[1]);
  });

  it('renders loading on a server and hydrates without losing its description', async () => {
    const view = (
      <IconButton label="Close panel" loading loadingLabel="Closing panel" icon={<svg />} />
    );
    const html = renderToString(view);
    expect(html).toContain('aria-busy="true"');
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.append(container);
    const description = container.querySelector('button')?.getAttribute('aria-describedby');
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const recoverable = vi.fn();
    const root = hydrateRoot(container, view, { onRecoverableError: recoverable });
    try {
      await nextFrame();
      await nextFrame();
      expect(container.querySelector('button')?.getAttribute('aria-describedby')).toBe(description);
      expect(container.querySelector('span[hidden]')?.textContent).toBe('Closing panel');
      expect(recoverable).not.toHaveBeenCalled();
      expect(errors).not.toHaveBeenCalled();
    } finally {
      root.unmount();
      container.remove();
      errors.mockRestore();
    }
  });
});
