import { createRef } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { DateTimeField } from './DateTimeField.tsx';

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });
}

describe('DateTimeField', () => {
  it('passes its ref to its native control', async () => {
    const ref = createRef<HTMLInputElement>();
    await render(<DateTimeField ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('renders on a server and hydrates without a warning', async () => {
    const html = renderToString(<DateTimeField />);
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.append(container);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const recoverable = vi.fn();
    const root = hydrateRoot(container, <DateTimeField />, { onRecoverableError: recoverable });
    await nextFrame();
    await nextFrame();
    expect(recoverable).not.toHaveBeenCalled();
    expect(errors).not.toHaveBeenCalled();
    root.unmount();
    container.remove();
    errors.mockRestore();
  });

  it('submits only a controlled value accepted by its parent', async () => {
    const changed = vi.fn();
    const screen = await render(
      <form>
        <DateTimeField
          label="Date"
          locale="pl-PL"
          name="entry"
          value="2026-12-31T09:30"
          onValueChange={changed}
        />
      </form>,
    );
    const form = screen.container.querySelector('form');
    const input = screen.container.querySelector<HTMLInputElement>('input[type="text"]');
    if (form === null || input === null) {
      throw new Error('Missing form or date-time input');
    }
    await page.elementLocator(input).fill('31.12.2026 10:45');
    expect(changed).toHaveBeenCalledWith('2026-12-31T10:45', expect.anything());
    expect(new FormData(form).get('entry')).toBe('2026-12-31T09:30');
  });

  it('keeps the open picker synchronized with the controlled value', async () => {
    const changed = vi.fn();
    const screen = await render(
      <DateTimeField
        label="Appointment"
        locale="pl-PL"
        value="2026-07-08T09:30"
        onValueChange={changed}
      />,
    );
    const button = screen.container.querySelector<HTMLButtonElement>(
      'button[aria-haspopup="dialog"]',
    );
    if (button === null) {
      throw new Error('Missing picker button');
    }
    await page.elementLocator(button).click();
    await screen.rerender(
      <DateTimeField
        label="Appointment"
        locale="pl-PL"
        value="2026-08-09T11:15"
        onValueChange={changed}
      />,
    );
    const time = screen.container.querySelector<HTMLInputElement>('input[type="time"]');
    if (time === null) {
      throw new Error('Missing picker time');
    }
    await expect.poll(() => time.value).toBe('11:15');
    await page.elementLocator(time).fill('12:45');
    expect(changed).toHaveBeenCalledWith('2026-08-09T12:45', expect.anything());
    await expect.poll(() => time.value).toBe('11:15');
    expect(screen.container.querySelector<HTMLInputElement>('input[type="text"]')?.value).toBe(
      '09.08.2026 11:15',
    );
  });
});
