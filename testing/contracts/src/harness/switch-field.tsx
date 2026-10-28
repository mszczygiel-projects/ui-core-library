import { SwitchField } from '@mszczygiel-projects/ui-core-react';

import type { SwitchFieldContractProps } from '../specs/switch-field.contract.ts';
import { iconElement, IconNode } from './icon.tsx';
import { reactMount } from './react.tsx';
import { webComponentMount } from './web-component.ts';

/**
 * Maps the initial state to the checked attribute, the callback to the event and the icon flags to
 * the icon slots, as a page would.
 */
export const mountWebComponentSwitchField = webComponentMount<SwitchFieldContractProps>(
  'ui-switch-field',
  (element, { defaultChecked, onCheckedChange, iconOn, iconOff, ...properties }) => {
    if (defaultChecked !== undefined) {
      element.toggleAttribute('checked', defaultChecked);
    }
    Object.assign(element, properties);
    if (onCheckedChange) {
      element.addEventListener('ui-checked-change', (event) => {
        onCheckedChange(event.detail.value, { originalEvent: event.detail.originalEvent });
      });
    }
    for (const [slot, shown] of [
      ['icon-on', iconOn],
      ['icon-off', iconOff],
    ] as const) {
      if (shown !== undefined) {
        element.querySelector(`[slot="${slot}"]`)?.remove();
        if (shown) {
          element.append(iconElement(slot));
        }
      }
    }
  },
);

/** The same icons, expressed as React nodes instead of named slots. */
function ReactSwitchField({ iconOn, iconOff, ...props }: SwitchFieldContractProps) {
  return (
    <SwitchField
      {...props}
      iconOn={iconOn === true ? <IconNode /> : undefined}
      iconOff={iconOff === true ? <IconNode /> : undefined}
    />
  );
}

export const mountReactSwitchField = reactMount(ReactSwitchField, 'ui-switch-field');
