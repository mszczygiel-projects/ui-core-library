import '../../dist/components/ui-number-field.js';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { nextRender } from '../internal/test-utils.ts';

type FieldElement = HTMLUiNumberFieldElement & {
  formResetCallback(): void;
  formStateRestoreCallback(state: string): void;
};

const fixtures: HTMLElement[] = [];
function create() {
  const form = document.createElement('form');
  document.body.append(form);
  fixtures.push(form);
  const field = document.createElement('ui-number-field') as FieldElement;
  field.name = 'entry';
  field.locale = 'pl-PL';
  field.step = 0.1;
  return { field, form };
}
function inputOf(field: FieldElement): HTMLInputElement {
  const input = field.shadowRoot?.querySelector('input');
  if (!input) {
    throw new Error('Missing input');
  }
  return input;
}
afterEach(() => {
  for (const fixture of fixtures.splice(0)) {
    fixture.remove();
  }
});

describe('ui-number-field', () => {
  it('separates current property and default attribute, synchronously', async () => {
    const { field, form } = create();
    field.setAttribute('value', '12.5');
    form.append(field);
    await nextRender();
    field.value = 23.5;
    expect(new FormData(form).get('entry')).toBe('23.5');
    expect(field.getAttribute('value')).toBe('12.5');
    field.setAttribute('value', '3.5');
    field.formResetCallback();
    expect(field.value).toBe(3.5);
    expect(field.validity.valid).toBe(true);
  });

  it('accepts a canonical property before attachment with the requested locale', async () => {
    const { field, form } = create();
    field.value = 12.5;
    form.append(field);
    await nextRender();
    expect(inputOf(field).value).toBe('12,5');
    expect(field.value).toBe(12.5);
  });

  it('restores incomplete text and its locale, revalidates and never emits an edit', async () => {
    const { field, form } = create();
    form.append(field);
    await nextRender();
    const changed = vi.fn();
    field.addEventListener('ui-value-change', changed);
    field.formStateRestoreCallback(JSON.stringify({ text: '12,', locale: 'pl-PL' }));
    expect(field.value).toBe(null);
    expect(field.validity.customError).toBe(true);
    expect(new FormData(form).get('entry')).toBe('');
    await nextRender();
    expect(inputOf(field).value).toBe('12,');
    expect(changed).not.toHaveBeenCalled();
    field.remove();
    form.append(field);
    await nextRender();
    expect(inputOf(field).value).toBe('12,');
  });

  it('checks required validity before first render and reflects only allowed attributes', async () => {
    const { field, form } = create();
    field.required = true;
    field.state = 'error';
    form.append(field);
    expect(field.validity.valueMissing).toBe(true);
    expect(form.checkValidity()).toBe(false);
    await nextRender();
    expect(field.getAttributeNames()).toEqual(['name']);
    field.disabled = true;
    field.readOnly = true;
    await nextRender();
    expect(field.getAttributeNames().sort()).toEqual(['disabled', 'name', 'readonly']);
  });

  it('reconnects without losing assigned value or default semantics', async () => {
    const { field, form } = create();
    field.setAttribute('value', '12.5');
    form.append(field);
    await nextRender();
    field.value = 23.5;
    field.remove();
    form.append(field);
    await nextRender();
    expect(field.value).toBe(23.5);
    form.reset();
    await nextRender();
    expect(field.value).toBe(12.5);
  });
});
