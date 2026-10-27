import { createRef } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { Badge } from './Badge.tsx';

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });
}

describe('Badge', () => {
  it('passes its ref to its root element', async () => {
    const ref = createRef<HTMLSpanElement>();
    await render(<Badge ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it('renders on a server and hydrates without a warning', async () => {
    const html = renderToString(<Badge />);
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.append(container);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const recoverable = vi.fn();
    const root = hydrateRoot(container, <Badge />, { onRecoverableError: recoverable });
    await nextFrame();
    await nextFrame();
    expect(recoverable).not.toHaveBeenCalled();
    expect(errors).not.toHaveBeenCalled();
    root.unmount();
    container.remove();
    errors.mockRestore();
  });

  it('passes className, style and data attributes to its root element', async () => {
    const screen = await render(
      <Badge className="extra" style={{ marginInlineStart: '4px' }} data-testid="badge">
        New
      </Badge>,
    );
    const root = screen.container.querySelector<HTMLElement>('.ui-badge');
    expect(root?.classList.contains('extra')).toBe(true);
    expect(root?.style.marginInlineStart).toBe('4px');
    expect(root?.dataset['testid']).toBe('badge');
  });
});
