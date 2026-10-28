import '../../dist/components/ui-radio-group.js';
import '../../dist/components/ui-radio-field.js';

import { afterEach, describe, expect, it } from 'vitest';

import { nextRender } from '../internal/test-utils.ts';

/** The element with the form callbacks the browser calls. */
type Group = HTMLUiRadioGroupElement & {
  formResetCallback(): void;
  formStateRestoreCallback(state: string): void;
};

async function mount(values: readonly string[], attributes: Record<string, string> = {}) {
  const group = document.createElement('ui-radio-group') as Group;
  for (const [name, value] of Object.entries(attributes)) {
    group.setAttribute(name, value);
  }
  for (const value of values) {
    group.append(Object.assign(document.createElement('ui-radio-field'), { value, label: value }));
  }
  document.body.append(group);
  await nextRender();
  return group;
}

function radiosOf(group: Group): HTMLInputElement[] {
  return [...group.querySelectorAll('ui-radio-field')].flatMap((option) => {
    const input = option.shadowRoot?.querySelector('input');
    return input instanceof HTMLInputElement ? [input] : [];
  });
}

afterEach(() => {
  document.querySelectorAll('ui-radio-group, ui-radio-field').forEach((node) => {
    node.remove();
  });
});

describe('ui-radio-group', () => {
  it('reflects only name and disabled to the hosts of the group and its options', async () => {
    const group = await mount(['a', 'b']);
    Object.assign(group, { label: 'Pick', value: 'a', state: 'error', required: true });
    await nextRender();
    expect(group.getAttributeNames()).toEqual([]);
    for (const option of group.querySelectorAll('ui-radio-field')) {
      expect(option.getAttributeNames()).toEqual([]);
    }
    Object.assign(group, { name: 'pick', disabled: true });
    await nextRender();
    expect(group.getAttributeNames().sort()).toEqual(['disabled', 'name']);
  });

  it('keeps the value attribute as the value that a reset restores', async () => {
    const group = await mount(['a', 'b'], { value: 'a' });
    radiosOf(group)[1]?.click();
    await nextRender();
    expect(group.value).toBe('b');
    expect(group.getAttribute('value')).toBe('a');
    group.formResetCallback();
    await nextRender();
    expect(radiosOf(group).map((radio) => radio.checked)).toEqual([true, false]);
  });

  it('restores the value that the browser saved', async () => {
    const group = await mount(['a', 'b']);
    group.formStateRestoreCallback('b');
    await nextRender();
    expect(radiosOf(group).map((radio) => radio.checked)).toEqual([false, true]);
  });

  it('takes in options that join later and gives their place in the group', async () => {
    const group = await mount(['a'], { value: 'b' });
    group.append(Object.assign(document.createElement('ui-radio-field'), { value: 'b' }));
    await nextRender();
    expect(radiosOf(group).map((radio) => radio.checked)).toEqual([false, true]);
    expect(radiosOf(group).map((radio) => radio.getAttribute('aria-posinset'))).toEqual(['1', '2']);
    expect(radiosOf(group)[0]?.getAttribute('aria-setsize')).toBe('2');
  });

  it('leaves the options of a nested group to that group', async () => {
    const outer = await mount(['a'], { value: 'a' });
    const inner = document.createElement('ui-radio-group');
    inner.append(Object.assign(document.createElement('ui-radio-field'), { value: 'a' }));
    outer.append(inner);
    await nextRender();
    expect(radiosOf(outer).map((radio) => radio.checked)).toEqual([true, false]);
  });
});
