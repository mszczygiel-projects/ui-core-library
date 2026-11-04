import { createRef } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { Calendar } from './Calendar.tsx';

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });
}

describe('Calendar', () => {
  it('passes its ref to its root element', async () => {
    const ref = createRef<HTMLDivElement>();
    await render(<Calendar ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('reads no clock on a server, and shows today once hydrated', async () => {
    const html = renderToString(<Calendar locale="en-US" />);
    expect(html).not.toContain('gridcell');
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.append(container);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const recoverable = vi.fn();
    const root = hydrateRoot(container, <Calendar locale="en-US" />, {
      onRecoverableError: recoverable,
    });
    // Hydration and the render with the clock that follows it take an unknown number of frames
    // on a slow machine.
    await expect.poll(() => container.querySelector('[aria-current="date"]')).not.toBeNull();
    expect(recoverable).not.toHaveBeenCalled();
    expect(errors).not.toHaveBeenCalled();
    root.unmount();
    container.remove();
    errors.mockRestore();
  });

  it('renders a value on a server and hydrates it without a warning', async () => {
    const element = <Calendar locale="pl-PL" defaultValue="2026-07-08" />;
    const html = renderToString(element);
    expect(html).toContain('lipiec 2026');
    expect(html).not.toContain('aria-current');
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

  it('keeps a controlled value until its parent accepts a pick', async () => {
    const onValueChange = vi.fn();
    const screen = await render(
      <Calendar
        value="2026-07-08"
        today="2026-07-19"
        locale="en-US"
        onValueChange={onValueChange}
      />,
    );
    await screen.getByRole('gridcell', { name: 'Thursday, July 9, 2026' }).click();
    expect(onValueChange).toHaveBeenCalledWith('2026-07-09', expect.anything());
    await expect
      .element(screen.getByRole('gridcell', { name: 'Wednesday, July 8, 2026' }))
      .toHaveAttribute('aria-selected', 'true');
  });

  it('shows the month that a controlled parent sets', async () => {
    const screen = await render(<Calendar month="2026-03" today="2026-07-19" locale="en-US" />);
    await expect.element(screen.getByRole('grid', { name: 'March 2026' })).toBeInTheDocument();
    await screen.rerender(<Calendar month="2026-04" today="2026-07-19" locale="en-US" />);
    await expect.element(screen.getByRole('grid', { name: 'April 2026' })).toBeInTheDocument();
  });

  it('renders on a server and hydrates without a warning', async () => {
    const html = renderToString(<Calendar />);
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.append(container);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const recoverable = vi.fn();
    const root = hydrateRoot(container, <Calendar />, { onRecoverableError: recoverable });
    await nextFrame();
    await nextFrame();
    expect(recoverable).not.toHaveBeenCalled();
    expect(errors).not.toHaveBeenCalled();
    root.unmount();
    container.remove();
    errors.mockRestore();
  });
});
