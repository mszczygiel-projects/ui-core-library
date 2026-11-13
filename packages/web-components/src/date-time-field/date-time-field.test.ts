import '../../dist/components/ui-date-time-field.js';

import { afterEach, describe, expect, it } from 'vitest';

import { nextRender } from '../internal/test-utils.ts';

afterEach(() => {
  document.querySelectorAll('ui-date-time-field').forEach((node) => {
    node.remove();
  });
});

describe('ui-date-time-field', () => {
  it('is defined when its module loads', () => {
    expect(customElements.get('ui-date-time-field')).toBeDefined();
  });

  it('writes no attribute on its host: the host belongs to the page', async () => {
    const element = document.createElement('ui-date-time-field');
    document.body.append(element);
    await nextRender();
    expect(element.getAttributeNames()).toEqual([]);
  });

  it('synchronizes its form value immediately on property updates and resets', async () => {
    const form = document.createElement('form');
    const element = document.createElement('ui-date-time-field');
    element.setAttribute('name', 'entry');
    element.setAttribute('value', '2026-12-31T09:30');
    form.append(element);
    document.body.append(form);
    await nextRender();
    element.value = '2026-12-31T10:45';
    expect(new FormData(form).get('entry')).toBe('2026-12-31T10:45');
    form.reset();
    expect(new FormData(form).get('entry')).toBe('2026-12-31T09:30');
    element.setCustomValidity('Unavailable');
    expect(element.checkValidity()).toBe(false);
    expect(element.validationMessage).toBe('Unavailable');
    element.setCustomValidity('');
    expect(element.checkValidity()).toBe(true);
    form.remove();
  });
});
