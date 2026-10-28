'use client';

import { iconClose, iconSearch } from '@mszczygiel-projects/ui-core-icons';
import type {
  SearchFieldClearDetails as SharedClearDetails,
  SearchFieldProps as SharedSearchFieldProps,
} from '@mszczygiel-projects/ui-core-shared/search-field';
import {
  type ComponentPropsWithRef,
  type KeyboardEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

import {
  Field,
  fieldDescription,
  fieldPart,
  fieldPlaceholder,
  splitFieldAttributes,
} from '../internal/field.tsx';
import { setRef } from '../internal/set-ref.ts';
import { useUiCoreConfig } from '../internal/use-ui-core-config.ts';
import type { TextFieldValueChangeDetails } from '../text-field/TextField.tsx';

/** The native event that cleared the query, before React wraps it. */
export type SearchFieldClearDetails = SharedClearDetails<Event>;

/** SearchField props. Appearance attributes reach the root; native attributes and ref reach the input. */
export interface SearchFieldProps
  extends
    SharedSearchFieldProps,
    Omit<
      ComponentPropsWithRef<'input'>,
      keyof SharedSearchFieldProps | 'size' | 'type' | 'value' | 'defaultValue' | 'children'
    > {
  /** The controlled value. Pair it with onValueChange to accept edits and clearing. */
  value?: string;
  /** The initial uncontrolled value, restored by native form reset. @default '' */
  defaultValue?: string;
  /** A hint for the virtual keyboard. */
  inputMode?: ComponentPropsWithRef<'input'>['inputMode'];
  /** A hint for the virtual keyboard's Enter key. */
  enterKeyHint?: ComponentPropsWithRef<'input'>['enterKeyHint'];
  /** Turns the browser's spelling suggestions on or off. */
  spellCheck?: boolean;
  /** React's native change handler, called on each user edit. */
  onChange?: ComponentPropsWithRef<'input'>['onChange'];
  /** Called once per user edit and when the query is cleared, with the new string. */
  onValueChange?: (value: string, details: TextFieldValueChangeDetails) => void;
  /** Called when the user clears the query with the clear button or Escape. */
  onClear?: (details: SearchFieldClearDetails) => void;
}

/**
 * A search input with a button that clears the query.
 *
 * The clear button shows only while the field holds a query that the user may change; it and
 * Escape empty the field, keep the focus in the input and call `onValueChange` and `onClear`.
 * Escape in an empty field reaches the page, for example to close a dialog. The field is no
 * landmark: a page wraps the search form in `<search>`.
 */
export function SearchField({
  variant = 'outline',
  size = 'medium',
  labelPlacement = 'top',
  state = 'default',
  label,
  hint,
  placeholder,
  clearLabel,
  value,
  defaultValue = '',
  disabled,
  readOnly,
  onValueChange,
  onClear,
  onChange,
  onKeyDown,
  id,
  className,
  style,
  dir,
  ref,
  'aria-describedby': describedBy,
  ...rest
}: SearchFieldProps) {
  const { labels } = useUiCoreConfig();
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const current = value ?? uncontrolled;
  const attributes = splitFieldAttributes(rest);
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${generatedId}-hint`;
  const inputRef = useRef<HTMLInputElement | null>(null);
  // A disabled fieldset disables the input without the disabled prop; the button follows it.
  const clearable = current !== '' && !disabled && readOnly !== true;

  useEffect(() => {
    const form = inputRef.current?.form;
    if (form === null || form === undefined) {
      return;
    }
    const events = new AbortController();
    form.addEventListener(
      'reset',
      () => {
        // The form resets its controls after the event, so the input holds its default then.
        queueMicrotask(() => {
          setUncontrolled(inputRef.current?.value ?? '');
        });
      },
      { signal: events.signal },
    );
    return () => {
      events.abort();
    };
  });

  const clear = (originalEvent: Event) => {
    const input = inputRef.current;
    if (input !== null) {
      if (value === undefined) {
        input.value = '';
      }
      input.focus();
    }
    setUncontrolled('');
    onValueChange?.('', { originalEvent });
    onClear?.({ originalEvent });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event);
    const input = event.currentTarget;
    if (
      event.key !== 'Escape' ||
      event.defaultPrevented ||
      event.nativeEvent.isComposing ||
      input.value === '' ||
      input.readOnly
    ) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    clear(event.nativeEvent);
  };

  return (
    <Field
      block="search-field"
      controlId={inputId}
      hintId={hintId}
      className={className}
      style={style}
      dir={dir}
      rootAttributes={attributes.root}
      variant={variant}
      size={size}
      labelPlacement={labelPlacement}
      state={state}
      label={label}
      hint={hint}
    >
      <div className={fieldPart('search-field', 'input-row')}>
        <span
          className={fieldPart('search-field', 'leading-icon')}
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: iconSearch }}
        />
        <input
          type="search"
          id={inputId}
          className={fieldPart('search-field', 'input')}
          placeholder={fieldPlaceholder(placeholder)}
          disabled={disabled}
          readOnly={readOnly}
          aria-invalid={state === 'error' || undefined}
          {...(value === undefined ? { defaultValue } : { value })}
          {...attributes.control}
          ref={(input) => {
            inputRef.current = input;
            const release = setRef(ref, input);
            return () => {
              inputRef.current = null;
              release();
            };
          }}
          aria-describedby={fieldDescription(describedBy, hint, hintId)}
          onChange={(event) => {
            const next = event.currentTarget.value;
            setUncontrolled(next);
            onChange?.(event);
            onValueChange?.(next, { originalEvent: event.nativeEvent });
          }}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          className={`${fieldPart('search-field', 'clear')} ui-field__action`}
          hidden={!clearable}
          disabled={disabled}
          aria-controls={inputId}
          aria-label={clearLabel ?? labels.searchField.clear}
          onClick={(event) => {
            clear(event.nativeEvent);
          }}
        >
          <span
            className={`${fieldPart('search-field', 'clear-icon')} ui-field__action-icon`}
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: iconClose }}
          />
        </button>
      </div>
    </Field>
  );
}
