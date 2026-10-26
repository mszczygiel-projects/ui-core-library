import { Button } from '@mszczygiel-projects/ui-core-react';

import type { ButtonContractProps } from '../specs/button.contract.ts';
import { reactMount } from './react.tsx';
import { webComponentMount } from './web-component.ts';

/** Maps content and icon nodes to slots; form behaviour belongs entirely to the component. */
export const mountWebComponentButton = webComponentMount<ButtonContractProps>(
  'ui-button',
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
        const icon = document.createElement('span');
        icon.slot = name;
        icon.textContent = '★';
        icon.setAttribute('aria-label', 'Decorative star');
        element.append(icon);
      }
    }
  },
);

/** The same content recipe, expressed as React nodes instead of named slots. */
function ReactButton({ leadingIcon, trailingIcon, ...props }: ButtonContractProps) {
  const icon = <span aria-label="Decorative star">★</span>;
  return (
    <Button
      {...props}
      leadingIcon={leadingIcon ? icon : undefined}
      trailingIcon={trailingIcon ? icon : undefined}
    />
  );
}

export const mountReactButton = reactMount(ReactButton, 'ui-button');
