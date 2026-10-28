import '../../dist/components/ui-checkbox-field.js';

import { afterEach, describe, expect, it } from 'vitest';

import { nextRender } from '../internal/test-utils.ts';

/** The element with the form callbacks the browser calls. */
type Field = HTMLUiCheckboxFieldElement & {
  formResetCallback(): void;
  formStateRestoreCallback(state: string): void;
};

async function mount(attributes: Record<string, string> = {}): Promise<Field> {
  const element = document.createElement('ui-checkbox-field') as Field;
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }
  document.body.append(element);
  await nextRender();
  return element;
}

function inputOf(field: Field): HTMLInputElement {
  const input = field.shadowRoot?.querySelector('input');
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('Missing native checkbox');
  }
  return input;
}

afterEach(() => {
  document.querySelectorAll('ui-checkbox-field').forEach((node) => {
    node.remove();
  });
});

describe('ui-checkbox-field', () => {
  it('is defined when its module loads', () => {
    expect(customElements.get('ui-checkbox-field')).toBeDefined();
  });

  it('reflects only name and disabled to its host', async () => {
    const field = await mount();
    Object.assign(field, { label: 'Terms', state: 'error', checked: true, indeterminate: true });
    await nextRender();
    expect(field.getAttributeNames()).toEqual([]);
    Object.assign(field, { name: 'terms', disabled: true });
    await nextRender();
    expect(field.getAttributeNames().sort()).toEqual(['disabled', 'name']);
  });

  it('keeps the checked attribute as the state that a reset restores', async () => {
    const field = await mount({ checked: '' });
    inputOf(field).click();
    await nextRender();
    expect(field.checked).toBe(false);
    expect(field.hasAttribute('checked')).toBe(true);
    field.formResetCallback();
    await nextRender();
    expect(inputOf(field).checked).toBe(true);
  });

  it('restores the checked state that the browser saved', async () => {
    const field = await mount();
    field.formStateRestoreCallback('on');
    await nextRender();
    expect(inputOf(field).checked).toBe(true);
    field.formStateRestoreCallback('off');
    await nextRender();
    expect(inputOf(field).checked).toBe(false);
  });

  it('ends the mixed state of its prop when a user clicks it', async () => {
    const field = await mount({ indeterminate: '' });
    inputOf(field).click();
    await nextRender();
    expect(field.indeterminate).toBe(false);
    expect(field.checked).toBe(true);
  });
});
