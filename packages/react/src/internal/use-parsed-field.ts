import { resolveLocale } from '@mszczygiel-projects/ui-core-shared/locale';
import type { ParsedInput } from '@mszczygiel-projects/ui-core-shared/parsed-input';
import { type RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { useBrowserLanguage } from './use-browser.ts';
import { useUiCoreConfig } from './use-ui-core-config.ts';

interface ParsedFieldOptions<Value extends number | string | null, Error extends string> {
  readonly inputRef: RefObject<HTMLInputElement | null>;
  readonly entryRef: RefObject<HTMLInputElement | null>;
  readonly required?: boolean;
  readonly value: Value | undefined;
  readonly defaultValue: Value;
  readonly locale?: string;
  readonly form?: string;
  readonly parse: (text: string, locale: string) => ParsedInput<Value>;
  readonly format: (value: Value, locale: string) => string;
  readonly serialize: (value: Value) => string;
  readonly validate: (parsed: ParsedInput<Value>) => Error | null;
  readonly message: (error: Error, locale: string) => string;
}

function acceptedValue<Value>(value: Value | undefined, fallback: Value): Value {
  if (value === undefined) {
    return fallback;
  }
  return value;
}

/** Keeps editable text separate from the canonical entry accepted by the application. */
export function useParsedField<Value extends number | string | null, Error extends string>(
  options: ParsedFieldOptions<Value, Error>,
) {
  const config = useUiCoreConfig();
  const browserLocale = useBrowserLanguage();
  const configured = resolveLocale(options.locale, config.locale, browserLocale);
  const [editingLocale, setEditingLocale] = useState<string>();
  const [touched, setTouched] = useState(false);
  const [draft, setDraft] = useState(() => ({
    text: options.format(acceptedValue(options.value, options.defaultValue), configured),
    source: options.value,
    locale: configured,
  }));
  const { inputRef, entryRef } = options;
  const draftParsed = options.parse(draft.text, draft.locale);
  const external =
    options.value !== undefined &&
    options.value !== draft.source &&
    options.value !== draftParsed.value;
  const rejected =
    options.value !== undefined &&
    (draftParsed.inputState === 'valid' || draftParsed.inputState === 'empty') &&
    draftParsed.value !== options.value;
  // Incomplete text keeps its original grammar even when configuration changes during editing.
  const locale =
    editingLocale ??
    (!external && (draftParsed.inputState === 'incomplete' || draftParsed.inputState === 'invalid')
      ? draft.locale
      : configured);
  const text =
    external || rejected
      ? options.format(acceptedValue(options.value, options.defaultValue), locale)
      : locale !== draft.locale && draftParsed.inputState === 'valid'
        ? options.format(draftParsed.value, locale)
        : draft.text;
  const parsed = options.parse(text, locale);
  const error = options.validate(parsed);
  const canonical = options.serialize(acceptedValue(options.value, parsed.value));
  const message = error === null ? '' : options.message(error, locale);

  useLayoutEffect(() => {
    inputRef.current?.setCustomValidity(message);
  }, [message, inputRef, draft]);

  // The listeners read the latest render, so they subscribe once per form instead of per keystroke.
  const latest = useRef({ options, configured, locale, text });
  useLayoutEffect(() => {
    latest.current = { options, configured, locale, text };
  });

  useEffect(() => {
    const input = inputRef.current;
    const form = input?.form;
    const events = new AbortController();
    const restore = () => {
      const current = latest.current;
      if (input !== null && input.value !== current.text) {
        setDraft({ text: input.value, source: current.options.value, locale: current.locale });
      }
    };
    form?.addEventListener(
      'reset',
      (event) => {
        queueMicrotask(() => {
          if (event.defaultPrevented) {
            return;
          }
          const { options: current, configured: resetLocale } = latest.current;
          setTouched(false);
          setEditingLocale(undefined);
          setDraft({
            text: current.format(acceptedValue(current.value, current.defaultValue), resetLocale),
            source: current.value,
            locale: resetLocale,
          });
        });
      },
      { signal: events.signal },
    );
    window.addEventListener('pageshow', restore, { signal: events.signal });
    return () => {
      events.abort();
    };
  }, [inputRef, options.form]);

  const edit = (nextText: string) => {
    const next = options.parse(nextText, locale);
    const validationError = options.validate(next);
    inputRef.current?.setCustomValidity(
      validationError === null ? '' : options.message(validationError, locale),
    );
    if (entryRef.current !== null) {
      entryRef.current.value = options.serialize(acceptedValue(options.value, next.value));
    }
    setDraft({ text: nextText, source: options.value, locale });
    return { ...next, text: nextText, validationError };
  };
  return {
    locale,
    text,
    parsed,
    canonical,
    edit,
    invalid: touched && (error !== null || (options.required === true && text === '')),
    focus: () => {
      setEditingLocale(locale);
    },
    blur: () => {
      setTouched(true);
      setEditingLocale(undefined);
    },
    report: () => {
      setTouched(true);
    },
  };
}
