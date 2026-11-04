import { SplitButton } from '@mszczygiel-projects/ui-core-react';
import type {
  SplitButtonActionDetail,
  SplitButtonOpenChangeDetail,
} from '@mszczygiel-projects/ui-core-shared/split-button';
import { useState } from 'react';

import type { SplitButtonContractProps } from '../specs/split-button.contract.ts';
import { iconElement, IconNode } from './icon.tsx';
import { reactMount } from './react.tsx';
import { webComponentMount } from './web-component.ts';

/**
 * Sets props as properties, content as text, icon flags as slots and the callbacks as listeners;
 * the main action is the native click of the host.
 */
export const mountWebComponentSplitButton = webComponentMount<SplitButtonContractProps>(
  'ui-split-button',
  (element, props) => {
    const { children, leadingIcon, trailingIcon, onPress, onOpenChange, onAction, ...properties } =
      props;
    Object.assign(element, properties);
    if (element.dataset['listening'] === undefined) {
      element.dataset['listening'] = '';
      element.addEventListener('click', (event) => {
        onPress?.(event);
      });
      element.addEventListener('ui-open-change', (event) => {
        const { detail } = event as CustomEvent<SplitButtonOpenChangeDetail<Event>>;
        const { value, ...details } = detail;
        if (onOpenChange?.(value, details) === false) {
          event.preventDefault();
        }
      });
      element.addEventListener('ui-action', (event) => {
        const { detail } = event as CustomEvent<SplitButtonActionDetail<Event>>;
        const { value, ...details } = detail;
        onAction?.(value, details);
      });
    }
    if (children !== undefined) {
      let label = element.querySelector('[data-contract-label]');
      if (label === null) {
        label = document.createElement('span');
        label.setAttribute('data-contract-label', '');
        element.append(label);
      }
      label.textContent = children;
    }
    for (const [name, enabled] of [
      ['leading-icon', leadingIcon],
      ['trailing-icon', trailingIcon],
    ] as const) {
      if (enabled === undefined) {
        continue;
      }
      element.querySelector(`[slot="${name}"]`)?.remove();
      if (enabled) {
        element.append(iconElement(name));
      }
    }
  },
);

/** A parent that controls the menu, following each request unless the contract refuses. */
function ControlledSplitButton({
  open = false,
  leadingIcon,
  trailingIcon,
  onPress,
  onOpenChange,
  ...props
}: SplitButtonContractProps) {
  const [shown, setShown] = useState(open);
  const [requested, setRequested] = useState(open);
  if (requested !== open) {
    setRequested(open);
    setShown(open);
  }
  const icon = <IconNode />;
  return (
    <SplitButton
      {...props}
      open={shown}
      leadingIcon={leadingIcon ? icon : undefined}
      trailingIcon={trailingIcon ? icon : undefined}
      onClick={(event) => {
        onPress?.(event.nativeEvent);
      }}
      onOpenChange={(next, details) => {
        if (onOpenChange?.(next, details) !== false) {
          setShown(next);
        }
      }}
    />
  );
}

export const mountReactSplitButton = reactMount(ControlledSplitButton, 'ui-split-button');
