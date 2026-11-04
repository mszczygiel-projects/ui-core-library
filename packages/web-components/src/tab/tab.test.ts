import '../../dist/components/ui-tab.js';

import { afterEach, describe, expect, it } from 'vitest';

import { nextRender } from '../internal/test-utils.ts';

afterEach(() => {
  document.querySelectorAll('ui-tab').forEach((node) => {
    node.remove();
  });
});

describe('ui-tab', () => {
  it('is defined when its module loads', () => {
    expect(customElements.get('ui-tab')).toBeDefined();
  });

  it('writes no attribute on its host: the host belongs to the page', async () => {
    const element = document.createElement('ui-tab');
    document.body.append(element);
    await nextRender();
    expect(element.getAttributeNames()).toEqual([]);
  });

  it('reflects disabled', async () => {
    const element = document.createElement('ui-tab');
    element.disabled = true;
    document.body.append(element);
    await nextRender();
    expect(element.hasAttribute('disabled')).toBe(true);
  });

  it('shows its content outside a Tabs', async () => {
    const element = document.createElement('ui-tab');
    element.textContent = 'Content';
    document.body.append(element);
    await nextRender();
    expect(element.shadowRoot?.querySelector('slot')?.assignedNodes()).toHaveLength(1);
  });
});
