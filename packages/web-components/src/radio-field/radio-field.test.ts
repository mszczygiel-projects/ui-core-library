import '../../dist/components/ui-radio-field.js';

import { afterEach, describe, expect, it } from 'vitest';

import { nextRender } from '../internal/test-utils.ts';

afterEach(() => {
  document.querySelectorAll('ui-radio-field').forEach((node) => {
    node.remove();
  });
});

describe('ui-radio-field', () => {
  it('is defined when its module loads', () => {
    expect(customElements.get('ui-radio-field')).toBeDefined();
  });

  it('writes no attribute on its host apart from disabled', async () => {
    const option = document.createElement('ui-radio-field');
    Object.assign(option, { value: 'a', label: 'A', hint: 'First' });
    document.body.append(option);
    await nextRender();
    expect(option.getAttributeNames()).toEqual([]);
    option.disabled = true;
    await nextRender();
    expect(option.getAttributeNames()).toEqual(['disabled']);
  });

  it('gives no place in a group when it stands alone', async () => {
    const option = document.createElement('ui-radio-field');
    document.body.append(option);
    await nextRender();
    const input = option.shadowRoot?.querySelector('input');
    expect(input?.hasAttribute('aria-posinset')).toBe(false);
    expect(input?.tabIndex).toBe(0);
  });
});
