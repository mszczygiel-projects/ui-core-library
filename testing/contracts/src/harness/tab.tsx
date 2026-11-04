import { Tab } from '@mszczygiel-projects/ui-core-react';

import type { TabContractProps } from '../specs/tab.contract.ts';
import { reactMount } from './react.tsx';
import { webComponentMount } from './web-component.ts';

/** Sets props as properties and content as text, as a page would. */
export const mountWebComponentTab = webComponentMount<TabContractProps>(
  'ui-tab',
  (element, { children, ...properties }) => {
    Object.assign(element, properties);
    if (children !== undefined) {
      element.textContent = children;
    }
  },
);

export const mountReactTab = reactMount(Tab, 'ui-tab');
