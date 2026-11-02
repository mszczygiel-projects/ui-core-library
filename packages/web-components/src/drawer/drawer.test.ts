import '../../dist/components/ui-drawer.js';

import { afterEach, describe, expect, it } from 'vitest';

import { nextRender } from '../internal/test-utils.ts';

afterEach(() => {
  document.querySelectorAll('ui-drawer').forEach((node) => {
    node.remove();
  });
});

function closeButton(element: HTMLElement): HTMLElement {
  const button = element.shadowRoot?.querySelector('.close');
  if (!(button instanceof HTMLElement)) {
    throw new Error('The drawer has no close button.');
  }
  return button;
}

describe('ui-drawer', () => {
  it('is defined when its module loads', () => {
    expect(customElements.get('ui-drawer')).toBeDefined();
  });

  it('writes no attribute on its host: the host belongs to the page', async () => {
    const element = document.createElement('ui-drawer');
    element.label = 'Filters';
    document.body.append(element);
    await nextRender();
    expect(element.getAttributeNames()).toEqual([]);
  });

  it('opens as a modal from its attribute and reflects its closing', async () => {
    const element = document.createElement('ui-drawer');
    element.label = 'Filters';
    element.setAttribute('open', '');
    document.body.append(element);
    await nextRender();
    const dialog = element.shadowRoot?.querySelector('dialog');
    expect(dialog?.matches(':modal')).toBe(true);
    closeButton(element).click();
    await nextRender();
    expect(element.open).toBe(false);
    expect(element.hasAttribute('open')).toBe(false);
    expect(dialog?.open).toBe(false);
  });

  it('stays open when the page cancels its ui-open-change', async () => {
    const element = document.createElement('ui-drawer');
    element.label = 'Filters';
    element.open = true;
    document.body.append(element);
    await nextRender();
    const reasons: string[] = [];
    element.addEventListener('ui-open-change', (event) => {
      reasons.push(event.detail.reason);
      event.preventDefault();
    });
    closeButton(element).click();
    await nextRender();
    expect(reasons).toEqual(['close-button']);
    expect(element.open).toBe(true);
    expect(element.shadowRoot?.querySelector('dialog')?.open).toBe(true);
  });

  it('releases the scroll of the page when it leaves the page open', async () => {
    const element = document.createElement('ui-drawer');
    element.label = 'Filters';
    element.open = true;
    document.body.append(element);
    await nextRender();
    expect(document.documentElement.style.overflow).toBe('hidden');
    element.remove();
    expect(document.documentElement.style.overflow).toBe('');
  });
});
