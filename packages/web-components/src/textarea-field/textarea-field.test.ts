import '../../dist/components/ui-textarea-field.js';

import { afterEach, describe, expect, it } from 'vitest';

import { nextRender } from '../internal/test-utils.ts';

/** The element with the form callbacks the browser calls. */
type Field = HTMLUiTextareaFieldElement & {
  formResetCallback(): void;
  formStateRestoreCallback(state: string): void;
};

async function mount(attributes: Record<string, string> = {}): Promise<Field> {
  const element = document.createElement('ui-textarea-field') as Field;
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
  document.querySelectorAll('ui-textarea-field').forEach((node) => {
    node.remove();
  });
});

describe('ui-textarea-field', () => {
  it('reflects only name, disabled and readonly to its host', async () => {
    const field = await mount();
    Object.assign(field, { label: 'Name', size: 'large', state: 'error', value: 'Ada' });
    await nextRender();
    expect(field.getAttributeNames()).toEqual([]);
    Object.assign(field, { name: 'entry', disabled: true, readOnly: true });
    await nextRender();
    expect(field.getAttributeNames().sort()).toEqual(['disabled', 'name', 'readonly']);
  });

  it('restores a text that the browser saved, without an edit event', async () => {
    const field = await mount();
    let edits = 0;
    field.addEventListener('ui-value-change', () => {
      edits += 1;
    });
    field.formStateRestoreCallback('Line one\nLine two');
    await nextRender();
    expect(controlOf(field).value).toBe('Line one\nLine two');
    expect(edits).toBe(0);
  });

  it('gives the stylesheet the number of rows only for resize auto', async () => {
    const field = await mount();
    Object.assign(field, { maxRows: 4 });
    await nextRender();
    expect(controlOf(field).style.getPropertyValue('--_max-rows')).toBe('');
    Object.assign(field, { resize: 'auto' });
    await nextRender();
    expect(controlOf(field).style.getPropertyValue('--_max-rows')).toBe('4');
  });
});
