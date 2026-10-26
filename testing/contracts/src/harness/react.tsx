import type { ComponentType } from 'react';
import { commands, page } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { accessibleNodeOf, frameAttributes, type Mount, required } from './types.ts';

/**
 * Mounts a React component. The attributes of the author follow the props, so that they win, as
 * an attribute that a page writes wins over the defaults of a web component.
 */
export function reactMount<Props extends object>(
  Component: ComponentType<Props>,
  block: string,
): Mount<Props> {
  return async (initial, options = {}) => {
    let props = initial;
    const frameProps = frameAttributes(options);
    const view = () => (
      <div {...frameProps}>
        <Component {...props} {...options.attributes} />
      </div>
    );
    const container = document.createElement('div');
    container.dataset['theme'] = options.theme ?? 'light';
    (options.parent ?? document.body).append(container);
    const screen = await render(view(), { container });
    const frame = required(screen.container.firstElementChild, 'the frame');
    const element = required(frame.firstElementChild, 'the component');
    if (!(element instanceof HTMLElement)) {
      throw new Error('The component did not render an HTML element');
    }
    return {
      element,
      screen: page.elementLocator(frame),
      part: (name) => required(frame.querySelector<HTMLElement>(`.${block}__${name}`), name),
      text: () => element.textContent,
      accessibleNode: () => accessibleNodeOf(frame),
      accessibleTree: () =>
        commands.accessibleTree(frame.getAttribute('data-contract-frame') ?? ''),
      update: async (next) => {
        props = { ...props, ...next };
        await screen.rerender(view());
      },
      unmount: async () => {
        await screen.unmount();
        container.remove();
      },
    };
  };
}
