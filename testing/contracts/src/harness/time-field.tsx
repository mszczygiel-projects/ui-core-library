import { TimeField } from '@mszczygiel-projects/ui-core-react';
import type { TimeFieldValueChangeDetail } from '@mszczygiel-projects/ui-core-shared/time-field';

import type { TimeFieldContractProps } from '../specs/time-field.contract.ts';
import { reactMount } from './react.tsx';
import { webComponentMount } from './web-component.ts';

const subscriptions = new WeakMap<HTMLElement, EventListener>();

/** Translates defaults and event spelling, without implementing behaviour. */
export const mountWebComponentTimeField = webComponentMount<TimeFieldContractProps>(
  'ui-time-field',
  (element, { defaultValue, onValueChange, ...properties }) => {
    if (defaultValue !== undefined) {
      element.setAttribute('value', defaultValue);
    }
    Object.assign(element, properties);
    const previous = subscriptions.get(element);
    if (previous !== undefined) {
      element.removeEventListener('ui-value-change', previous);
    }
    if (onValueChange !== undefined) {
      const listener = (event: Event) => {
        const { value, ...details } = (event as CustomEvent<TimeFieldValueChangeDetail<Event>>)
          .detail;
        onValueChange(value, details);
      };
      subscriptions.set(element, listener);
      element.addEventListener('ui-value-change', listener);
    }
  },
);

export const mountReactTimeField = reactMount(TimeField, 'ui-time-field');
