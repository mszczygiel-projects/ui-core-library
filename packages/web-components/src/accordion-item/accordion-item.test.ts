import '../../dist/components/ui-accordion-item.js';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { nextRender } from '../internal/test-utils.ts';

afterEach(() => {
  document.querySelectorAll('ui-accordion-item').forEach((node) => {
    node.remove();
  });
});

async function mount(open = false): Promise<HTMLUiAccordionItemElement> {
  const element = document.createElement('ui-accordion-item');
  element.label = 'Shipping';
  element.open = open;
  element.textContent = 'Orders ship within two days.';
  document.body.append(element);
  await nextRender();
  return element;
}

function panelOf(element: HTMLElement): HTMLElement {
  const panel = element.shadowRoot?.querySelector<HTMLElement>('.panel');
  if (panel === null || panel === undefined) {
    throw new Error('The section has no panel');
  }
  return panel;
}

describe('ui-accordion-item', () => {
  it('is defined when its module loads', () => {
    expect(customElements.get('ui-accordion-item')).toBeDefined();
  });

  it('writes no attribute on its host: the host belongs to the page', async () => {
    const element = document.createElement('ui-accordion-item');
    document.body.append(element);
    await nextRender();
    expect(element.getAttributeNames()).toEqual([]);
  });

  it('reflects open, and reports nothing when the page opens it', async () => {
    const element = await mount();
    const listener = vi.fn();
    element.addEventListener('ui-open-change', listener);
    element.open = true;
    await nextRender();
    expect(element.hasAttribute('open')).toBe(true);
    expect(panelOf(element).hasAttribute('hidden')).toBe(false);
    expect(listener).not.toHaveBeenCalled();
  });

  it('hides a closed panel until find in page reaches it', async () => {
    const element = await mount();
    expect(panelOf(element).getAttribute('hidden')).toBe('until-found');
  });

  it('opens on beforematch with the reason find, even when the page cancels it', async () => {
    const element = await mount();
    const reasons: string[] = [];
    element.addEventListener('ui-open-change', (event) => {
      reasons.push(event.detail.reason);
      event.preventDefault();
    });
    panelOf(element).dispatchEvent(new Event('beforematch'));
    await nextRender();
    expect(reasons).toEqual(['find']);
    expect(element.open).toBe(true);
  });
});
