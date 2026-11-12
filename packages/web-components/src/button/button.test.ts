import '../../dist/components/ui-button.js';

import type { ButtonProps } from '@mszczygiel-projects/ui-core-shared/button';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';

import { nextRender } from '../internal/test-utils.ts';

/** The element with the form callbacks the browser calls. */
type UiButton = HTMLUiButtonElement & {
  formResetCallback(): void;
  formStateRestoreCallback(): void;
};

function create(): UiButton {
  return document.createElement('ui-button') as UiButton;
}

async function mount(props: ButtonProps = {}): Promise<UiButton> {
  const button = Object.assign(create(), props);
  button.textContent = 'Save';
  document.body.append(button);
  await nextRender();
  return button;
}

function control(button: UiButton): HTMLButtonElement | null | undefined {
  return button.shadowRoot?.querySelector('button');
}

afterEach(() => {
  document.querySelectorAll('ui-button, form[data-button-test]').forEach((node) => {
    node.remove();
  });
});

describe('ui-button', () => {
  it('reflects only name and disabled to its host', async () => {
    expect((await mount()).getAttributeNames()).toEqual([]);
    const button = await mount({ size: 'large', variant: 'danger', loading: true, name: 'action' });
    expect(button.getAttributeNames()).toEqual(['name']);
    button.disabled = true;
    await nextRender();
    expect(button.getAttributeNames().sort()).toEqual(['disabled', 'name']);
  });

  it('renders its defaults when the page removes an attribute or sets an unknown value', async () => {
    const form = document.createElement('form');
    form.dataset['buttonTest'] = '';
    const submitted = vi.fn();
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      submitted([...new FormData(form)]);
    });
    const button = create();
    for (const [name, value] of Object.entries({
      type: 'submit',
      variant: 'danger',
      size: 'large',
      shape: 'rounded',
      value: 'save',
      name: 'action',
    })) {
      button.setAttribute(name, value);
    }
    button.textContent = 'Save';
    form.append(button);
    document.body.append(form);
    await nextRender();
    for (const name of ['variant', 'size', 'shape', 'value']) {
      button.removeAttribute(name);
    }
    await nextRender();
    expect(control(button)?.className).toBe('base action primary medium square');
    control(button)?.click();
    expect(submitted).toHaveBeenCalledWith([['action', '']]);
    Reflect.set(button, 'type', undefined);
    Reflect.set(button, 'variant', 'tertiary');
    await nextRender();
    expect(control(button)?.type).toBe('button');
    expect(control(button)?.classList.contains('primary')).toBe(true);
    control(button)?.click();
    expect(submitted).toHaveBeenCalledOnce();
  });

  it('clicks as any element before its first render', () => {
    const button = create();
    const clicked = vi.fn();
    button.addEventListener('click', clicked);
    button.click();
    expect(clicked).toHaveBeenCalledOnce();
  });

  it('forwards a changing aria-label without writing author attributes', async () => {
    const button = await mount({ label: 'Save draft' });
    expect(control(button)?.getAttribute('aria-label')).toBe('Save draft');
    button.setAttribute('aria-label', 'Save article');
    button.setAttribute('data-owner', 'page');
    await nextRender();
    expect(control(button)?.getAttribute('aria-label')).toBe('Save article');
    button.removeAttribute('aria-label');
    await nextRender();
    expect(control(button)?.getAttribute('aria-label')).toBe('Save draft');
    expect(button.getAttribute('data-owner')).toBe('page');
    expect(button.hasAttribute('role')).toBe(false);
    expect(button.hasAttribute('tabindex')).toBe(false);
  });

  it('reads its public attributes and delegates focus and click to its native control', async () => {
    const button = await mount();
    button.setAttribute('loading-label', 'Saving draft');
    button.setAttribute('type', 'reset');
    button.setAttribute('value', 'draft');
    await nextRender();
    expect(button.loadingLabel).toBe('Saving draft');
    expect(button.type).toBe('reset');
    expect(button.value).toBe('draft');
    button.focus();
    expect(button.shadowRoot?.activeElement).toBe(control(button));
    const clicked = vi.fn();
    button.addEventListener('click', clicked);
    button.click();
    expect(clicked).toHaveBeenCalledOnce();
  });

  it('enables its native control in the render that clears disabled', async () => {
    const button = await mount({ disabled: true });
    const native = control(button);
    expect([native?.disabled, button.matches(':state(disabled)')]).toEqual([true, true]);
    button.disabled = false;
    await nextRender();
    expect([native?.disabled, button.matches(':state(disabled)')]).toEqual([false, false]);
    button.focus();
    expect(button.shadowRoot?.activeElement).toBe(native);
    const clicked = vi.fn();
    button.addEventListener('click', clicked);
    button.click();
    expect(clicked).toHaveBeenCalledOnce();
  });

  it('uses an external form association and clears action data after submission', async () => {
    const form = document.createElement('form');
    form.id = 'button-external-form';
    form.dataset['buttonTest'] = '';
    document.body.append(form);
    const button = await mount({ type: 'submit', name: 'action', value: 'save' });
    button.setAttribute('form', form.id);
    const submissions: { submitter: HTMLElement | null; data: [string, FormDataEntryValue][] }[] =
      [];
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      submissions.push({ submitter: event.submitter, data: [...new FormData(form)] });
    });
    expect(button.form).toBe(form);
    expect([...new FormData(form)]).toEqual([]);
    await page.elementLocator(button).getByRole('button').click();
    expect(submissions).toEqual([{ submitter: null, data: [['action', 'save']] }]);
    expect([...new FormData(form)]).toEqual([]);
    expect(button.checkValidity()).toBe(true);
    expect(button.reportValidity()).toBe(true);
    expect(button.validity.valid).toBe(true);
    expect(button.validationMessage).toBe('');
    button.formResetCallback();
    button.formStateRestoreCallback();
    expect(button.value).toBe('save');
  });
});
