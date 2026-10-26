import { createRef } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { Loader } from './Loader.tsx';

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });
}

describe('Loader', () => {
  it('passes its ref to the root element', async () => {
    const ref = createRef<HTMLSpanElement>();
    await render(<Loader ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
    expect(ref.current?.getAttribute('role')).toBe('progressbar');
  });

  it('passes class names, styles and other attributes to the root element', async () => {
    const screen = await render(
      <Loader
        className="spaced"
        style={{ marginInlineStart: 0 }}
        data-state="busy"
        id="orders-loader"
        aria-describedby="orders"
      />,
    );
    const root = screen.container.querySelector('#orders-loader');
    expect(root?.className).toBe('ui-loader ui-loader--medium spaced');
    expect(root?.getAttribute('style')).toContain('margin-inline-start');
    expect(root?.getAttribute('data-state')).toBe('busy');
    expect(root?.getAttribute('aria-describedby')).toBe('orders');
  });

  it('renders on a server and hydrates without a warning', async () => {
    const html = renderToString(<Loader size="large" label="Saving" />);
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-label="Saving"');

    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.append(container);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const recoverable = vi.fn();
    const root = hydrateRoot(container, <Loader size="large" label="Saving" />, {
      onRecoverableError: recoverable,
    });
    await nextFrame();
    await nextFrame();
    expect(recoverable).not.toHaveBeenCalled();
    expect(errors).not.toHaveBeenCalled();
    root.unmount();
    container.remove();
    errors.mockRestore();
  });
});
