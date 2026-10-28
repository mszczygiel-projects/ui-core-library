import { CheckboxField } from '@mszczygiel-projects/ui-core-react';

import type { CheckboxFieldContractProps } from '../specs/checkbox-field.contract.ts';
import { reactMount } from './react.tsx';
import { webComponentMount } from './web-component.ts';

/** Maps the initial state to the checked attribute and the callback to the event, as a page would. */
export const mountWebComponentCheckboxField = webComponentMount<CheckboxFieldContractProps>(
  'ui-checkbox-field',
  (element, { defaultChecked, onCheckedChange, ...properties }) => {
    if (defaultChecked !== undefined) {
      element.toggleAttribute('checked', defaultChecked);
    }
    Object.assign(element, properties);
    if (onCheckedChange) {
      element.addEventListener('ui-checked-change', (event) => {
        onCheckedChange(event.detail.value, { originalEvent: event.detail.originalEvent });
      });
    }
  },
);

export const mountReactCheckboxField = reactMount(CheckboxField, 'ui-checkbox-field');
