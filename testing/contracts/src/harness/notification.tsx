import { Notification } from '@mszczygiel-projects/ui-core-react';

import type { NotificationContractProps } from '../specs/notification.contract.ts';
import { reactMount } from './react.tsx';
import { webComponentMount } from './web-component.ts';

/** Sets props as properties, the callback as a listener of the event and the content as text. */
export const mountWebComponentNotification = webComponentMount<NotificationContractProps>(
  'ui-notification',
  (element, { children, onDismiss, ...properties }) => {
    Object.assign(element, properties);
    if (onDismiss) {
      element.addEventListener('ui-dismiss', (event) => {
        onDismiss({ originalEvent: event.detail.originalEvent });
      });
    }
    if (children !== undefined) {
      element.textContent = children;
    }
  },
);

export const mountReactNotification = reactMount(Notification, 'ui-notification');
