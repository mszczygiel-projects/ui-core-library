import { TextareaField } from '@mszczygiel-projects/ui-core-react';

import type { TextareaFieldContractProps } from '../specs/textarea-field.contract.ts';
import { reactMount } from './react.tsx';
import { webComponentMount } from './web-component.ts';

/** Maps the initial value to the attribute and the value callback to its event, as a page would. */
export const mountWebComponentTextareaField = webComponentMount<TextareaFieldContractProps>(
  'ui-textarea-field',
  (element, props) => {
    const { defaultValue, onValueChange, ...properties } = props;
    if (defaultValue !== undefined) {
      element.setAttribute('value', defaultValue);
    }
    Object.assign(element, properties);
    if (onValueChange) {
      element.addEventListener('ui-value-change', (event) => {
        onValueChange(event.detail.value, { originalEvent: event.detail.originalEvent });
      });
    }
  },
);

export const mountReactTextareaField = reactMount(TextareaField, 'ui-textarea-field');
