import '../../dist/components/ui-text-field.js';

import type { TextFieldProps } from '@mszczygiel-projects/ui-core-shared/text-field';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';

import { nextRender } from '../internal/test-utils.ts';

/** The element with the form callbacks the browser calls. */
type UiTextField = HTMLUiTextFieldElement & {
  formResetCallback(): void;
  formStateRestoreCallback(state: string): void;
};

function create(): UiTextField {
  return document.createElement('ui-text-field') as UiTextField;
}

async function mount(props: TextFieldProps = {}): Promise<UiTextField> {
  const field = Object.assign(create(), props);
  document.body.append(field);
  await nextRender();
  return field;
}

function inputOf(field: UiTextField): HTMLInputElement {
  const input = field.shadowRoot?.querySelector('input');
  if (!input) {
    throw new Error('Missing native input');
  }
  return input;
}

afterEach(() => {
  document.querySelectorAll('ui-text-field, form[data-text-field-test]').forEach((node) => {
    node.remove();
  });
});

describe('ui-text-field', () => {
  it('reflects only name, disabled and readonly to its host', async () => {
    const field = await mount({
      label: 'Name',
      size: 'large',
      variant: 'filled',
      value: 'Ada',
      state: 'error',
      required: true,
    });
    expect(field.getAttributeNames()).toEqual([]);
    field.name = 'account';
    field.disabled = true;
    field.readOnly = true;
    await nextRender();
    expect(field.getAttributeNames().sort()).toEqual(['disabled', 'name', 'readonly']);
  });

  it('keeps the value attribute for reset and restores saved state silently', async () => {
    const field = create();
    field.setAttribute('value', 'Initial');
    document.body.append(field);
    await nextRender();
    const edited = vi.fn();
    field.addEventListener('input', edited);
    field.addEventListener('change', edited);
    field.addEventListener('ui-value-change', edited);
    field.value = 'Assigned';
    await nextRender();
    expect(inputOf(field).value).toBe('Assigned');
    expect(field.getAttribute('value')).toBe('Initial');
    field.formStateRestoreCallback('Restored');
    await nextRender();
    expect(field.value).toBe('Restored');
    expect(inputOf(field).value).toBe('Restored');
    field.formResetCallback();
    await nextRender();
    expect(inputOf(field).value).toBe('Initial');
    expect(edited).not.toHaveBeenCalled();
  });

  it('keeps an edited or assigned value when the value attribute changes, as native inputs do', async () => {
    const field = create();
    field.setAttribute('value', 'Initial');
    document.body.append(field);
    await nextRender();
    field.setAttribute('value', 'Default');
    await nextRender();
    expect(inputOf(field).value).toBe('Default');
    await page.elementLocator(inputOf(field)).fill('Edited');
    field.setAttribute('value', 'Default after the edit');
    await nextRender();
    expect([field.value, inputOf(field).value]).toEqual(['Edited', 'Edited']);
    field.formResetCallback();
    await nextRender();
    expect(inputOf(field).value).toBe('Default after the edit');
    field.setAttribute('value', 'Default after the reset');
    await nextRender();
    expect(inputOf(field).value).toBe('Default after the reset');
    field.value = 'Assigned';
    field.setAttribute('value', 'Default after the assignment');
    await nextRender();
    expect(inputOf(field).value).toBe('Assigned');
  });

  it('normalizes restored and assigned values before exposing them', async () => {
    const form = document.createElement('form');
    form.dataset['textFieldTest'] = '';
    document.body.append(form);
    const field = await mount({ name: 'email', type: 'email' });
    form.append(field);
    await nextRender();
    field.formStateRestoreCallback(' ada@example.com ');
    expect([field.value, inputOf(field).value]).toEqual(['ada@example.com', 'ada@example.com']);
    expect(new FormData(form).get('email')).toBe('ada@example.com');
    field.value = '  grace@example.com  ';
    await nextRender();
    expect([field.value, new FormData(form).get('email')]).toEqual([
      'grace@example.com',
      'grace@example.com',
    ]);
  });

  it('gives its form a value assigned by a script at once, before the next render', async () => {
    const form = document.createElement('form');
    form.dataset['textFieldTest'] = '';
    document.body.append(form);
    const field = Object.assign(create(), { name: 'email', type: 'email', required: true });
    form.append(field);
    await nextRender();
    expect(form.checkValidity()).toBe(false);
    field.value = '  ada@example.com ';
    expect([field.value, new FormData(form).get('email')]).toEqual([
      'ada@example.com',
      'ada@example.com',
    ]);
    expect([field.checkValidity(), form.checkValidity()]).toEqual([true, true]);
    field.setAttribute('value', 'grace@example.com');
    expect(new FormData(form).get('email')).toBe('ada@example.com');
  });

  it('joins its form with its value and validity before its first render', () => {
    const form = document.createElement('form');
    form.dataset['textFieldTest'] = '';
    document.body.append(form);
    form.append(Object.assign(create(), { name: 'account', required: true }));
    expect([...new FormData(form)]).toEqual([['account', '']]);
    expect(form.checkValidity()).toBe(false);
  });

  it('enables its input in the render that clears disabled', async () => {
    const field = await mount({ label: 'Name', disabled: true });
    expect(inputOf(field).disabled).toBe(true);
    field.disabled = false;
    await nextRender();
    expect([inputOf(field).disabled, field.matches(':state(disabled)')]).toEqual([false, false]);
    field.focus();
    expect(field.shadowRoot?.activeElement).toBe(inputOf(field));
  });

  it('synchronizes custom validity with the host and its explicit form', async () => {
    const form = document.createElement('form');
    form.id = 'profile';
    form.dataset['textFieldTest'] = '';
    document.body.append(form);
    const field = await mount({ name: 'account', label: 'Account' });
    field.setAttribute('form', form.id);
    expect(field.form).toBe(form);
    field.setCustomValidity('Already taken');
    expect(field.validity.customError).toBe(true);
    expect(field.validationMessage).toBe('Already taken');
    expect(form.checkValidity()).toBe(false);
    const invalid = vi.fn();
    field.addEventListener('invalid', invalid);
    expect(field.checkValidity()).toBe(false);
    expect(invalid).toHaveBeenCalledOnce();
    field.setCustomValidity('');
    expect(field.reportValidity()).toBe(true);
    expect(field.willValidate).toBe(true);
    field.readOnly = true;
    await nextRender();
    expect(field.willValidate).toBe(false);
  });

  it('forwards the native editing hints and an author name without duplicating semantics', async () => {
    const field = await mount({ autoComplete: 'email' });
    field.setAttribute('inputmode', 'email');
    field.setAttribute('enterkeyhint', 'next');
    field.setAttribute('spellcheck', 'false');
    field.setAttribute('aria-label', 'Work email');
    await nextRender();
    const input = inputOf(field);
    expect([input.autocomplete, input.inputMode, input.enterKeyHint, input.spellcheck]).toEqual([
      'email',
      'email',
      'next',
      false,
    ]);
    expect(input.getAttribute('aria-label')).toBe('Work email');
    expect(field.hasAttribute('role')).toBe(false);
    field.removeAttribute('aria-label');
    await nextRender();
    expect(input.hasAttribute('aria-label')).toBe(false);
  });

  it('renders safe defaults after attributes are removed', async () => {
    const field = await mount();
    for (const [name, value] of Object.entries({
      type: 'email',
      size: 'large',
      variant: 'filled',
      'label-placement': 'floating',
      state: 'error',
    })) {
      field.setAttribute(name, value);
      field.removeAttribute(name);
    }
    await nextRender();
    expect(inputOf(field).type).toBe('text');
    expect(field.shadowRoot?.querySelector('form')?.className).toBe(
      'base outline medium top default',
    );
  });

  it('exposes the original composed input event and one typed value event', async () => {
    const field = await mount({ label: 'Name' });
    const native = vi.fn();
    const changed = vi.fn();
    field.addEventListener('input', native);
    field.addEventListener('ui-value-change', changed);
    await page.elementLocator(inputOf(field)).fill('Ada');
    expect(native).toHaveBeenCalledOnce();
    expect(changed).toHaveBeenCalledOnce();
    const event = changed.mock.calls[0]?.[0] as HTMLElementEventMap['ui-value-change'];
    expect(event.detail.originalEvent).toBe(native.mock.calls[0]?.[0]);
    expect([event.bubbles, event.composed, event.detail.value]).toEqual([true, true, 'Ada']);
  });
});
