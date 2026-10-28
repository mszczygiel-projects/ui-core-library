import { createRef } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { PasswordField } from './PasswordField.tsx';

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });
}

describe('PasswordField', () => {
  it('passes its ref to its native control', async () => {
    const ref = createRef<HTMLInputElement>();
    await render(<PasswordField label="Field" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('renders on a server and hydrates without a warning', async () => {
    const element = (
      <PasswordField label="Password" hint="At least 12 characters" defaultRevealed />
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

  it('leaves a controlled visibility to its owner', async () => {
    const changed = vi.fn();
    const screen = await render(
      <PasswordField label="Password" revealed={false} onRevealedChange={changed} />,
    );
    await screen.getByRole('button').click();
    expect(changed).toHaveBeenCalledExactlyOnceWith(true, expect.anything());
    expect(screen.container.querySelector('input')?.type).toBe('password');
  });
});
