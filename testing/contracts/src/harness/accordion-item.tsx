import { AccordionItem } from '@mszczygiel-projects/ui-core-react';
import { useState } from 'react';

import type { AccordionItemContractProps } from '../specs/accordion-item.contract.ts';
import { reactMount } from './react.tsx';
import { webComponentMount } from './web-component.ts';

/** Sets props as properties, the callback as a listener and content as text, as a page would. */
export const mountWebComponentAccordionItem = webComponentMount<AccordionItemContractProps>(
  'ui-accordion-item',
  (element, { children, onOpenChange, ...properties }) => {
    Object.assign(element, properties);
    if (onOpenChange !== undefined && element.dataset['listening'] === undefined) {
      element.dataset['listening'] = '';
      // The page is typed as HTMLElement, whose `ui-open-change` is the event of the overlays.
      (element as HTMLUiAccordionItemElement).addEventListener('ui-open-change', (event) => {
        const { value, ...details } = event.detail;
        if (onOpenChange(value, details) === false) {
          event.preventDefault();
        }
      });
    }
    if (children !== undefined) {
      element.textContent = children;
    }
  },
);

/** A parent that controls the section, following each request unless the contract refuses. */
export function ControlledAccordionItem({
  open = false,
  onOpenChange,
  ...props
}: AccordionItemContractProps) {
  const [shown, setShown] = useState(open);
  const [requested, setRequested] = useState(open);
  if (requested !== open) {
    setRequested(open);
    setShown(open);
  }
  return (
    <AccordionItem
      {...props}
      open={shown}
      onOpenChange={(next, details) => {
        // A request of the group follows the press that caused it, which the contract refused or not.
        if (details.reason === 'group') {
          setShown(next);
          return;
        }
        if (onOpenChange?.(next, details) !== false) {
          setShown(next);
        }
      }}
    />
  );
}

export const mountReactAccordionItem = reactMount(ControlledAccordionItem, 'ui-accordion-item');
