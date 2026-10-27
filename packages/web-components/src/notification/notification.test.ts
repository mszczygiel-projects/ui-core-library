import '../../dist/components/ui-notification.js';

import { afterEach, describe, expect, it } from 'vitest';

import { nextRender } from '../internal/test-utils.ts';

afterEach(() => {
  document.querySelectorAll('ui-notification').forEach((node) => {
    node.remove();
  });
});

describe('ui-notification', () => {
  it('is defined when its module loads', () => {
    expect(customElements.get('ui-notification')).toBeDefined();
  });

  it('writes no attribute on its host: the host belongs to the page', async () => {
    const element = document.createElement('ui-notification');
    document.body.append(element);
    await nextRender();
    expect(element.getAttributeNames()).toEqual([]);
  });

  it('reflects none of its props on its host', async () => {
    const element = document.createElement('ui-notification');
    document.body.append(element);
    Object.assign(element, {
      tone: 'error',
      variant: 'subtle',
      heading: 'Failed',
      hasLeadingIcon: true,
      dismissible: true,
      announce: true,
    });
    await nextRender();
    expect(element.getAttributeNames()).toEqual([]);
  });

  it('takes its props from attributes, as a page writes them in HTML', async () => {
    document.body.insertAdjacentHTML(
      'beforeend',
      '<ui-notification tone="error" heading="Failed" has-leading-icon dismissible dismiss-label="Hide"></ui-notification>',
    );
    const element = document.querySelector('ui-notification');
    await nextRender();
    expect(element?.tone).toBe('error');
    expect(element?.hasLeadingIcon).toBe(true);
    expect(element?.dismissible).toBe(true);
    expect(element?.dismissLabel).toBe('Hide');
  });

  it('shows a description that the page adds later, and hides it again when it is emptied', async () => {
    const element = document.createElement('ui-notification');
    element.heading = 'Saved';
    document.body.append(element);
    await nextRender();
    const description = element.shadowRoot?.querySelector('[part~="description"]');
    expect(description?.hasAttribute('hidden')).toBe(true);
    element.textContent = 'Details';
    await nextRender();
    expect(description?.hasAttribute('hidden')).toBe(false);
    const text = element.firstChild;
    if (text instanceof Text) {
      text.data = '  ';
    }
    await nextRender();
    expect(description?.hasAttribute('hidden')).toBe(true);
  });
});
