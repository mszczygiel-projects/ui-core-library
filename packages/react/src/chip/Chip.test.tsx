import { createRef } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { Chip } from './Chip.tsx';

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });
}

describe('Chip', () => {
  it('passes its ref to its root element', async () => {
    const ref = createRef<HTMLSpanElement>();
    await render(<Chip ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it('renders on a server and hydrates without a warning', async () => {
    const html = renderToString(
      <Chip selectable dismissible>
        Open now
      </Chip>,
    );
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.append(container);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const recoverable = vi.fn();
    const root = hydrateRoot(
      container,
      <Chip selectable dismissible>
        Open now
      </Chip>,
      { onRecoverableError: recoverable },
    );
    await nextFrame();
    await nextFrame();
    expect(recoverable).not.toHaveBeenCalled();
    expect(errors).not.toHaveBeenCalled();
    root.unmount();
    container.remove();
    errors.mockRestore();
  });

  it('keeps a controlled state until its owner changes it', async () => {
    const changed = vi.fn<(selected: boolean, details: { originalEvent: Event }) => void>();
    const screen = await render(
      <Chip selectable selected={false} onSelectedChange={changed}>
        Open now
      </Chip>,
    );
    const control = screen.getByRole('button', { name: 'Open now' });
    await control.click();
    expect(changed.mock.calls[0]?.[0]).toBe(true);
    expect(changed.mock.calls[0]?.[1].originalEvent).toBeInstanceOf(MouseEvent);
    await expect.element(control).toHaveAttribute('aria-pressed', 'false');
  });

  it('starts an uncontrolled chip from defaultSelected', async () => {
    const screen = await render(
      <Chip selectable defaultSelected>
        Open now
      </Chip>,
    );
    const control = screen.getByRole('button', { name: 'Open now' });
    await expect.element(control).toHaveAttribute('aria-pressed', 'true');
    await control.click();
    await expect.element(control).toHaveAttribute('aria-pressed', 'false');
  });

  it('passes className, style and data attributes to its root, and the rest to its control', async () => {
    const screen = await render(
      <Chip
        selectable
        className="extra"
        style={{ marginInlineStart: '4px' }}
        data-testid="chip"
        id="open-now"
        aria-describedby="filters"
      >
        Open now
      </Chip>,
    );
    const root = screen.container.querySelector<HTMLElement>('.ui-chip');
    expect(root?.classList.contains('extra')).toBe(true);
    expect(root?.style.marginInlineStart).toBe('4px');
    expect(root?.dataset['testid']).toBe('chip');
    const control = root?.querySelector('button');
    expect(control?.id).toBe('open-now');
    expect(control?.getAttribute('aria-describedby')).toBe('filters');
  });
});
