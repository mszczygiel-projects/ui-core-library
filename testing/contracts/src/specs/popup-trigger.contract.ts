import { expect, it } from 'vitest';

import type { Mounted } from '../harness/types.ts';

/** An element whose ARIA relationships the browser reflects as element references. */
interface ReflectedDescription {
  ariaDescribedByElements: readonly Element[] | null;
}

function reflects(element: Element): element is Element & ReflectedDescription {
  return 'ariaDescribedByElements' in element;
}

/**
 * What Popover and Tooltip write on the element of their trigger reaches the native control of an
 * action: `aria-expanded` and `aria-haspopup` for a button, and the elements that describe it for
 * either. The page writes them on the custom element of the web component, and on the native
 * element of React, which is its root. The caller unmounts what `mount` gives.
 */
export function popupTriggerContract(
  mount: () => Promise<Mounted<unknown>>,
  { role, popup }: { readonly role: 'button' | 'link'; readonly popup: boolean },
): void {
  const controlOf = (component: Mounted<unknown>) =>
    component.element.shadowRoot?.querySelector(role === 'link' ? 'a' : 'button') ??
    component.element;

  if (popup) {
    it('passes the state of the popup it opens to its native control', async () => {
      const component = await mount();
      component.element.setAttribute('aria-haspopup', 'dialog');
      component.element.setAttribute('aria-expanded', 'false');
      const control = controlOf(component);
      await expect.poll(() => control.getAttribute('aria-haspopup')).toBe('dialog');
      await expect.poll(() => control.getAttribute('aria-expanded')).toBe('false');
      component.element.setAttribute('aria-expanded', 'true');
      await expect.poll(() => control.getAttribute('aria-expanded')).toBe('true');
    });
  }

  it('is described by the elements that describe it, across its shadow root', async () => {
    const component = await mount();
    const description = document.createElement('span');
    description.textContent = 'Copies the address';
    document.body.append(description);
    const { element } = component;
    if (!reflects(element)) {
      throw new Error('The browser does not reflect ARIA elements');
    }
    const describedBy = async () =>
      (await component.accessibleTree()).find((node) => node.role === role)?.description;
    element.ariaDescribedByElements = [description];
    await expect.poll(describedBy).toBe('Copies the address');
    element.ariaDescribedByElements = null;
    await expect.poll(describedBy).toBeUndefined();
    description.remove();
  });
}
