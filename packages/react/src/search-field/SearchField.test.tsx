import { createRef } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { SearchField } from './SearchField.tsx';

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });
}

describe('SearchField', () => {
  it('passes its ref to its native control', async () => {
    const ref = createRef<HTMLInputElement>();
    await render(<SearchField label="Field" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('renders on a server and hydrates without a warning', async () => {
    const element = <SearchField label="Search" defaultValue="shoes" />;
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

  it('leaves a controlled query to its owner when cleared', async () => {
    const changed = vi.fn();
    const screen = await render(
      <SearchField label="Search" value="shoes" onValueChange={changed} />,
    );
    await screen.getByRole('button').click();
    expect(changed).toHaveBeenCalledExactlyOnceWith('', expect.anything());
    expect(screen.container.querySelector('input')?.value).toBe('shoes');
  });
});
