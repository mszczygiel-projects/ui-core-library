import '../../dist/components/ui-select-field.js';

import { afterEach, describe, expect, it } from 'vitest';

import { nextRender } from '../internal/test-utils.ts';

const options = [
  { value: 'a', label: 'Apple' },
  { value: 'b', label: 'Banana' },
];

async function mount(properties: Partial<HTMLUiSelectFieldElement> = {}) {
  const field = document.createElement('ui-select-field');
  Object.assign(field, { options, label: 'Fruit' }, properties);
  document.body.append(field);
  await nextRender();
  return field;
}

function triggerOf(field: HTMLUiSelectFieldElement): HTMLButtonElement {
  const trigger = field.shadowRoot?.querySelector('button');
  if (!(trigger instanceof HTMLButtonElement)) {
    throw new Error('Expected the trigger');
  }
  return trigger;
}

function popupOf(field: HTMLUiSelectFieldElement): HTMLElement {
  const popup = field.shadowRoot?.querySelector<HTMLElement>('.popup');
  if (popup === null || popup === undefined) {
    throw new Error('Expected the popup');
  }
  return popup;
}

afterEach(() => {
  document.querySelectorAll('ui-select-field').forEach((node) => {
    node.remove();
  });
});

describe('ui-select-field', () => {
  it('reflects only name, disabled and open to its host', async () => {
    const field = await mount({ value: 'a', state: 'error', required: true, clearable: true });
    expect(field.getAttributeNames()).toEqual([]);
    field.open = true;
    await nextRender();
    expect(field.getAttributeNames()).toEqual(['open']);
    Object.assign(field, { name: 'fruit', disabled: true });
    await nextRender();
    expect(field.getAttributeNames().sort()).toEqual(['disabled', 'name']);
  });

  it('opens its list as a popover in the top layer', async () => {
    const field = await mount();
    expect(popupOf(field).matches(':popover-open')).toBe(false);
    triggerOf(field).dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0 }));
    triggerOf(field).dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    await nextRender();
    expect(field.open).toBe(true);
    expect(popupOf(field).matches(':popover-open')).toBe(true);
  });

  it('only focuses the trigger on a click of its label', async () => {
    const field = await mount();
    field.shadowRoot?.querySelector('label')?.click();
    await nextRender();
    expect(field.open).toBe(false);
    expect(field.shadowRoot?.activeElement).toBe(triggerOf(field));
  });

  it('passes the aria-label of its host to the trigger and the list', async () => {
    const field = await mount({ label: undefined });
    field.setAttribute('aria-label', 'Fruit');
    await nextRender();
    expect(triggerOf(field).getAttribute('aria-label')).toBe('Fruit');
    expect(field.shadowRoot?.querySelector('[role="listbox"]')?.getAttribute('aria-label')).toBe(
      'Fruit',
    );
  });

  it('closes its list when it leaves the page', async () => {
    const field = await mount({ open: true });
    const popup = popupOf(field);
    field.remove();
    expect(popup.matches(':popover-open')).toBe(false);
  });
});
