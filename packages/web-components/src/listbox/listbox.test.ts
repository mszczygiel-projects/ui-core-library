import '../../dist/components/ui-listbox.js';

import { afterEach, describe, expect, it } from 'vitest';

import { nextRender } from '../internal/test-utils.ts';

/** The element with the form callbacks the browser calls. */
type List = HTMLUiListboxElement & {
  formResetCallback(): void;
  formStateRestoreCallback(state: FormData | string): void;
};

const options = [
  { value: 'a', label: 'Apple' },
  { value: 'b', label: 'Banana', disabled: true },
  { value: 'c', label: 'Cherry' },
];

async function mount(
  properties: Partial<HTMLUiListboxElement> = {},
  attributes: Record<string, string> = {},
) {
  const list = document.createElement('ui-listbox') as List;
  for (const [name, value] of Object.entries(attributes)) {
    list.setAttribute(name, value);
  }
  Object.assign(list, { options, label: 'Fruit' }, properties);
  document.body.append(list);
  await nextRender();
  return list;
}

function listOf(list: List): HTMLElement {
  const element = list.shadowRoot?.querySelector<HTMLElement>('[role="listbox"]');
  if (element === null || element === undefined) {
    throw new Error('Expected the list');
  }
  return element;
}

function press(list: List, key: string): void {
  listOf(list).dispatchEvent(
    new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
  );
}

afterEach(() => {
  document.querySelectorAll('ui-listbox').forEach((node) => {
    node.remove();
  });
});

describe('ui-listbox', () => {
  it('reflects only name and disabled to its host', async () => {
    const list = await mount({ value: 'a', state: 'error', required: true, multiple: true });
    expect(list.getAttributeNames()).toEqual([]);
    Object.assign(list, { name: 'fruit', disabled: true });
    await nextRender();
    expect(list.getAttributeNames().sort()).toEqual(['disabled', 'name']);
  });

  it('passes the aria-label of its host to the list', async () => {
    const list = await mount({ label: undefined }, { 'aria-label': 'Fruit' });
    expect(listOf(list).getAttribute('aria-label')).toBe('Fruit');
  });

  it('keeps the value attribute as the single value that a reset restores', async () => {
    const list = await mount({}, { value: 'a' });
    listOf(list).focus();
    press(list, 'ArrowDown');
    await nextRender();
    expect(list.value).toBe('c');
    expect(list.getAttribute('value')).toBe('a');
    list.formResetCallback();
    expect(list.value).toBe('a');
  });

  it('keeps defaultValue as the multiple value that a reset restores', async () => {
    const list = await mount({ multiple: true, defaultValue: ['c'] });
    expect(list.value).toEqual(['c']);
    list.value = ['a', 'c'];
    list.formResetCallback();
    expect(list.value).toEqual(['c']);
  });

  it('restores the choice that the browser saved', async () => {
    const list = await mount({ multiple: true });
    const state = new FormData();
    state.append('value', 'a');
    state.append('value', 'c');
    list.formStateRestoreCallback(state);
    expect(list.value).toEqual(['a', 'c']);
  });

  it('reshapes its value when multiple changes', async () => {
    const list = await mount({ value: 'a' });
    list.multiple = true;
    await nextRender();
    expect(list.value).toEqual(['a']);
  });
});
