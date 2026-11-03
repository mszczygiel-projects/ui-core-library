import '../../dist/components/ui-tooltip.js';

import { afterEach, describe, expect, it } from 'vitest';

import { nextRender } from '../internal/test-utils.ts';

afterEach(() => {
  document.querySelectorAll('ui-tooltip').forEach((node) => {
    node.remove();
  });
});

describe('ui-tooltip', () => {
  it('is defined when its module loads', () => {
    expect(customElements.get('ui-tooltip')).toBeDefined();
  });

  it('writes no attribute on its host: the host belongs to the page', async () => {
    const element = document.createElement('ui-tooltip');
    document.body.append(element);
    await nextRender();
    expect(element.getAttributeNames()).toEqual([]);
  });

  it('keeps its text in its light DOM, where its trigger can refer to it', async () => {
    const element = document.createElement('ui-tooltip');
    const button = document.createElement('button');
    element.append(button);
    element.content = 'Copy link';
    document.body.append(element);
    await nextRender();
    const text = element.querySelector('[role="tooltip"]');
    expect(text?.getAttribute('slot')).toBe('content');
    expect(text?.textContent).toBe('Copy link');
    expect(button.ariaDescribedByElements).toEqual([text]);
    element.content = 'Share';
    await nextRender();
    expect(text?.textContent).toBe('Share');
  });

  it('stops describing a trigger that leaves it, and its trigger when it leaves the page', async () => {
    const element = document.createElement('ui-tooltip');
    const first = document.createElement('button');
    element.append(first);
    element.content = 'Copy link';
    document.body.append(element);
    await nextRender();
    const second = document.createElement('button');
    first.replaceWith(second);
    await nextRender();
    expect(first.ariaDescribedByElements ?? []).toEqual([]);
    expect(second.ariaDescribedByElements).toHaveLength(1);
    element.remove();
    expect(second.ariaDescribedByElements ?? []).toEqual([]);
  });
});
