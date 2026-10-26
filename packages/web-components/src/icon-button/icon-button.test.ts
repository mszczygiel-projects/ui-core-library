import '../../dist/components/ui-icon-button.js';

import type { IconButtonProps } from '@mszczygiel-projects/ui-core-shared/icon-button';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { nextRender } from '../internal/test-utils.ts';

function create(): HTMLUiIconButtonElement {
  return document.createElement('ui-icon-button');
}

async function mount(props: Partial<IconButtonProps> = {}): Promise<HTMLUiIconButtonElement> {
  const button = Object.assign(create(), { label: 'Close panel', ...props });
  document.body.append(button);
  await nextRender();
  return button;
}

function control(button: HTMLElement): HTMLButtonElement | null | undefined {
  return button.shadowRoot?.querySelector('button');
}

afterEach(() => {
  document.querySelectorAll('ui-icon-button, form[data-icon-button-test]').forEach((node) => {
    node.remove();
  });
});

describe('ui-icon-button', () => {
  it('reflects only name and disabled to its host', async () => {
    const button = await mount({ size: 'large', variant: 'ghost', loading: true, name: 'action' });
    expect(button.getAttributeNames()).toEqual(['name']);
    button.disabled = true;
    await nextRender();
    expect(button.getAttributeNames().sort()).toEqual(['disabled', 'name']);
  });

  it('reads its public attributes and renders its defaults for unknown values', async () => {
    const form = document.createElement('form');
    form.dataset['iconButtonTest'] = '';
    const submitted = vi.fn();
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      submitted([...new FormData(form)]);
    });
    const button = create();
    for (const [name, value] of Object.entries({
      label: 'Close panel',
      'loading-label': 'Closing panel',
      type: 'submit',
      variant: 'tertiary',
      size: 'huge',
      name: 'action',
      value: 'close',
    })) {
      button.setAttribute(name, value);
    }
    form.append(button);
    document.body.append(form);
    await nextRender();
    expect(button.loadingLabel).toBe('Closing panel');
    expect(control(button)?.className).toBe('base action primary medium');
    expect(control(button)?.getAttribute('aria-label')).toBe('Close panel');
    control(button)?.click();
    expect(submitted).toHaveBeenCalledWith([['action', 'close']]);
  });

  it('forwards a changing aria-label without writing author attributes', async () => {
    const button = await mount();
    button.setAttribute('aria-label', 'Close settings');
    await nextRender();
    expect(control(button)?.getAttribute('aria-label')).toBe('Close settings');
    button.removeAttribute('aria-label');
    await nextRender();
    expect(control(button)?.getAttribute('aria-label')).toBe('Close panel');
    expect(button.hasAttribute('role')).toBe(false);
    expect(button.hasAttribute('tabindex')).toBe(false);
  });

  it('clicks as any element before its first render, then delegates focus and click', async () => {
    const early = create();
    const clickedEarly = vi.fn();
    early.addEventListener('click', clickedEarly);
    early.click();
    expect(clickedEarly).toHaveBeenCalledOnce();
    const button = await mount();
    button.focus();
    expect(button.shadowRoot?.activeElement).toBe(control(button));
    const clicked = vi.fn();
    button.addEventListener('click', clicked);
    button.click();
    expect(clicked).toHaveBeenCalledOnce();
  });

  it('exposes the form API of a native control', async () => {
    const form = document.createElement('form');
    form.id = 'icon-button-external-form';
    form.dataset['iconButtonTest'] = '';
    document.body.append(form);
    const button = await mount({ type: 'submit', name: 'action', value: 'close' });
    button.setAttribute('form', form.id);
    expect(button.form).toBe(form);
    expect(button.checkValidity()).toBe(true);
    expect(button.reportValidity()).toBe(true);
    expect(button.validity.valid).toBe(true);
    expect(button.validationMessage).toBe('');
  });
});
