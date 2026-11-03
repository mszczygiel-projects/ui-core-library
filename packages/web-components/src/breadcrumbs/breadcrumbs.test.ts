import '../../dist/components/ui-breadcrumbs.js';

import { afterEach, describe, expect, it } from 'vitest';

import { nextRender } from '../internal/test-utils.ts';

afterEach(() => {
  document.querySelectorAll('ui-breadcrumbs').forEach((node) => {
    node.remove();
  });
});

describe('ui-breadcrumbs', () => {
  it('is defined when its module loads', () => {
    expect(customElements.get('ui-breadcrumbs')).toBeDefined();
  });

  it('writes no attribute on its host: the host belongs to the page', async () => {
    const element = document.createElement('ui-breadcrumbs');
    document.body.append(element);
    await nextRender();
    expect(element.getAttributeNames()).toEqual([]);
  });

  it('reflects none of its props on its host', async () => {
    const element = document.createElement('ui-breadcrumbs');
    document.body.append(element);
    Object.assign(element, {
      items: [{ label: 'Home', href: '#home' }, { label: 'Widget' }],
      label: 'Trail',
      size: 'small',
      separator: 'slash',
    });
    await nextRender();
    expect(element.getAttributeNames()).toEqual([]);
  });

  it('takes its scalar props from attributes, as a page writes them in HTML', async () => {
    document.body.insertAdjacentHTML(
      'beforeend',
      '<ui-breadcrumbs size="small" separator="slash" label="Trail"></ui-breadcrumbs>',
    );
    const element = document.querySelector('ui-breadcrumbs');
    await nextRender();
    expect(element?.size).toBe('small');
    expect(element?.separator).toBe('slash');
    expect(element?.label).toBe('Trail');
  });

  it('renders the items that the page sets later as a property', async () => {
    const element = document.createElement('ui-breadcrumbs');
    document.body.append(element);
    await nextRender();
    expect(element.shadowRoot?.querySelectorAll('li')).toHaveLength(0);
    element.items = [{ label: 'Home', href: '#home' }, { label: 'Widget' }];
    await nextRender();
    const current = element.shadowRoot?.querySelector('[part~="current"]');
    expect(current?.textContent).toBe('Widget');
    expect(element.shadowRoot?.querySelector('[part~="link"]')?.getAttribute('href')).toBe('#home');
  });
});
