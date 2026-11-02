import { Button, SelectField } from '@mszczygiel-projects/ui-core-react';
import type { ReactNode } from 'react';

import { FRUIT } from '../specs/listbox.contract.ts';
import type { OverlayContent } from '../specs/overlay.contract.ts';

/** Long enough to scroll in any window of the contracts. */
const PARAGRAPHS = Array.from({ length: 40 }, (_, index) => `Paragraph ${String(index + 1)}`);

/** The content of a modal as a page writes it, with the web components. */
export function webComponentContent(content: OverlayContent): Element[] {
  const element = (tag: string, attributes: Record<string, string> = {}, text = '') => {
    const node = document.createElement(tag);
    for (const [name, value] of Object.entries(attributes)) {
      node.setAttribute(name, value);
    }
    node.textContent = text;
    return node;
  };
  switch (content) {
    case 'text':
      return [element('p', {}, 'Content')];
    case 'fields':
    case 'autofocus':
      return [
        element('input', { 'aria-label': 'First' }),
        element('input', {
          'aria-label': 'Second',
          ...(content === 'autofocus' ? { 'data-autofocus': '' } : {}),
        }),
      ];
    case 'form': {
      const form = element('form', { method: 'dialog' });
      form.append(
        element('button', { value: 'cancel' }, 'Cancel'),
        element('button', { value: 'confirm' }, 'Confirm'),
      );
      return [form];
    }
    case 'buttons': {
      const form = element('form', { method: 'dialog' });
      form.append(
        element('ui-button', { type: 'submit', value: 'cancel' }, 'Cancel'),
        element('ui-button', { type: 'submit', value: 'confirm' }, 'Confirm'),
      );
      return [form];
    }
    case 'select': {
      const field = document.createElement('ui-select-field');
      Object.assign(field, { label: 'Fruit', options: FRUIT });
      return [field];
    }
    case 'long':
      return PARAGRAPHS.map((text) => element('p', {}, text));
  }
}

/** The content of a modal as a page writes it, with the React components. */
export function reactContent(content: OverlayContent | undefined): ReactNode {
  switch (content) {
    case undefined:
      return null;
    case 'text':
      return <p>Content</p>;
    case 'fields':
    case 'autofocus':
      return (
        <>
          <input aria-label="First" />
          <input
            aria-label="Second"
            {...(content === 'autofocus' ? { 'data-autofocus': '' } : {})}
          />
        </>
      );
    case 'form':
      return (
        <form method="dialog">
          <button value="cancel">Cancel</button>
          <button value="confirm">Confirm</button>
        </form>
      );
    case 'buttons':
      return (
        <form method="dialog">
          <Button type="submit" value="cancel">
            Cancel
          </Button>
          <Button type="submit" value="confirm">
            Confirm
          </Button>
        </form>
      );
    case 'select':
      return <SelectField label="Fruit" options={FRUIT} />;
    case 'long':
      return PARAGRAPHS.map((text) => <p key={text}>{text}</p>);
  }
}
