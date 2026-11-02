import '../../dist/components/ui-combobox.js';

import { afterEach, describe, expect, it } from 'vitest';

import { nextRender } from '../internal/test-utils.ts';

const options = [
  { value: 'a', label: 'Apple' },
  { value: 'b', label: 'Banana' },
];

async function mount(properties: Partial<HTMLUiComboboxElement> = {}) {
  const field = document.createElement('ui-combobox');
  Object.assign(field, { options, label: 'Fruit' }, properties);
  document.body.append(field);
  await nextRender();
  return field;
}

function inputOf(field: HTMLUiComboboxElement): HTMLInputElement {
  const input = field.shadowRoot?.querySelector('input');
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('Expected the input');
  }
  return input;
}

afterEach(() => {
  document.querySelectorAll('ui-combobox').forEach((node) => {
    node.remove();
  });
});

describe('ui-combobox', () => {
  it('reflects only name, disabled and open to its host', async () => {
    const field = await mount({ value: 'a', state: 'error', required: true, clearable: true });
    expect(field.getAttributeNames()).toEqual([]);
    field.open = true;
    await nextRender();
    expect(field.getAttributeNames()).toEqual(['open']);
    Object.assign(field, { name: 'fruit', disabled: true });
    await nextRender();
    expect(field.getAttributeNames().sort()).toEqual(['disabled', 'name']);
  });

  it('holds a list of values in a multiple choice, with defaultValue as its reset value', async () => {
    const field = await mount({ multiple: true, defaultValue: ['b'] });
    expect(field.value).toEqual(['b']);
    field.value = ['a', 'b'];
    expect(field.value).toEqual(['a', 'b']);
    field.multiple = false;
    await nextRender();
    expect(field.value).toBe('a');
  });

  it('shows the label of a value set by script and gives the chips the Chip component', async () => {
    const field = await mount({ value: 'b' });
    expect(inputOf(field).value).toBe('Banana');
    Object.assign(field, { multiple: true, value: ['a', 'b'] });
    await nextRender();
    const chips = field.shadowRoot?.querySelectorAll('ui-chip') ?? [];
    expect([...chips].map((chip) => chip.textContent)).toEqual(['Apple', 'Banana']);
    expect(inputOf(field).value).toBe('');
  });

  it('passes the aria-label of its host to the input and the list', async () => {
    const field = await mount({ label: undefined });
    field.setAttribute('aria-label', 'Fruit');
    await nextRender();
    expect(inputOf(field).getAttribute('aria-label')).toBe('Fruit');
    expect(field.shadowRoot?.querySelector('[role="listbox"]')?.getAttribute('aria-label')).toBe(
      'Fruit',
    );
  });

  it('closes its list when it leaves the page', async () => {
    const field = await mount({ open: true });
    const popup = field.shadowRoot?.querySelector<HTMLElement>('.popup');
    expect(popup?.matches(':popover-open')).toBe(true);
    field.remove();
    expect(popup?.matches(':popover-open')).toBe(false);
  });
});
