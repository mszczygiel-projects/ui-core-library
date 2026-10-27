import '../../dist/components/ui-search-field.js';

import { afterEach, describe, expect, it } from 'vitest';

import { nextRender } from '../internal/test-utils.ts';

/** The element with the form callbacks the browser calls. */
type Field = HTMLUiSearchFieldElement & {
  formResetCallback(): void;
  formStateRestoreCallback(state: string): void;
};

async function mount(attributes: Record<string, string> = {}): Promise<Field> {
  const element = document.createElement('ui-search-field') as Field;
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }
  document.body.append(element);
  await nextRender();
  return element;
}

function controlOf(field: Field): HTMLInputElement | HTMLTextAreaElement {
  const control = field.shadowRoot?.querySelector('input, textarea');
  if (!(control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement)) {
    throw new Error('Missing native control');
  }
  return control;
}

afterEach(() => {
  document.querySelectorAll('ui-search-field').forEach((node) => {
    node.remove();
  });
});

describe('ui-search-field', () => {
  it('reflects only name, disabled and readonly to its host', async () => {
    const field = await mount();
    Object.assign(field, { label: 'Name', size: 'large', state: 'error', value: 'Ada' });
    await nextRender();
    expect(field.getAttributeNames()).toEqual([]);
    Object.assign(field, { name: 'entry', disabled: true, readOnly: true });
    await nextRender();
    expect(field.getAttributeNames().sort()).toEqual(['disabled', 'name', 'readonly']);
  });

  it('restores a query that the browser saved, without an edit event', async () => {
    const field = await mount();
    let edits = 0;
    field.addEventListener('ui-value-change', () => {
      edits += 1;
    });
    field.formStateRestoreCallback('saved');
    await nextRender();
    expect(field.value).toBe('saved');
    expect(controlOf(field).value).toBe('saved');
    expect(edits).toBe(0);
  });
});
