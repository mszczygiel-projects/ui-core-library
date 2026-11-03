import '../../dist/components/ui-popover.js';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { nextRender } from '../internal/test-utils.ts';

afterEach(() => {
  document.querySelectorAll('ui-popover').forEach((node) => {
    node.remove();
  });
});

describe('ui-popover', () => {
  it('is defined when its module loads', () => {
    expect(customElements.get('ui-popover')).toBeDefined();
  });

  it('writes no attribute on its host: the host belongs to the page', async () => {
    const element = document.createElement('ui-popover');
    document.body.append(element);
    await nextRender();
    expect(element.getAttributeNames()).toEqual([]);
  });

  it('gives a new trigger the relationship to its panel', async () => {
    const element = document.createElement('ui-popover');
    const first = document.createElement('button');
    first.slot = 'trigger';
    element.append(first);
    document.body.append(element);
    await nextRender();
    expect(first.getAttribute('aria-haspopup')).toBe('dialog');
    const second = document.createElement('button');
    second.slot = 'trigger';
    first.replaceWith(second);
    await nextRender();
    expect(second.getAttribute('aria-haspopup')).toBe('dialog');
    expect(second.getAttribute('aria-expanded')).toBe('false');
  });

  it('reflects open, and cancels nothing when the page opens it', async () => {
    const element = document.createElement('ui-popover');
    const listener = vi.fn();
    element.addEventListener('ui-open-change', listener);
    document.body.append(element);
    element.open = true;
    await nextRender();
    expect(element.hasAttribute('open')).toBe(true);
    expect(listener).not.toHaveBeenCalled();
  });
});
