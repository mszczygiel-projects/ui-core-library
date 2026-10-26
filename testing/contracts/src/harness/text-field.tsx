import { TextField } from '@mszczygiel-projects/ui-core-react';

import type { TextFieldContractProps } from '../specs/text-field.contract.ts';
import { iconElement, IconNode } from './icon.tsx';
import { reactMount } from './react.tsx';
import { webComponentMount } from './web-component.ts';

/** Maps values, events and decorative content to the web component API. */
export const mountWebComponentTextField = webComponentMount<TextFieldContractProps>(
  'ui-text-field',
  (element, props) => {
    const { defaultValue, onValueChange, leadingIcon, trailingIcon, ...properties } = props;
    Object.assign(element, properties);
    if (defaultValue !== undefined) {
      element.setAttribute('value', defaultValue);
    }
    if (onValueChange) {
      element.addEventListener('ui-value-change', (event) => {
        onValueChange(event.detail.value, { originalEvent: event.detail.originalEvent });
      });
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
        element.append(iconElement(name));
      }
    }
  },
);

function ReactTextField({ leadingIcon, trailingIcon, ...props }: TextFieldContractProps) {
  const icon = <IconNode />;
  return (
    <TextField
      {...props}
      leadingIcon={leadingIcon ? icon : undefined}
      trailingIcon={trailingIcon ? icon : undefined}
    />
  );
}

export const mountReactTextField = reactMount(ReactTextField, 'ui-text-field');
