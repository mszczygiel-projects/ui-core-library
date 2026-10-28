import { PasswordField } from '@mszczygiel-projects/ui-core-react';

import type { PasswordFieldContractProps } from '../specs/password-field.contract.ts';
import { reactMount } from './react.tsx';
import { webComponentMount } from './web-component.ts';

/** Maps the initial state to attributes and the callbacks to events, as a page would. */
export const mountWebComponentPasswordField = webComponentMount<PasswordFieldContractProps>(
  'ui-password-field',
  (element, props) => {
    const { defaultValue, defaultRevealed, onValueChange, onRevealedChange, ...properties } = props;
    if (defaultValue !== undefined) {
      element.setAttribute('value', defaultValue);
    }
    if (defaultRevealed !== undefined) {
      element.toggleAttribute('revealed', defaultRevealed);
    }
    Object.assign(element, properties);
    if (onValueChange) {
      element.addEventListener('ui-value-change', (event) => {
        onValueChange(event.detail.value, { originalEvent: event.detail.originalEvent });
      });
    }
    if (onRevealedChange) {
      element.addEventListener('ui-revealed-change', (event) => {
        onRevealedChange(event.detail.value, { originalEvent: event.detail.originalEvent });
      });
    }
  },
);

export const mountReactPasswordField = reactMount(PasswordField, 'ui-password-field');
