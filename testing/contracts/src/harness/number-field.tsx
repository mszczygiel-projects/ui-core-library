import { NumberField } from '@mszczygiel-projects/ui-core-react';
import type { NumberFieldValueChangeDetail } from '@mszczygiel-projects/ui-core-shared/number-field';

import type { NumberFieldContractProps } from '../specs/number-field.contract.ts';
import { reactMount } from './react.tsx';
import { webComponentMount } from './web-component.ts';

const subscriptions = new WeakMap<HTMLElement, EventListener>();

/** Translates props, defaults and event spelling; all behaviour stays in the components. */
export const mountWebComponentNumberField = webComponentMount<NumberFieldContractProps>(
  'ui-number-field',
  (element, props) => {
    const { defaultValue, onValueChange, ...properties } = props;
    Object.assign(element, properties);
    if (defaultValue !== undefined) {
      element.setAttribute('value', defaultValue === null ? '' : String(defaultValue));
    }
    const previous = subscriptions.get(element);
    if ('onValueChange' in props && previous !== undefined) {
      element.removeEventListener('ui-value-change', previous);
    }
    if (onValueChange !== undefined) {
      const listener = (event: Event) => {
        const { value, ...details } = (event as CustomEvent<NumberFieldValueChangeDetail<Event>>)
          .detail;
        onValueChange(value, details);
      };
      subscriptions.set(element, listener);
      element.addEventListener('ui-value-change', listener);
    }
  },
);

export const mountReactNumberField = reactMount(NumberField, 'ui-number-field');
