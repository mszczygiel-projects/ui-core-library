import { Chip } from '@mszczygiel-projects/ui-core-react';

import type { ChipContractProps } from '../specs/chip.contract.ts';
import { iconElement, IconNode } from './icon.tsx';
import { reactMount } from './react.tsx';
import { webComponentMount } from './web-component.ts';

/**
 * Maps the initial state to the selected attribute, the callbacks to the events, the text to the
 * content and the icon flag to the icon slot.
 */
export const mountWebComponentChip = webComponentMount<ChipContractProps>(
  'ui-chip',
  (element, props) => {
    const { children, icon, defaultSelected, onSelectedChange, onDismiss, ...properties } = props;
    Object.assign(element, properties);
    if (defaultSelected !== undefined) {
      element.toggleAttribute('selected', defaultSelected);
    }
    if (onSelectedChange) {
      element.addEventListener('ui-selected-change', (event) => {
        onSelectedChange(event.detail.value, { originalEvent: event.detail.originalEvent });
      });
    }
    if (onDismiss) {
      element.addEventListener('ui-dismiss', (event) => {
        onDismiss({ originalEvent: event.detail.originalEvent });
      });
    }
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
function ReactChip({ icon, ...props }: ChipContractProps) {
  return <Chip {...props} icon={icon === true ? <IconNode /> : undefined} />;
}

export const mountReactChip = reactMount(ReactChip, 'ui-chip');
