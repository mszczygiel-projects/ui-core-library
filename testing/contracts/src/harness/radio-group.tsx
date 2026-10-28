import { RadioField, RadioGroup } from '@mszczygiel-projects/ui-core-react';

import type { RadioGroupContractProps } from '../specs/radio-group.contract.ts';
import { reactMount } from './react.tsx';
import { webComponentMount } from './web-component.ts';

/**
 * Maps the initial value to the value attribute, the callback to the event and the options to
 * ui-radio-field children, as a page would.
 */
export const mountWebComponentRadioGroup = webComponentMount<RadioGroupContractProps>(
  'ui-radio-group',
  (element, { defaultValue, onValueChange, options, ...properties }) => {
    if (defaultValue !== undefined) {
      element.setAttribute('value', defaultValue);
    }
    Object.assign(element, properties);
    if (onValueChange) {
      element.addEventListener('ui-value-change', (event) => {
        const { detail } = event as CustomEvent<{ value: string; originalEvent: Event }>;
        onValueChange(detail.value, { originalEvent: detail.originalEvent });
      });
    }
    if (options !== undefined) {
      element.replaceChildren(
        ...options.map((option) => Object.assign(document.createElement('ui-radio-field'), option)),
      );
    }
  },
);

/** The options, expressed as RadioField children. */
function ReactRadioGroup({ options = [], ...props }: RadioGroupContractProps) {
  return (
    <RadioGroup {...props}>
      {options.map((option) => (
        <RadioField key={option.value} {...option} />
      ))}
    </RadioGroup>
  );
}

export const mountReactRadioGroup = reactMount(ReactRadioGroup, 'ui-radio-group');
