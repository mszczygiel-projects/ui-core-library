import { createRef } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { TimeField } from './TimeField.tsx';

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });
}

describe('TimeField', () => {
  it('passes its ref to its native control', async () => {
    const ref = createRef<HTMLInputElement>();
    await render(<TimeField ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('keeps a consumer validation message when it rerenders', async () => {
    const ref = createRef<HTMLInputElement>();
    const screen = await render(<TimeField ref={ref} label="Start" />);
    ref.current?.setCustomValidity('Unavailable');
    await screen.rerender(<TimeField ref={ref} label="Time" />);
    expect(ref.current?.validationMessage).toBe('Unavailable');
  });

  it('rechecks the restored value after a form reset', async () => {
    const ref = createRef<HTMLInputElement>();
    const screen = await render(
      <form>
        <TimeField ref={ref} min="17:00" max="09:00" defaultValue="20:00" />
      </form>,
    );
    const input = ref.current;
    if (input === null) {
      throw new Error('Missing time input');
    }
    expect(input.validity.customError).toBe(true);
    input.value = '';
    await screen.rerender(
      <form>
        <TimeField ref={ref} label="Time" min="17:00" max="09:00" defaultValue="20:00" />
      </form>,
    );
    expect(input.validity.customError).toBe(false);
    input.form?.reset();
    await expect.poll(() => input.validity.customError).toBe(true);
  });

  it('renders on a server and hydrates without a warning', async () => {
    const html = renderToString(<TimeField />);
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.append(container);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const recoverable = vi.fn();
    const root = hydrateRoot(container, <TimeField />, { onRecoverableError: recoverable });
    await nextFrame();
    await nextFrame();
    expect(recoverable).not.toHaveBeenCalled();
    expect(errors).not.toHaveBeenCalled();
    root.unmount();
    container.remove();
    errors.mockRestore();
  });

  it('keeps a controlled value when its parent declines a time edit', async () => {
    const changed = vi.fn();
    const ref = createRef<HTMLInputElement>();
    await render(<TimeField label="Time" ref={ref} value="09:30" onValueChange={changed} />);
    if (ref.current === null) {
      throw new Error('Missing time input');
    }
    await page.elementLocator(ref.current).fill('10:45');
    expect(changed).toHaveBeenCalledWith('10:45', expect.anything());
    expect(ref.current.value).toBe('09:30');
  });
});
