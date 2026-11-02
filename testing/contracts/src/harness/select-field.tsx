import { SelectField } from '@mszczygiel-projects/ui-core-react';

import type { SelectFieldContractProps } from '../specs/select-field.contract.ts';
import { reactMount } from './react.tsx';
import { webComponentMount } from './web-component.ts';

/**
 * Maps the initial value to the value attribute and the callbacks to the events, as a page would.
 */
export const mountWebComponentSelectField = webComponentMount<SelectFieldContractProps>(
  'ui-select-field',
  (element, { defaultValue, onValueChange, onOpenChange, ...properties }) => {
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
    if (onOpenChange) {
      element.addEventListener('ui-open-change', (event) => {
        const { detail } = event as CustomEvent<{ value: boolean; originalEvent: Event }>;
        onOpenChange(detail.value, { originalEvent: detail.originalEvent });
      });
    }
  },
);

export const mountReactSelectField = reactMount(SelectField, 'ui-select-field');
