import { RadioField } from '@mszczygiel-projects/ui-core-react';

import type { RadioFieldContractProps } from '../specs/radio-field.contract.ts';
import { reactMount } from './react.tsx';
import { webComponentMount } from './web-component.ts';

/** Sets props as properties, as a page would. */
export const mountWebComponentRadioField =
  webComponentMount<RadioFieldContractProps>('ui-radio-field');

export const mountReactRadioField = reactMount(RadioField, 'ui-radio-field');
