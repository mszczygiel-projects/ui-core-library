import { Button, Dialog } from '@mszczygiel-projects/ui-core-react';
import { useState } from 'react';

import type { DialogContractProps } from '../specs/dialog.contract.ts';
import { reactContent, webComponentContent } from './overlay-content.tsx';
import { reactMount } from './react.tsx';
import { webComponentMount } from './web-component.ts';
import { listenToOpenChange } from './web-component-overlay.ts';

/** Sets props as properties, the callback as a listener, and the content as children. */
export const mountWebComponentDialog = webComponentMount<DialogContractProps>(
  'ui-dialog',
  (element, { content, footer, onOpenChange, ...properties }) => {
    Object.assign(element, properties);
    listenToOpenChange(element, onOpenChange);
    if (content !== undefined || footer !== undefined) {
      const children = content === undefined ? [] : webComponentContent(content);
      if (footer !== undefined) {
        const button = document.createElement('ui-button');
        button.setAttribute('slot', 'footer');
        button.textContent = footer;
        children.push(button);
      }
      element.replaceChildren(...children);
    }
  },
);

/** A parent that controls the dialog, closing it unless the contract refuses. */
function ControlledDialog({
  open = false,
  content,
  footer,
  onOpenChange,
  ...props
}: DialogContractProps) {
  const [shown, setShown] = useState(open);
  const [requested, setRequested] = useState(open);
  if (requested !== open) {
    setRequested(open);
    setShown(open);
  }
  return (
    <Dialog
      {...props}
      open={shown}
      onOpenChange={(next, details) => {
        if (onOpenChange?.(next, details) !== false) {
          setShown(next);
        }
      }}
      footer={footer === undefined ? undefined : <Button>{footer}</Button>}
    >
      {reactContent(content)}
    </Dialog>
  );
}

export const mountReactDialog = reactMount(ControlledDialog, 'ui-dialog');
