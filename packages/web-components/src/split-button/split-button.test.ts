import '../../dist/components/ui-split-button.js';

import { afterEach, describe, expect, it } from 'vitest';

import { nextRender } from '../internal/test-utils.ts';

afterEach(() => {
  document.querySelectorAll('ui-split-button').forEach((node) => {
    node.remove();
  });
});

describe('ui-split-button', () => {
  it('is defined when its module loads', () => {
    expect(customElements.get('ui-split-button')).toBeDefined();
  });

  it('writes no attribute on its host: the host belongs to the page', async () => {
    const element = document.createElement('ui-split-button');
    document.body.append(element);
    await nextRender();
    expect(element.getAttributeNames()).toEqual([]);
  });

  it('activates its main button through click(), as a native button does', async () => {
    const element = document.createElement('ui-split-button');
    element.options = [{ value: 'draft', label: 'Save as draft' }];
    element.textContent = 'Save';
    document.body.append(element);
    await nextRender();
    let clicks = 0;
    element.addEventListener('click', () => {
      clicks += 1;
    });
    element.click();
    expect(clicks).toBe(1);
    expect(
      element.shadowRoot?.querySelector('[part~="toggle"]')?.getAttribute('aria-expanded'),
    ).toBe('false');
  });

  it('opens from the open attribute and closes when it loses its last enabled action', async () => {
    const element = document.createElement('ui-split-button');
    element.options = [{ value: 'draft', label: 'Save as draft' }];
    element.setAttribute('open', '');
    document.body.append(element);
    await nextRender();
    const toggle = element.shadowRoot?.querySelector('[part~="toggle"]');
    expect(toggle?.getAttribute('aria-expanded')).toBe('true');
    element.options = [];
    await nextRender();
    await nextRender();
    expect(element.open).toBe(false);
    expect(element.hasAttribute('open')).toBe(false);
  });
});
