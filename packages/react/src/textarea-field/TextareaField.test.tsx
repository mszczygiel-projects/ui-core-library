import { createRef } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { TextareaField } from './TextareaField.tsx';

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });
}

describe('TextareaField', () => {
  it('passes its ref to its native control', async () => {
    const ref = createRef<HTMLTextAreaElement>();
    await render(<TextareaField label="Field" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });

  it('renders on a server and hydrates without a warning', async () => {
    const element = (
      <TextareaField label="Message" resize="auto" maxRows={4} defaultValue="Hello" />
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

  it('passes className, style and data attributes to its root', async () => {
    const screen = await render(
      <TextareaField label="Message" className="extra" style={{ margin: 0 }} data-test="root" />,
    );
    const root = screen.container.querySelector('.ui-textarea-field');
    expect(root?.classList.contains('extra')).toBe(true);
    expect(root?.getAttribute('data-test')).toBe('root');
  });
});
