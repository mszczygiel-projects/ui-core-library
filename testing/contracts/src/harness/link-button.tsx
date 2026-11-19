import { LinkButton } from '@mszczygiel-projects/ui-core-react';

import type { LinkButtonContractProps } from '../specs/link-button.contract.ts';
import { iconElement, IconNode } from './icon.tsx';
import { reactMount } from './react.tsx';
import { webComponentMount } from './web-component.ts';

/** Maps content and icon flags to slots; navigation belongs entirely to the component. */
export const mountWebComponentLinkButton = webComponentMount<LinkButtonContractProps>(
  'ui-link-button',
  (element, props) => {
    const { children, leadingIcon, trailingIcon, ...properties } = props;
    Object.assign(element, properties);
    if (children !== undefined) {
      let label = element.querySelector('[data-contract-label]');
      if (label === null) {
        label = document.createElement('span');
        label.setAttribute('data-contract-label', '');
        element.append(label);
      }
      label.textContent = children;
    }
    for (const [name, enabled] of [
      ['leading-icon', leadingIcon],
      ['trailing-icon', trailingIcon],
    ] as const) {
      if (enabled === undefined) {
        continue;
      }
      element.querySelector(`[slot="${name}"]`)?.remove();
      if (enabled) {
        element.append(iconElement(name, enabled));
      }
    }
  },
);

/** The same content recipe, expressed as React nodes instead of named slots. */
function ReactLinkButton({ leadingIcon, trailingIcon, ...props }: LinkButtonContractProps) {
  return (
    <LinkButton
      {...props}
      leadingIcon={leadingIcon ? <IconNode fixture={leadingIcon} /> : undefined}
      trailingIcon={trailingIcon ? <IconNode fixture={trailingIcon} /> : undefined}
    />
  );
}

export const mountReactLinkButton = reactMount(ReactLinkButton, 'ui-link-button');
