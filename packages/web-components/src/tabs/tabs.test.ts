import '../../dist/components/ui-tabs.js';
import '../../dist/components/ui-tab.js';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { nextRender } from '../internal/test-utils.ts';

afterEach(() => {
  document.querySelectorAll('ui-tabs').forEach((node) => {
    node.remove();
  });
});

async function mount(markup: string): Promise<HTMLUiTabsElement> {
  const container = document.createElement('div');
  container.innerHTML = markup;
  const element = container.querySelector('ui-tabs');
  if (element === null) {
    throw new Error('The markup has no ui-tabs');
  }
  document.body.append(element);
  await nextRender();
  return element;
}

const THREE = `
  <ui-tabs>
    <ui-tab value="one" label="One">First</ui-tab>
    <ui-tab value="two" label="Two">Second</ui-tab>
    <ui-tab value="three" label="Three">Third</ui-tab>
  </ui-tabs>`;

function tabsOf(element: HTMLElement): HTMLButtonElement[] {
  return Array.from(element.shadowRoot?.querySelectorAll<HTMLButtonElement>('.tab') ?? []);
}

function panelsOf(element: HTMLElement): HTMLElement[] {
  return Array.from(element.shadowRoot?.querySelectorAll<HTMLElement>('.panel') ?? []);
}

describe('ui-tabs', () => {
  it('is defined when its module loads', () => {
    expect(customElements.get('ui-tabs')).toBeDefined();
  });

  it('writes no attribute on its host: the host belongs to the page', async () => {
    const element = document.createElement('ui-tabs');
    document.body.append(element);
    await nextRender();
    expect(element.getAttributeNames()).toEqual([]);
  });

  it('places each ui-tab in its own panel', async () => {
    const element = await mount(THREE);
    const children = Array.from(element.children);
    panelsOf(element).forEach((panel, index) => {
      expect(panel.querySelector('slot')?.assignedElements()).toEqual([children[index]]);
    });
  });

  it('takes the initial tab from the value attribute and reports nothing when the page sets it', async () => {
    const element = await mount(THREE.replace('<ui-tabs>', '<ui-tabs value="two">'));
    const listener = vi.fn();
    element.addEventListener('ui-value-change', listener);
    expect(tabsOf(element).map((tab) => tab.getAttribute('aria-selected'))).toEqual([
      'false',
      'true',
      'false',
    ]);
    element.value = 'three';
    await nextRender();
    expect(panelsOf(element)[2]?.hasAttribute('hidden')).toBe(false);
    expect(listener).not.toHaveBeenCalled();
  });

  it('follows the selection in its value property', async () => {
    const element = await mount(THREE);
    tabsOf(element)[2]?.click();
    await nextRender();
    expect(element.value).toBe('three');
  });

  it('dispatches an event that cannot be canceled', async () => {
    const element = await mount(THREE);
    const events: Event[] = [];
    element.addEventListener('ui-value-change', (event) => {
      event.preventDefault();
      events.push(event);
    });
    tabsOf(element)[1]?.click();
    await nextRender();
    expect(events[0]?.cancelable).toBe(false);
    expect(element.value).toBe('two');
  });

  it('renders a tab that the page adds or removes', async () => {
    const element = await mount(THREE);
    const tab = document.createElement('ui-tab');
    tab.value = 'four';
    tab.label = 'Four';
    element.append(tab);
    await nextRender();
    expect(tabsOf(element).map((button) => button.textContent)).toEqual([
      'One',
      'Two',
      'Three',
      'Four',
    ]);
    element.firstElementChild?.remove();
    await nextRender();
    expect(tabsOf(element)).toHaveLength(3);
    expect(tabsOf(element)[0]?.getAttribute('aria-selected')).toBe('true');
  });

  it('renders a tab again when its label or disabled changes', async () => {
    const element = await mount(THREE);
    const second = element.children[1] as HTMLUiTabElement;
    second.label = 'Second tab';
    second.disabled = true;
    await nextRender();
    expect(tabsOf(element)[1]?.textContent).toBe('Second tab');
    expect(tabsOf(element)[1]?.disabled).toBe(true);
  });
});
