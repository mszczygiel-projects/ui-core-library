'use client';

import { type RefObject, useEffect, useState } from 'react';

/**
 * Follows the owning form of a native control: `onReset` runs after a reset of the form, and the
 * returned flag is whether a disabled fieldset disables the control, which a component that draws
 * its own control needs to know.
 */
export function useFormState(
  control: RefObject<HTMLSelectElement | null>,
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
      () => {
        // The form resets its controls after the event.
        queueMicrotask(onReset);
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
