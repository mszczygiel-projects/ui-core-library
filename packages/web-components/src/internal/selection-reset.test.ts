import '../../dist/components/ui-checkbox-field.js';
import '../../dist/components/ui-switch-field.js';
import '../../dist/components/ui-radio-group.js';
import '../../dist/components/ui-radio-field.js';

import { expect, it, vi } from 'vitest';

import { nextRender } from './test-utils.ts';

it.each(['ui-checkbox-field', 'ui-switch-field', 'ui-radio-group'])(
  '%s resets form data, inputs and validity before returning',
  async (tag) => {
    const form = document.createElement('form');
    const field = document.createElement(tag);
    const requiresChoice = tag !== 'ui-switch-field';
    field.setAttribute('name', 'choice');
    if (requiresChoice) {
      field.setAttribute('required', '');
    }
    if (tag === 'ui-radio-group') {
      field.innerHTML = '<ui-radio-field value="on" label="Choice"></ui-radio-field>';
    }
    form.append(field);
    document.body.append(form);
    try {
      await nextRender();
      const input = (field.querySelector('ui-radio-field') ?? field).shadowRoot?.querySelector(
        'input',
      );
      input?.click();
      await nextRender();
      expect(new FormData(form).get('choice')).toBe('on');
      expect(form.checkValidity()).toBe(true);
      const changed = vi.fn();
      field.addEventListener('change', changed);
      const submitted = vi.fn((event: Event) => {
        event.preventDefault();
      });
      form.addEventListener('submit', submitted);
      field.addEventListener('invalid', (event) => {
        event.preventDefault();
      });

      form.reset();
      expect(new FormData(form).has('choice')).toBe(false);
      expect(input?.checked).toBe(false);
      expect(form.checkValidity()).toBe(!requiresChoice);
      form.requestSubmit();
      expect(submitted).toHaveBeenCalledTimes(requiresChoice ? 0 : 1);
      expect(changed).not.toHaveBeenCalled();

      field.setAttribute(
        tag === 'ui-radio-group' ? 'value' : 'checked',
        tag === 'ui-radio-group' ? 'on' : '',
      );
      await nextRender();
      form.reset();
      expect(new FormData(form).get('choice')).toBe('on');
      expect(input?.checked).toBe(true);
      expect(form.checkValidity()).toBe(true);
    } finally {
      form.remove();
    }
  },
);
