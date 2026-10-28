import '../../dist/components/ui-switch-field.js';

import { afterEach, describe, expect, it } from 'vitest';

import { nextRender } from '../internal/test-utils.ts';

/** The element with the form callbacks the browser calls. */
type Field = HTMLUiSwitchFieldElement & { formResetCallback(): void };

async function mount(attributes: Record<string, string> = {}): Promise<Field> {
  const element = document.createElement('ui-switch-field') as Field;
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }
  document.body.append(element);
  await nextRender();
  return element;
}

afterEach(() => {
  document.querySelectorAll('ui-switch-field').forEach((node) => {
    node.remove();
  });
});

describe('ui-switch-field', () => {
  it('is defined when its module loads', () => {
    expect(customElements.get('ui-switch-field')).toBeDefined();
  });

  it('reflects only name and disabled to its host', async () => {
    const field = await mount();
    Object.assign(field, { label: 'Dark mode', labelPosition: 'start', checked: true });
    await nextRender();
    expect(field.getAttributeNames()).toEqual([]);
    Object.assign(field, { name: 'dark', disabled: true });
    await nextRender();
    expect(field.getAttributeNames().sort()).toEqual(['disabled', 'name']);
  });

  it('keeps the checked attribute as the state that a reset restores', async () => {
    const field = await mount({ checked: '' });
    field.shadowRoot?.querySelector('input')?.click();
    await nextRender();
    expect(field.checked).toBe(false);
    field.formResetCallback();
    await nextRender();
    expect(field.checked).toBe(true);
  });

  it('shows the wrapper of an icon slot only when the page fills it', async () => {
    const field = await mount();
    const wrappers = () =>
      [...(field.shadowRoot?.querySelectorAll('[part="icon"]') ?? [])].map((node) =>
        node.hasAttribute('hidden'),
      );
    expect(wrappers()).toEqual([true, true]);
    const icon = document.createElement('span');
    icon.slot = 'icon-on';
    field.append(icon);
    await nextRender();
    expect(wrappers()).toEqual([false, true]);
  });
});
