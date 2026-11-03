import '../../dist/components/ui-pagination.js';

import { afterEach, describe, expect, it } from 'vitest';

import { nextRender } from '../internal/test-utils.ts';

afterEach(() => {
  document.querySelectorAll('ui-pagination').forEach((node) => {
    node.remove();
  });
});

describe('ui-pagination', () => {
  it('is defined when its module loads', () => {
    expect(customElements.get('ui-pagination')).toBeDefined();
  });

  it('writes no attribute on its host: the host belongs to the page', async () => {
    const element = document.createElement('ui-pagination');
    document.body.append(element);
    await nextRender();
    expect(element.getAttributeNames()).toEqual([]);
  });

  it('reflects only disabled on its host', async () => {
    const element = document.createElement('ui-pagination');
    document.body.append(element);
    Object.assign(element, {
      page: 2,
      pageCount: 5,
      showStatus: true,
      showJump: true,
      label: 'Results',
      disabled: true,
    });
    await nextRender();
    expect(element.getAttributeNames()).toEqual(['disabled']);
  });

  it('takes its first page and its counts from attributes, as a page writes them in HTML', async () => {
    document.body.insertAdjacentHTML(
      'beforeend',
      '<ui-pagination page="3" page-count="7" sibling-count="0" boundary-count="2" show-status></ui-pagination>',
    );
    const element = document.querySelector('ui-pagination');
    await nextRender();
    expect(element?.page).toBe(3);
    expect(element?.pageCount).toBe(7);
    expect(element?.siblingCount).toBe(0);
    expect(element?.boundaryCount).toBe(2);
    expect(element?.shadowRoot?.querySelector('[part~="status"]')?.textContent).toBe('Page 3 of 7');
  });

  it('holds the new page in its page property, and keeps it when the change is canceled', async () => {
    const element = document.createElement('ui-pagination');
    element.pageCount = 5;
    document.body.append(element);
    await nextRender();
    const pageButton = (page: number) =>
      element.shadowRoot?.querySelector<HTMLButtonElement>(`[aria-label="Page ${String(page)}"]`);
    pageButton(2)?.click();
    await nextRender();
    expect(element.page).toBe(2);
    element.addEventListener('ui-page-change', (event) => {
      event.preventDefault();
    });
    pageButton(3)?.click();
    await nextRender();
    expect(element.page).toBe(2);
  });

  it('renders links once the page sets getPageHref as a property', async () => {
    const element = document.createElement('ui-pagination');
    element.pageCount = 3;
    document.body.append(element);
    await nextRender();
    expect(element.shadowRoot?.querySelector('a')).toBeNull();
    element.getPageHref = (page) => `?page=${String(page)}`;
    await nextRender();
    const link = element.shadowRoot?.querySelector('[aria-label="Page 2"]');
    expect(link?.getAttribute('href')).toBe('?page=2');
  });
});
