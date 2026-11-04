import { Calendar } from '@mszczygiel-projects/ui-core-react';
import type { CalendarChangeDetail } from '@mszczygiel-projects/ui-core-shared/calendar';

import type { CalendarContractProps } from '../specs/calendar.contract.ts';
import { reactMount } from './react.tsx';
import { webComponentMount } from './web-component.ts';

/**
 * Maps the first value and month to attributes and the callbacks to events, and sets the other
 * props as properties.
 */
export const mountWebComponentCalendar = webComponentMount<CalendarContractProps>(
  'ui-calendar',
  (element, props) => {
    const { defaultValue, defaultMonth, onValueChange, onMonthChange, ...properties } = props;
    if (!element.isConnected) {
      if (defaultValue !== undefined) {
        element.setAttribute('value', defaultValue);
      }
      if (defaultMonth !== undefined) {
        element.setAttribute('month', defaultMonth);
      }
    }
    Object.assign(element, properties);
    if (onValueChange !== undefined) {
      element.addEventListener('ui-value-change', (event: Event) => {
        const { value, ...details } = (event as CustomEvent<CalendarChangeDetail<Event>>).detail;
        onValueChange(value, details);
      });
    }
    if (onMonthChange !== undefined) {
      element.addEventListener('ui-month-change', (event: Event) => {
        const { value, ...details } = (event as CustomEvent<CalendarChangeDetail<Event>>).detail;
        onMonthChange(value, details);
      });
    }
  },
);

export const mountReactCalendar = reactMount(Calendar, 'ui-calendar');
