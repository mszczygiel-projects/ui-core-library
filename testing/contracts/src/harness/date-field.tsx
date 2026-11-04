import { DateField } from '@mszczygiel-projects/ui-core-react';
import type {
  DateFieldOpenChangeDetail,
  DateFieldValueChangeDetail,
} from '@mszczygiel-projects/ui-core-shared/date-field';

import type { DateFieldContractProps } from '../specs/date-field.contract.ts';
import { reactMount } from './react.tsx';
import { webComponentMount } from './web-component.ts';

const subscriptions = new WeakMap<HTMLElement, EventListener>();

const openSubscriptions = new WeakMap<HTMLElement, EventListener>();

/** Translates props, defaults and event spelling; all behaviour stays in the components. */
export const mountWebComponentDateField = webComponentMount<DateFieldContractProps>(
  'ui-date-field',
  (element, props) => {
    const { defaultValue, onValueChange, onOpenChange, ...properties } = props;
    Object.assign(element, properties);
    if (defaultValue !== undefined) {
      element.setAttribute('value', defaultValue);
    }
    const previous = subscriptions.get(element);
    if ('onValueChange' in props && previous !== undefined) {
      element.removeEventListener('ui-value-change', previous);
    }
    if (onValueChange !== undefined) {
      const listener = (event: Event) => {
        const { value, ...details } = (event as CustomEvent<DateFieldValueChangeDetail<Event>>)
          .detail;
        onValueChange(value, details);
      };
      subscriptions.set(element, listener);
      element.addEventListener('ui-value-change', listener);
    }
    const previousOpen = openSubscriptions.get(element);
    if ('onOpenChange' in props && previousOpen !== undefined) {
      element.removeEventListener('ui-open-change', previousOpen);
    }
    if (onOpenChange !== undefined) {
      const listener = (event: Event) => {
        const { value, ...details } = (event as CustomEvent<DateFieldOpenChangeDetail<Event>>)
          .detail;
        onOpenChange(value, details);
      };
      openSubscriptions.set(element, listener);
      element.addEventListener('ui-open-change', listener);
    }
  },
);

export const mountReactDateField = reactMount(DateField, 'ui-date-field');
