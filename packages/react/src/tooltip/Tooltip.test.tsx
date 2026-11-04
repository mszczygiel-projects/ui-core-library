import { createRef } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { Tooltip } from './Tooltip.tsx';

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });
}

describe('Tooltip', () => {
  it('passes its ref to its root element, and the ref of the page to its trigger', async () => {
    const ref = createRef<HTMLSpanElement>();
    const trigger = createRef<HTMLButtonElement>();
    await render(
      <Tooltip ref={ref} content="Copy link">
        <button ref={trigger} type="button">
          Copy
        </button>
      </Tooltip>,
    );
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
    expect(trigger.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('renders on a server and hydrates without a warning', async () => {
    const element = (
      <Tooltip content="Copy link">
        <button type="button">Copy</button>
      </Tooltip>
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
    root.unmount();
    container.remove();
    errors.mockRestore();
  });

  it('adds its text to the description the trigger has already', async () => {
    const screen = await render(
      <Tooltip content="Copy link">
        <button type="button" aria-describedby="hint">
          Copy
        </button>
      </Tooltip>,
    );
    const button = screen.container.querySelector('button');
    const bubble = screen.container.querySelector('[role="tooltip"]');
    expect(button?.getAttribute('aria-describedby')).toBe(`hint ${bubble?.id ?? ''}`);
  });
});
