import '../../dist/components/ui-menu.js';

import { afterEach, describe, expect, it } from 'vitest';

import { nextRender } from '../internal/test-utils.ts';

afterEach(() => {
  document.querySelectorAll('ui-menu').forEach((node) => {
    node.remove();
  });
});

describe('ui-menu', () => {
  it('is defined when its module loads', () => {
    expect(customElements.get('ui-menu')).toBeDefined();
  });

  it('writes no attribute on its host: the host belongs to the page', async () => {
    const element = document.createElement('ui-menu');
    document.body.append(element);
    await nextRender();
    expect(element.getAttributeNames()).toEqual([]);
  });

  it('opens from the open attribute, which follows the menu', async () => {
    const element = document.createElement('ui-menu');
    element.options = [{ value: 'copy', label: 'Copy' }];
    element.setAttribute('open', '');
    element.innerHTML = '<button slot="trigger">Actions</button>';
    document.body.append(element);
    await nextRender();
    const menu = element.shadowRoot?.querySelector('[part~="menu"]');
    expect(menu?.matches(':popover-open')).toBe(true);
    element.open = false;
    await nextRender();
    expect(element.hasAttribute('open')).toBe(false);
    expect(menu?.matches(':popover-open')).toBe(false);
  });

  it('gives a replaced trigger the relationship to the menu', async () => {
    const element = document.createElement('ui-menu');
    element.innerHTML = '<button slot="trigger">Actions</button>';
    document.body.append(element);
    await nextRender();
    const next = document.createElement('button');
    next.slot = 'trigger';
    next.textContent = 'More';
    element.replaceChildren(next);
    await nextRender();
    expect(next.getAttribute('aria-haspopup')).toBe('menu');
    expect(next.getAttribute('aria-expanded')).toBe('false');
  });
});
