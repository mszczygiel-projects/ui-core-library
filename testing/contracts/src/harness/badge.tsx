import { Badge } from '@mszczygiel-projects/ui-core-react';

import type { BadgeContractProps } from '../specs/badge.contract.ts';
import { iconElement, IconNode } from './icon.tsx';
import { reactMount } from './react.tsx';
import { webComponentMount } from './web-component.ts';

/** Sets props as properties, the text as content and the icon flag as the icon slot. */
export const mountWebComponentBadge = webComponentMount<BadgeContractProps>(
  'ui-badge',
  (element, { children, icon, ...properties }) => {
    Object.assign(element, properties);
    if (children !== undefined) {
      for (const node of [...element.childNodes]) {
        if (!(node instanceof Element && node.slot === 'icon')) {
          node.remove();
        }
      }
      element.append(children);
    }
    if (icon !== undefined) {
      element.querySelector('[slot="icon"]')?.remove();
      if (icon) {
        element.prepend(iconElement('icon'));
      }
    }
  },
);

/** The same icon, expressed as a React node instead of a named slot. */
function ReactBadge({ icon, children, ...props }: BadgeContractProps) {
  return (
    <Badge {...props} icon={icon === true ? <IconNode /> : undefined}>
      {children === '' ? undefined : children}
    </Badge>
  );
}

export const mountReactBadge = reactMount(ReactBadge, 'ui-badge');
