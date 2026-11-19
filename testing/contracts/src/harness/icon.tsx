import { createElement } from 'react';

/**
 * An icon as a page supplies it: the 1em SVG of the icons package inside a wrapper, so that a
 * contract sees whether the component sizes artwork it does not render itself.
 */
const PATH = 'M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6-4.5-4.2 6.1-.7z';

export const ICON_SELECTOR = 'svg[data-contract-icon]';
export const WRAPPED_ICON_TAG = 'contract-wrapped-icon';
export type IconFixture = boolean | 'wrapped';

class WrappedIcon extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host { font-size: var(--contract-icon-size, 1em); line-height: 0; }
        svg { flex: none; }
      </style>
      <svg data-contract-icon width="1em" height="1em" viewBox="0 0 24 24"><path d="${PATH}" fill="currentColor"/></svg>`;
  }
}

if (customElements.get(WRAPPED_ICON_TAG) === undefined) {
  customElements.define(WRAPPED_ICON_TAG, WrappedIcon);
}

/** The icon for a slot of a web component. */
export function iconElement(slot: string, fixture?: IconFixture): HTMLElement {
  if (fixture === 'wrapped') {
    const wrapper = document.createElement(WRAPPED_ICON_TAG);
    wrapper.slot = slot;
    return wrapper;
  }
  const wrapper = document.createElement('span');
  wrapper.slot = slot;
  // Give the ordinary accessibility fixture a name to prove the button hides it.
  wrapper.setAttribute('aria-label', 'Decorative star');
  wrapper.innerHTML = `<svg data-contract-icon width="1em" height="1em" viewBox="0 0 24 24"><path d="${PATH}" fill="currentColor"/></svg>`;
  return wrapper;
}

/** The icon for a prop of a React component. */
export function IconNode({ fixture }: { readonly fixture?: IconFixture }) {
  if (fixture === 'wrapped') {
    return createElement(WRAPPED_ICON_TAG);
  }
  return (
    <span aria-label="Decorative star">
      <svg data-contract-icon width="1em" height="1em" viewBox="0 0 24 24">
        <path d={PATH} fill="currentColor" />
      </svg>
    </span>
  );
}

/** The size of the artwork of an icon of a mounted component. */
export function iconSize(root: HTMLElement): { width: number; height: number } {
  const icon = root.querySelector(ICON_SELECTOR);
  if (icon === null) {
    throw new Error('The component has no icon');
  }
  const { width, height } = icon.getBoundingClientRect();
  return { width, height };
}
