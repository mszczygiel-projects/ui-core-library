import { Button, Popover, SelectField } from '@mszczygiel-projects/ui-core-react';
import type { PopoverOpenChangeDetail } from '@mszczygiel-projects/ui-core-shared/popover';
import { useState } from 'react';

import { FRUIT } from '../specs/listbox.contract.ts';
import type { PopoverContractProps } from '../specs/popover.contract.ts';
import { reactMount } from './react.tsx';
import { webComponentMount } from './web-component.ts';

/** The content of the panel as a page writes it. */
function webContent(content: PopoverContractProps['content']): Element[] {
  const element = (tag: string, attributes: Record<string, string> = {}, text = '') => {
    const node = document.createElement(tag);
    for (const [name, value] of Object.entries(attributes)) {
      node.setAttribute(name, value);
    }
    node.textContent = text;
    return node;
  };
  if (content === 'select') {
    const field = document.createElement('ui-select-field');
    Object.assign(field, { label: 'Fruit', options: FRUIT });
    return [field];
  }
  if (content === 'tall') {
    return Array.from({ length: 40 }, (_, index) => element('p', {}, `Line ${String(index + 1)}`));
  }
  return content === 'fields'
    ? [
        element('input', { 'aria-label': 'First' }),
        element('input', { 'aria-label': 'Second', 'data-autofocus': '' }),
      ]
    : [element('p', {}, 'Content')];
}

/** Sets props as properties, the callback as a listener, and the trigger and content as children. */
export const mountWebComponentPopover = webComponentMount<PopoverContractProps>(
  'ui-popover',
  (element, { trigger, content, onOpenChange, ...properties }) => {
    Object.assign(element, properties);
    if (onOpenChange !== undefined && element.dataset['listening'] === undefined) {
      element.dataset['listening'] = '';
      element.addEventListener('ui-open-change', (event) => {
        const { detail } = event as CustomEvent<PopoverOpenChangeDetail<Event>>;
        const { value, ...details } = detail;
        if (onOpenChange(value, details) === false) {
          event.preventDefault();
        }
      });
    }
    if (element.childElementCount === 0) {
      const button = document.createElement(trigger === 'native' ? 'button' : 'ui-button');
      button.setAttribute('slot', 'trigger');
      button.textContent = 'Filters';
      element.replaceChildren(button, ...webContent(content));
    }
  },
);

/** A parent that controls the popover, following each request unless the contract refuses. */
function ControlledPopover({
  open = false,
  trigger,
  content,
  onOpenChange,
  ...props
}: PopoverContractProps) {
  const [shown, setShown] = useState(open);
  const [requested, setRequested] = useState(open);
  if (requested !== open) {
    setRequested(open);
    setShown(open);
  }
  return (
    <Popover
      {...props}
      open={shown}
      trigger={
        trigger === 'native' ? <button type="button">Filters</button> : <Button>Filters</Button>
      }
      onOpenChange={(next, details) => {
        if (onOpenChange?.(next, details) !== false) {
          setShown(next);
        }
      }}
    >
      {content === 'select' ? (
        <SelectField label="Fruit" options={FRUIT} />
      ) : content === 'tall' ? (
        Array.from({ length: 40 }, (_, index) => <p key={index}>Line {index + 1}</p>)
      ) : content === 'fields' ? (
        <>
          <input aria-label="First" />
          <input aria-label="Second" data-autofocus="" />
        </>
      ) : (
        <p>Content</p>
      )}
    </Popover>
  );
}

export const mountReactPopover = reactMount(ControlledPopover, 'ui-popover');
