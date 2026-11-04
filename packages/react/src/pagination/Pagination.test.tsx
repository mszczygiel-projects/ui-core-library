import { createRef, type ReactElement } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { Pagination } from './Pagination.tsx';

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

describe('Pagination', () => {
  it('passes its ref to its root element', async () => {
    const ref = createRef<HTMLElement>();
    await render(<Pagination ref={ref} pageCount={5} />);
    expect(ref.current?.tagName).toBe('NAV');
  });

  it('renders on a server and hydrates without a warning', async () => {
    await expectHydrates(<Pagination pageCount={10} defaultPage={5} showStatus showJump />);
  });

  it('puts every link of link mode in the HTML of the server, previous and next among them', async () => {
    const element = (
      <Pagination pageCount={10} defaultPage={5} getPageHref={(page) => `?page=${String(page)}`} />
    );
    const container = document.createElement('div');
    container.innerHTML = renderToString(element);
    const links = [...container.querySelectorAll('a[href]')].map((link) => [
      link.getAttribute('href'),
      link.getAttribute('rel'),
    ]);
    expect(links).toEqual([
      ['?page=4', 'prev'],
      ['?page=1', null],
      ['?page=4', null],
      ['?page=5', null],
      ['?page=6', null],
      ['?page=10', null],
      ['?page=6', 'next'],
    ]);
    await expectHydrates(element);
  });

  it('follows a controlled page, and moves only when the page prop changes', async () => {
    const onPageChange = vi.fn();
    const screen = await render(<Pagination pageCount={5} page={2} onPageChange={onPageChange} />);
    const current = () => screen.container.querySelector('[aria-current="page"]')?.textContent;
    await screen.getByRole('button', { name: 'Page 3' }).click();
    expect(onPageChange).toHaveBeenCalledWith(3, expect.objectContaining({ reason: 'page' }));
    expect(current()).toBe('2');
    await screen.rerender(<Pagination pageCount={5} page={3} onPageChange={onPageChange} />);
    expect(current()).toBe('3');
  });

  it('keeps the page within the count when the count shrinks', async () => {
    const screen = await render(<Pagination pageCount={10} page={8} />);
    await screen.rerender(<Pagination pageCount={4} page={8} />);
    expect(screen.container.querySelector('[aria-current="page"]')?.textContent).toBe('4');
  });
});
