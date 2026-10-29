import { Listbox } from '@mszczygiel-projects/ui-core-react';
import type { ListboxValue } from '@mszczygiel-projects/ui-core-shared/listbox';

import type { ListboxContractProps } from '../specs/listbox.contract.ts';
import { reactMount } from './react.tsx';
import { webComponentMount } from './web-component.ts';

/**
 * Maps the initial value to the value attribute or to defaultValue, and the callback to the event,
 * as a page would.
 */
export const mountWebComponentListbox = webComponentMount<ListboxContractProps>(
  'ui-listbox',
  (element, { defaultValue, onValueChange, ...properties }) => {
    Object.assign(element, properties);
    if (typeof defaultValue === 'string') {
      element.setAttribute('value', defaultValue);
    } else if (defaultValue !== undefined) {
      Object.assign(element, { defaultValue });
    }
    if (onValueChange) {
      element.addEventListener('ui-value-change', (event) => {
        const { detail } = event as CustomEvent<{ value: ListboxValue; originalEvent: Event }>;
        onValueChange(detail.value, { originalEvent: detail.originalEvent });
      });
    }
  },
);

export const mountReactListbox = reactMount(Listbox, 'ui-listbox');
