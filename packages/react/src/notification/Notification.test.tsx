import { createRef } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { Notification } from './Notification.tsx';

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });
}

describe('Notification', () => {
  it('passes its ref to its root element', async () => {
    const ref = createRef<HTMLDivElement>();
    await render(<Notification ref={ref} heading="Saved" />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it.each([false, true])(
    'renders on a server and hydrates without a warning, announce %s',
    async (announce) => {
      const element = (
        <Notification heading="Saved" announce={announce} dismissible hasLeadingIcon>
          Details
        </Notification>
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
    },
  );

  it('passes className, style and data attributes to its root element', async () => {
    const screen = await render(
      <Notification
        heading="Saved"
        className="extra"
        style={{ marginBlock: 0 }}
        data-testid="note"
      />,
    );
    const root = screen.container.querySelector('.ui-notification');
    expect(root?.classList.contains('extra')).toBe(true);
    expect(root?.getAttribute('data-testid')).toBe('note');
  });

  it('leaves out the description when it has no children', async () => {
    const screen = await render(<Notification heading="Saved" />);
    expect(screen.container.querySelector('.ui-notification__description')).toBeNull();
  });
});
