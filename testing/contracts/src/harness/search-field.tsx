import { SearchField } from '@mszczygiel-projects/ui-core-react';

import type { SearchFieldContractProps } from '../specs/search-field.contract.ts';
import { reactMount } from './react.tsx';
import { webComponentMount } from './web-component.ts';

/** Maps the initial value to the attribute and the callbacks to events, as a page would. */
export const mountWebComponentSearchField = webComponentMount<SearchFieldContractProps>(
  'ui-search-field',
  (element, props) => {
    const { defaultValue, onValueChange, onClear, ...properties } = props;
    if (defaultValue !== undefined) {
      element.setAttribute('value', defaultValue);
    }
    Object.assign(element, properties);
    if (onValueChange) {
      element.addEventListener('ui-value-change', (event) => {
        onValueChange(event.detail.value, { originalEvent: event.detail.originalEvent });
      });
    }
    if (onClear) {
      element.addEventListener('ui-clear', (event) => {
        onClear({ originalEvent: event.detail.originalEvent });
      });
    }
  },
);

export const mountReactSearchField = reactMount(SearchField, 'ui-search-field');
