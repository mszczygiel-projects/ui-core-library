import { commands, page } from 'vitest/browser';

import { accessibleNodeOf, frameAttributes, type Mount, required } from './types.ts';

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });
}

/**
 * Waits until the component has rendered what its props say. Stencil schedules every render,
 * the first included, for the next animation frame.
 */
async function settled(): Promise<void> {
  await nextFrame();
  await nextFrame();
}

/** Mounts the web component of a tag, setting props as properties, as frameworks do. */
export function webComponentMount<Props extends object>(
  tag: string,
  applyProps: (element: HTMLElement, props: Partial<Props>) => void = Object.assign,
): Mount<Props> {
  return async (props, options = {}) => {
    const frame = document.createElement('div');
    for (const [name, value] of Object.entries(frameAttributes(options))) {
      frame.setAttribute(name, value);
    }
    if (customElements.get(tag) === undefined) {
      throw new Error(`${tag} is not a defined web component`);
    }
    const element = document.createElement(tag);
    for (const [name, value] of Object.entries(options.attributes ?? {})) {
      element.setAttribute(name, value);
    }
    applyProps(element, props);
    frame.append(element);
    const container = document.createElement('div');
    container.dataset['theme'] = options.theme ?? 'light';
    container.append(frame);
    (options.parent ?? document.body).append(container);
    await settled();
    return {
      element,
      screen: page.elementLocator(frame),
      part: (name) =>
        required(element.shadowRoot?.querySelector<HTMLElement>(`[part~="${name}"]`), name),
      text: () => element.shadowRoot?.textContent ?? '',
      accessibleNode: () => accessibleNodeOf(frame),
      accessibleTree: () =>
        commands.accessibleTree(frame.getAttribute('data-contract-frame') ?? ''),
      update: async (next) => {
        applyProps(element, next);
        await settled();
      },
      unmount: () => {
        container.remove();
        return Promise.resolve();
      },
    };
  };
}
