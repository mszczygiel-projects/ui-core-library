import { type DateMaskOptions, dateMaskOptions } from '@mszczygiel-projects/ui-core-shared/date';
import IMask from 'imask';
import { type RefObject, useEffect, useLayoutEffect, useRef } from 'react';

/** IMask owns editing mechanics; shared owns calendar validity and ISO conversion. */
export function useDateMask(
  inputRef: RefObject<HTMLInputElement | null>,
  locale: string,
  text: string,
  onMaskEdit: (event: Event) => void,
  enabled: boolean,
  optionsForLocale: (locale: string) => DateMaskOptions = dateMaskOptions,
): void {
  const maskRef = useRef<ReturnType<typeof IMask> | null>(null);
  const composing = useRef(false);
  const editedRef = useRef(onMaskEdit);
  useLayoutEffect(() => {
    editedRef.current = onMaskEdit;
  }, [onMaskEdit]);
  useEffect(() => {
    const input = inputRef.current;
    if (input === null || !enabled) {
      return;
    }
    const mask = IMask(input, { ...optionsForLocale(locale) });
    maskRef.current = mask;
    const events = new AbortController();
    const options = { signal: events.signal };
    let inputVersion = 0;
    input.addEventListener(
      'input',
      () => {
        inputVersion += 1;
      },
      options,
    );
    // IMask handles history without a native input event. Observe its result afterwards.
    input.addEventListener(
      'keydown',
      (event) => {
        if (event.defaultPrevented) {
          editedRef.current(event);
        }
      },
      options,
    );
    input.addEventListener(
      'beforeinput',
      (event) => {
        if (event.inputType === 'historyUndo' || event.inputType === 'historyRedo') {
          editedRef.current(event);
        }
      },
      options,
    );
    input.addEventListener(
      'compositionstart',
      () => {
        composing.current = true;
      },
      options,
    );
    input.addEventListener(
      'compositionend',
      (event) => {
        composing.current = false;
        const version = inputVersion;
        // Some browsers also emit a final input; that event owns the edit when present.
        queueMicrotask(() => {
          if (!events.signal.aborted && version === inputVersion) {
            editedRef.current(event);
          }
        });
      },
      options,
    );
    return () => {
      events.abort();
      composing.current = false;
      mask.destroy();
      maskRef.current = null;
    };
  }, [inputRef, locale, enabled, optionsForLocale]);
  // Programmatic updates must also update IMask's saved selection and undo state.
  useEffect(() => {
    if (!composing.current) {
      maskRef.current?.updateValue();
    }
  }, [inputRef, text]);
}
