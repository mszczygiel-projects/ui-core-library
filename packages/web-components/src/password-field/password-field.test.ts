import '../../dist/components/ui-password-field.js';

import { afterEach, describe, expect, it } from 'vitest';

import { nextRender } from '../internal/test-utils.ts';

/** The element with the form callbacks the browser calls. */
type Field = HTMLUiPasswordFieldElement & {
  formResetCallback(): void;
  formStateRestoreCallback(state: string): void;
};

async function mount(attributes: Record<string, string> = {}): Promise<Field> {
  const element = document.createElement('ui-password-field') as Field;
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
  document.querySelectorAll('ui-password-field').forEach((node) => {
    node.remove();
  });
});

describe('ui-password-field', () => {
  it('reflects only name, disabled and readonly to its host', async () => {
    const field = await mount();
    Object.assign(field, { label: 'Name', size: 'large', state: 'error', value: 'Ada' });
    await nextRender();
    expect(field.getAttributeNames()).toEqual([]);
    Object.assign(field, { name: 'entry', disabled: true, readOnly: true });
    await nextRender();
    expect(field.getAttributeNames().sort()).toEqual(['disabled', 'name', 'readonly']);
  });

  it('keeps the revealed attribute as the state that a reset restores', async () => {
    const field = await mount({ revealed: '' });
    expect(controlOf(field).type).toBe('text');
    field.shadowRoot?.querySelector('button')?.click();
    await nextRender();
    expect(controlOf(field).type).toBe('password');
    expect(field.hasAttribute('revealed')).toBe(true);
    field.formResetCallback();
    await nextRender();
    expect(controlOf(field).type).toBe('text');
  });

  it('never restores a password that the browser saved', async () => {
    const field = await mount({ value: 'initial' });
    field.formStateRestoreCallback('saved');
    await nextRender();
    expect(field.value).toBe('initial');
  });
});
