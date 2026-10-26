/**
 * An icon as a page supplies it: the 1em SVG of the icons package inside a wrapper, so that a
 * contract sees whether the component sizes artwork it does not render itself.
 */
const PATH = 'M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6-4.5-4.2 6.1-.7z';

export const ICON_SELECTOR = 'svg[data-contract-icon]';

/** The icon for a slot of a web component. */
export function iconElement(slot: string): HTMLElement {
  const wrapper = document.createElement('span');
  wrapper.slot = slot;
  wrapper.setAttribute('aria-label', 'Decorative star');
  wrapper.innerHTML = `<svg data-contract-icon width="1em" height="1em" viewBox="0 0 24 24"><path d="${PATH}" fill="currentColor"/></svg>`;
  return wrapper;
}

/** The icon for a prop of a React component. */
export function IconNode() {
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
