'use client';

import { type RefObject, useEffect, useState } from 'react';

/**
 * Follows the owning form of a native control: `onReset` runs after a reset of the form, and the
 * returned flag is whether a disabled fieldset disables the control, which a component that draws
 * its own control needs to know.
 */
export function useFormState(
  control: RefObject<HTMLSelectElement | HTMLInputElement | HTMLButtonElement | null>,
  onReset: () => void,
): boolean {
  const [fieldsetDisabled, setFieldsetDisabled] = useState(false);

  useEffect(() => {
    const element = control.current;
    if (element === null) {
      return;
    }
    const events = new AbortController();
    element.form?.addEventListener(
      'reset',
      (event) => {
        // The form resets its controls after the event, and only when no listener canceled it.
        // A reset button dispatches the event from a click, where a microtask runs between two
        // listeners, so the check waits for a task, after every listener and the reset itself.
        setTimeout(() => {
          if (!event.defaultPrevented) {
            onReset();
          }
        }, 0);
      },
      { signal: events.signal },
    );
    const update = () => {
      setFieldsetDisabled(element.matches(':disabled'));
    };
    update();
    const observer = new MutationObserver(update);
    for (
      let fieldset = element.closest('fieldset');
      fieldset !== null;
      fieldset = fieldset.parentElement?.closest('fieldset') ?? null
    ) {
      observer.observe(fieldset, { attributeFilter: ['disabled'] });
    }
    return () => {
      events.abort();
      observer.disconnect();
    };
  });

  return fieldsetDisabled;
}
