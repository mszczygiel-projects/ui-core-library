import '../../dist/components/ui-date-field.js';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { nextRender } from '../internal/test-utils.ts';

type FieldElement = HTMLUiDateFieldElement & {
  formResetCallback(): void;
  formStateRestoreCallback(state: string): void;
};

const fixtures: HTMLElement[] = [];
function create() {
  const form = document.createElement('form');
  document.body.append(form);
  fixtures.push(form);
  const field = document.createElement('ui-date-field') as FieldElement;
  field.name = 'entry';
  field.locale = 'pl-PL';

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

describe('ui-date-field', () => {
  it('separates current property and default attribute, synchronously', async () => {
    const { field, form } = create();
    field.setAttribute('value', '2026-01-05');
    form.append(field);
    await nextRender();
    field.value = '2026-12-31';
    expect(new FormData(form).get('entry')).toBe('2026-12-31');
    expect(field.getAttribute('value')).toBe('2026-01-05');
    field.setAttribute('value', '2026-02-03');
    field.formResetCallback();
    expect(field.value).toBe('2026-02-03');
    expect(field.validity.valid).toBe(true);
  });

  it('accepts a canonical property before attachment with the requested locale', async () => {
    const { field, form } = create();
    field.value = '2026-12-31';
    form.append(field);
    await nextRender();
    expect(inputOf(field).value).toBe('31.12.2026');
    expect(field.value).toBe('2026-12-31');
  });

  it('restores incomplete text and its locale, revalidates and never emits an edit', async () => {
    const { field, form } = create();
    form.append(field);
    await nextRender();
    const changed = vi.fn();
    field.addEventListener('ui-value-change', changed);
    field.formStateRestoreCallback(JSON.stringify({ text: '31.12.20', locale: 'pl-PL' }));
    expect(field.value).toBe('');
    expect(field.validity.customError).toBe(true);
    expect(new FormData(form).get('entry')).toBe('');
    await nextRender();
    expect(inputOf(field).value).toBe('31.12.20');
    expect(changed).not.toHaveBeenCalled();
    field.remove();
    form.append(field);
    await nextRender();
    expect(inputOf(field).value).toBe('31.12.20');
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
    field.setAttribute('value', '2026-01-05');
    form.append(field);
    await nextRender();
    field.value = '2026-12-31';
    field.remove();
    form.append(field);
    await nextRender();
    expect(field.value).toBe('2026-12-31');
    form.reset();
    await nextRender();
    expect(field.value).toBe('2026-01-05');
  });
});
