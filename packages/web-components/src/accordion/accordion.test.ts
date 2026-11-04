import '../../dist/components/ui-accordion.js';
import '../../dist/components/ui-accordion-item.js';

import { afterEach, describe, expect, it } from 'vitest';

import { nextRender } from '../internal/test-utils.ts';

afterEach(() => {
  document.querySelectorAll('ui-accordion').forEach((node) => {
    node.remove();
  });
});

async function mount(multiple = false): Promise<HTMLUiAccordionItemElement[]> {
  const group = document.createElement('ui-accordion');
  group.multiple = multiple;
  const items = ['Shipping', 'Returns', 'Warranty'].map((label) => {
    const item = document.createElement('ui-accordion-item');
    item.label = label;
    item.textContent = `About ${label}`;
    return item;
  });
  group.append(...items);
  document.body.append(group);
  await nextRender();
  return items;
}

describe('ui-accordion', () => {
  it('is defined when its module loads', () => {
    expect(customElements.get('ui-accordion')).toBeDefined();
  });

  it('writes no attribute on its host: the host belongs to the page', async () => {
    const element = document.createElement('ui-accordion');
    document.body.append(element);
    await nextRender();
    expect(element.getAttributeNames()).toEqual([]);
  });

  it('leaves the others as they are when the page opens a section', async () => {
    const [first, second] = await mount();
    if (first === undefined || second === undefined) {
      throw new Error('The group has no sections');
    }
    first.open = true;
    second.open = true;
    await nextRender();
    expect(first.open).toBe(true);
    expect(second.open).toBe(true);
  });
});
