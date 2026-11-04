import '../../dist/components/ui-calendar.js';

import { afterEach, describe, expect, it } from 'vitest';

import { nextRender } from '../internal/test-utils.ts';

afterEach(() => {
  document.querySelectorAll('ui-calendar').forEach((node) => {
    node.remove();
  });
});

describe('ui-calendar', () => {
  it('is defined when its module loads', () => {
    expect(customElements.get('ui-calendar')).toBeDefined();
  });

  it('writes no attribute on its host: the host belongs to the page', async () => {
    const element = document.createElement('ui-calendar');
    document.body.append(element);
    await nextRender();
    expect(element.getAttributeNames()).toEqual([]);
  });

  it('takes its first value and month from attributes and holds the current ones in properties', async () => {
    const element = document.createElement('ui-calendar');
    element.setAttribute('value', '2026-07-08');
    element.setAttribute('month', '2026-09');
    element.locale = 'en-US';
    document.body.append(element);
    await nextRender();
    expect(element.month).toBe('2026-09');
    element.shadowRoot?.querySelector<HTMLElement>('[data-date="2026-09-10"]')?.click();
    await nextRender();
    expect(element.value).toBe('2026-09-10');
    expect(element.getAttribute('value')).toBe('2026-07-08');
  });

  it('marks today from the clock of the browser without a today prop', async () => {
    const element = document.createElement('ui-calendar');
    document.body.append(element);
    await nextRender();
    expect(element.shadowRoot?.querySelector('[aria-current="date"]')).not.toBeNull();
  });
});
