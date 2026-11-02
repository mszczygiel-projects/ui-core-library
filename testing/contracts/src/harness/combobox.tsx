import { Combobox } from '@mszczygiel-projects/ui-core-react';

import type { ComboboxContractProps } from '../specs/combobox.contract.ts';
import { reactMount } from './react.tsx';
import { webComponentMount } from './web-component.ts';

/**
 * Maps the initial value to the value attribute or to defaultValue, and the callbacks to the
 * events, as a page would.
 */
export const mountWebComponentCombobox = webComponentMount<ComboboxContractProps>(
  'ui-combobox',
  (
    element,
    { defaultValue, onValueChange, onOpenChange, onQueryChange, onCreate, ...properties },
  ) => {
    Object.assign(element, properties);
    if (typeof defaultValue === 'string') {
      element.setAttribute('value', defaultValue);
    } else if (defaultValue !== undefined) {
      Object.assign(element, { defaultValue });
    }
    const listen = (
      name: string,
      // Each callback takes the type of value its event carries.
      callback?: (value: never, details: { originalEvent: Event }) => void,
    ) => {
      if (callback) {
        element.addEventListener(name, (event) => {
          const { detail } = event as CustomEvent<{ value: never; originalEvent: Event }>;
          callback(detail.value, { originalEvent: detail.originalEvent });
        });
      }
    };
    listen('ui-value-change', onValueChange);
    listen('ui-open-change', onOpenChange);
    listen('ui-query-change', onQueryChange);
    listen('ui-create', onCreate);
  },
);

export const mountReactCombobox = reactMount(Combobox, 'ui-combobox');
