import '../../dist/components/ui-badge.js';

import { afterEach, describe, expect, it } from 'vitest';

import { nextRender } from '../internal/test-utils.ts';

afterEach(() => {
  document.querySelectorAll('ui-badge').forEach((node) => {
    node.remove();
  });
});

describe('ui-badge', () => {
  it('is defined when its module loads', () => {
    expect(customElements.get('ui-badge')).toBeDefined();
  });

  it('writes no attribute on its host: the host belongs to the page', async () => {
    const element = document.createElement('ui-badge');
    document.body.append(element);
    await nextRender();
    expect(element.getAttributeNames()).toEqual([]);
  });

  it('reads its public attributes and renders its defaults for unknown values', async () => {
    const element = document.createElement('ui-badge');
    element.setAttribute('tone', 'warning');
    element.setAttribute('variant', 'subtle');
    element.setAttribute('size', 'huge');
    element.setAttribute('shape', 'square');
    element.textContent = 'Pending';
    document.body.append(element);
    await nextRender();
    const base = element.shadowRoot?.querySelector('[part="base"]');
    expect(base?.className).toBe('base warning subtle medium square');
    expect(element.getAttributeNames().sort()).toEqual(['shape', 'size', 'tone', 'variant']);
  });

  it('keeps the role and the name that the page writes on its host', async () => {
    const element = document.createElement('ui-badge');
    element.setAttribute('role', 'status');
    element.setAttribute('aria-label', 'Build state');
    element.textContent = 'Passing';
    document.body.append(element);
    await nextRender();
    Object.assign(element, { label: 'Ignored', tone: 'success' });
    element.textContent = '';
    element.append(Object.assign(document.createElement('span'), { slot: 'icon' }));
    await nextRender();
    expect(element.getAttribute('role')).toBe('status');
    expect(element.getAttribute('aria-label')).toBe('Build state');
  });

  it('becomes an image named by its label once only an icon is left', async () => {
    const element = Object.assign(document.createElement('ui-badge'), { label: 'Verified' });
    element.append(Object.assign(document.createElement('span'), { slot: 'icon' }), '  ');
    document.body.append(element);
    await nextRender();
    const base = element.shadowRoot?.querySelector('[part="base"]');
    expect(base?.getAttribute('role')).toBe('img');
    expect(base?.getAttribute('aria-label')).toBe('Verified');
    element.append('Verified seller');
    await nextRender();
    expect(base?.hasAttribute('role')).toBe(false);
    expect(base?.hasAttribute('aria-label')).toBe(false);
  });
});
