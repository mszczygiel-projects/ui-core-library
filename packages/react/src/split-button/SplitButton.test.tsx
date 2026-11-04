import { createRef } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { SplitButton } from './SplitButton.tsx';

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });
}

describe('SplitButton', () => {
  it('passes its ref to its main native button, and its class and data to its group', async () => {
    const ref = createRef<HTMLButtonElement>();
    const screen = await render(
      <SplitButton ref={ref} className="page" data-testid="save" options={[]}>
        Save
      </SplitButton>,
    );
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current?.textContent).toBe('Save');
    const group = screen.container.querySelector('[role="group"]');
    expect(group?.classList.contains('page')).toBe(true);
    expect(group?.getAttribute('data-testid')).toBe('save');
  });

  it('renders on a server and hydrates without a warning', async () => {
    const html = renderToString(<SplitButton />);
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.append(container);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const recoverable = vi.fn();
    const root = hydrateRoot(container, <SplitButton />, { onRecoverableError: recoverable });
    await nextFrame();
    await nextFrame();
    expect(recoverable).not.toHaveBeenCalled();
    expect(errors).not.toHaveBeenCalled();
    root.unmount();
    container.remove();
    errors.mockRestore();
  });

  it('runs onClick for its main action alone', async () => {
    const clicked = vi.fn();
    const screen = await render(
      <SplitButton options={[{ value: 'draft', label: 'Save as draft' }]} onClick={clicked}>
        Save
      </SplitButton>,
    );
    await screen.getByRole('button', { name: 'More actions' }).click();
    expect(clicked).not.toHaveBeenCalled();
    await screen.getByRole('button', { name: /save/i }).click();
    expect(clicked).toHaveBeenCalledOnce();
  });
});
