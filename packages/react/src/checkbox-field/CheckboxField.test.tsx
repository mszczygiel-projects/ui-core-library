import { createRef } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { CheckboxField } from './CheckboxField.tsx';

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });
}

describe('CheckboxField', () => {
  it('passes its ref to its native control', async () => {
    const ref = createRef<HTMLInputElement>();
    await render(<CheckboxField ref={ref} label="Terms" />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('renders on a server and hydrates without a warning', async () => {
    const html = renderToString(
      <CheckboxField label="Terms" hint="Required" defaultChecked indeterminate />,
    );
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.append(container);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const recoverable = vi.fn();
    const root = hydrateRoot(
      container,
      <CheckboxField label="Terms" hint="Required" defaultChecked indeterminate />,
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

  it('sets the mixed state again on the next render while the prop stays on', async () => {
    const ref = createRef<HTMLInputElement>();
    const screen = await render(<CheckboxField ref={ref} label="All" indeterminate />);
    ref.current?.click();
    expect(ref.current?.indeterminate).toBe(false);
    await screen.rerender(<CheckboxField ref={ref} label="All" indeterminate />);
    expect(ref.current?.indeterminate).toBe(true);
  });
});
