import '../../dist/components/ui-chip.js';

import { afterEach, describe, expect, it } from 'vitest';

import { nextRender } from '../internal/test-utils.ts';

afterEach(() => {
  document.querySelectorAll('ui-chip').forEach((node) => {
    node.remove();
  });
});

describe('ui-chip', () => {
  it('is defined when its module loads', () => {
    expect(customElements.get('ui-chip')).toBeDefined();
  });

  it('writes no attribute on its host: the host belongs to the page', async () => {
    const element = document.createElement('ui-chip');
    document.body.append(element);
    await nextRender();
    expect(element.getAttributeNames()).toEqual([]);
  });

  it('reflects only disabled to its host', async () => {
    const element = Object.assign(document.createElement('ui-chip'), {
      variant: 'subtle',
      size: 'small',
      selectable: true,
      selected: true,
      dismissible: true,
    });
    document.body.append(element);
    await nextRender();
    expect(element.getAttributeNames()).toEqual([]);
    element.disabled = true;
    await nextRender();
    expect(element.getAttributeNames()).toEqual(['disabled']);
  });

  it('takes its initial state from the selected attribute and keeps the current one in its property', async () => {
    const element = document.createElement('ui-chip');
    element.setAttribute('selectable', '');
    element.setAttribute('selected', '');
    element.textContent = 'Open now';
    document.body.append(element);
    await nextRender();
    const control = element.shadowRoot?.querySelector('button');
    expect(control?.getAttribute('aria-pressed')).toBe('true');
    control?.click();
    await nextRender();
    expect(element.selected).toBe(false);
    expect(element.getAttribute('selected')).toBe('');
    expect(control?.getAttribute('aria-pressed')).toBe('false');
  });
});
