import '../../dist/components/ui-radio-field.js';

import { expect, it } from 'vitest';

import { nextRender } from '../internal/test-utils.ts';

it('connects existing options when the group module loads later', async () => {
  expect(customElements.get('ui-radio-group')).toBeUndefined();
  const form = document.createElement('form');
  form.innerHTML = `
    <ui-radio-group name="pick">
      <ui-radio-field value="a" label="A"></ui-radio-field>
      <ui-radio-field value="b" label="B"></ui-radio-field>
    </ui-radio-group>`;
  document.body.append(form);
  try {
    await nextRender();
    await import('../../dist/components/ui-radio-group.js');
    await nextRender();
    const group = form.querySelector('ui-radio-group');
    const options = [...form.querySelectorAll('ui-radio-field')];
    const first = options[0]?.shadowRoot?.querySelector('input');
    first?.click();
    expect(group?.value).toBe('a');
    expect(new FormData(form).get('pick')).toBe('a');
    await nextRender();
    expect(first?.getAttribute('aria-setsize')).toBe('2');
    first?.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true,
        composed: true,
        cancelable: true,
      }),
    );
    expect(group?.value).toBe('b');
    expect(new FormData(form).get('pick')).toBe('b');
    const second = options[1];
    if (second !== undefined) {
      second.value = 'updated';
    }
    await nextRender();
    expect(new FormData(form).has('pick')).toBe(false);
  } finally {
    form.remove();
  }
});
