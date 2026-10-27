'use client';

import { type Ref, useCallback } from 'react';

import { setRef } from './set-ref.ts';

/**
 * Cancels a click on a disabled or loading action where it starts, before it bubbles to the page
 * or reaches `onClick`, as the web components do. React's own handlers listen at its root, where
 * stopping the click would also hide it from the page's listeners between the root and the action.
 */
function cancelInactiveClick(event: MouseEvent): void {
  const action = event.currentTarget;
  if (
    action instanceof HTMLElement &&
    (action.matches(':disabled') ||
      action.classList.contains('ui-action--loading') ||
      action.classList.contains('ui-action--disabled'))
  ) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
}

/**
 * The ref of the element of an action: it guards the element against inactive clicks and passes
 * the element on to the ref of the consumer.
 */
export function useActionRef<T extends HTMLElement>(
  ref: Ref<T> | undefined,
): (element: T) => () => void {
  return useCallback(
    (element: T) => {
      element.addEventListener('click', cancelInactiveClick, { capture: true });
      const release = setRef(ref, element);
      return () => {
        element.removeEventListener('click', cancelInactiveClick, { capture: true });
        release();
      };
    },
    [ref],
  );
}
