import { createRef, type ReactElement } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { Breadcrumbs } from './Breadcrumbs.tsx';

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });
}

/** Renders an element on a server, hydrates it, and fails on any warning. */
async function expectHydrates(element: ReactElement) {
  const container = document.createElement('div');
  container.innerHTML = renderToString(element);
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
}

const trail = [
  { label: 'Home', href: '#home', icon: <svg data-testid="home" /> },
  { label: 'Products', href: '#products' },
  { label: 'Widget' },
];

describe('Breadcrumbs', () => {
  it('passes its ref to its root element', async () => {
    const ref = createRef<HTMLElement>();
    await render(<Breadcrumbs ref={ref} items={trail} />);
    expect(ref.current?.tagName).toBe('NAV');
  });

  it('renders on a server and hydrates without a warning', async () => {
    await expectHydrates(<Breadcrumbs items={trail} separator="slash" />);
  });

  it('passes className and data attributes to its root element', async () => {
    const screen = await render(
      <Breadcrumbs items={trail} className="extra" data-testid="trail" />,
    );
    const root = screen.container.querySelector('.ui-breadcrumbs');
    expect(root?.classList.contains('extra')).toBe(true);
    expect(root?.getAttribute('data-testid')).toBe('trail');
  });

  it('renders a node as the icon of an item', async () => {
    const screen = await render(<Breadcrumbs items={trail} />);
    const icon = screen.container.querySelector('.ui-breadcrumbs__item-icon');
    expect(icon?.querySelector('[data-testid="home"]')).not.toBeNull();
    expect(icon?.getAttribute('aria-hidden')).toBe('true');
  });
});
