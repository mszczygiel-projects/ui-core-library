import { Drawer } from '@mszczygiel-projects/ui-core-react';
import { useState } from 'react';

import type { DrawerContractProps } from '../specs/drawer.contract.ts';
import { reactContent, webComponentContent } from './overlay-content.tsx';
import { reactMount } from './react.tsx';
import { webComponentMount } from './web-component.ts';
import { listenToOpenChange } from './web-component-overlay.ts';

/** Sets props as properties, the callback as a listener, and the content as children. */
export const mountWebComponentDrawer = webComponentMount<DrawerContractProps>(
  'ui-drawer',
  (element, { content, onOpenChange, ...properties }) => {
    Object.assign(element, properties);
    listenToOpenChange(element, onOpenChange);
    if (content !== undefined) {
      element.replaceChildren(...webComponentContent(content));
    }
  },
);

/** A parent that controls the drawer, closing it unless the contract refuses. */
function ControlledDrawer({ open = false, content, onOpenChange, ...props }: DrawerContractProps) {
  const [shown, setShown] = useState(open);
  const [requested, setRequested] = useState(open);
  if (requested !== open) {
    setRequested(open);
    setShown(open);
  }
  return (
    <Drawer
      {...props}
      open={shown}
      onOpenChange={(next, details) => {
        if (onOpenChange?.(next, details) !== false) {
          setShown(next);
        }
      }}
    >
      {reactContent(content)}
    </Drawer>
  );
}

export const mountReactDrawer = reactMount(ControlledDrawer, 'ui-drawer');
