import '../../dist/components/ui-time-field.js';

import { afterEach, describe, expect, it } from 'vitest';

import { nextRender } from '../internal/test-utils.ts';

afterEach(() => {
  document.querySelectorAll('ui-time-field').forEach((node) => {
    node.remove();
  });
});

describe('ui-time-field', () => {
  it('is defined when its module loads', () => {
    expect(customElements.get('ui-time-field')).toBeDefined();
  });

  it('writes no attribute on its host: the host belongs to the page', async () => {
    const element = document.createElement('ui-time-field');
    document.body.append(element);
    await nextRender();
    expect(element.getAttributeNames()).toEqual([]);
  });

  it('synchronizes its form value immediately on property updates and resets', async () => {
    const form = document.createElement('form');
    const element = document.createElement('ui-time-field');
    element.setAttribute('name', 'entry');
    element.setAttribute('value', '09:30');
    form.append(element);
    document.body.append(form);
    await nextRender();
    element.value = '10:45';
    expect(new FormData(form).get('entry')).toBe('10:45');
    form.reset();
    expect(new FormData(form).get('entry')).toBe('09:30');
    element.value = '25:00';
    expect(element.value).toBe('');
    form.remove();
  });
});
