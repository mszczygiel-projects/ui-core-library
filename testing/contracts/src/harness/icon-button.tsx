import { IconButton } from '@mszczygiel-projects/ui-core-react';

import type { IconButtonContractProps } from '../specs/icon-button.contract.ts';
import { iconElement, IconNode } from './icon.tsx';
import { reactMount } from './react.tsx';
import { webComponentMount } from './web-component.ts';

/** Maps the icon flag to the icon slot; form behaviour belongs entirely to the component. */
export const mountWebComponentIconButton = webComponentMount<IconButtonContractProps>(
  'ui-icon-button',
  (element, props) => {
    const { icon, ...properties } = props;
    Object.assign(element, properties);
    if (icon !== undefined) {
      element.querySelector('[slot="icon"]')?.remove();
      if (icon) {
        element.append(iconElement('icon'));
      }
    }
  },
);

/** The same icon, expressed as a React node instead of a named slot. */
function ReactIconButton({ icon, ...props }: IconButtonContractProps) {
  return <IconButton {...props} icon={icon === true ? <IconNode /> : undefined} />;
}

export const mountReactIconButton = reactMount(ReactIconButton, 'ui-icon-button');
