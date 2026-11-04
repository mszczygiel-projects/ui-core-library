import { Menu } from '@mszczygiel-projects/ui-core-react';
import type {
  MenuActionDetail,
  MenuOpenChangeDetail,
} from '@mszczygiel-projects/ui-core-shared/menu';
import { useState } from 'react';

import type { MenuContractProps } from '../specs/menu.contract.ts';
import { reactMount } from './react.tsx';
import { webComponentMount } from './web-component.ts';

/** Sets props as properties, the callbacks as listeners, and a native button as the trigger. */
export const mountWebComponentMenu = webComponentMount<MenuContractProps>(
  'ui-menu',
  (element, { onOpenChange, onAction, ...properties }) => {
    Object.assign(element, properties);
    if (element.dataset['listening'] === undefined) {
      element.dataset['listening'] = '';
      element.addEventListener('ui-open-change', (event) => {
        const { detail } = event as CustomEvent<MenuOpenChangeDetail<Event>>;
        const { value, ...details } = detail;
        if (onOpenChange?.(value, details) === false) {
          event.preventDefault();
        }
      });
      element.addEventListener('ui-action', (event) => {
        const { detail } = event as CustomEvent<MenuActionDetail<Event>>;
        const { value, ...details } = detail;
        onAction?.(value, details);
      });
    }
    if (element.childElementCount === 0) {
      const button = document.createElement('button');
      button.setAttribute('slot', 'trigger');
      button.textContent = 'Actions';
      element.replaceChildren(button);
    }
  },
);

/** A parent that controls the menu, following each request unless the contract refuses. */
function ControlledMenu({ open = false, onOpenChange, ...props }: MenuContractProps) {
  const [shown, setShown] = useState(open);
  const [requested, setRequested] = useState(open);
  if (requested !== open) {
    setRequested(open);
    setShown(open);
  }
  return (
    <Menu
      {...props}
      open={shown}
      trigger={<button type="button">Actions</button>}
      onOpenChange={(next, details) => {
        if (onOpenChange?.(next, details) !== false) {
          setShown(next);
        }
      }}
    />
  );
}

export const mountReactMenu = reactMount(ControlledMenu, 'ui-menu');
