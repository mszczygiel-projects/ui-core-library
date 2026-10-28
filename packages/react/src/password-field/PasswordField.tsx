'use client';

import { iconEye, iconEyeSlash } from '@mszczygiel-projects/ui-core-icons';
import type {
  PasswordFieldProps as SharedPasswordFieldProps,
  PasswordFieldRevealedChangeDetails as SharedRevealedChangeDetails,
} from '@mszczygiel-projects/ui-core-shared/password-field';
import { type ComponentPropsWithRef, useEffect, useId, useRef, useState } from 'react';

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

/** The native event that showed or hid the password, before React wraps it. */
export type PasswordFieldRevealedChangeDetails = SharedRevealedChangeDetails<Event>;

/** PasswordField props. Appearance attributes reach the root; native attributes and ref reach the input. */
export interface PasswordFieldProps
  extends
    SharedPasswordFieldProps,
    Omit<
      ComponentPropsWithRef<'input'>,
      keyof SharedPasswordFieldProps | 'size' | 'type' | 'value' | 'defaultValue' | 'children'
    > {
  /** The controlled value. Pair it with onValueChange to accept edits. */
  value?: string;
  /** The initial uncontrolled value, restored by native form reset. @default '' */
  defaultValue?: string;
  /** The controlled visibility. Pair it with onRevealedChange to accept toggles. */
  revealed?: boolean;
  /** The initial uncontrolled visibility, restored by native form reset. @default false */
  defaultRevealed?: boolean;
  /** A hint for the virtual keyboard. */
  inputMode?: ComponentPropsWithRef<'input'>['inputMode'];
  /** A hint for the virtual keyboard's Enter key. */
  enterKeyHint?: ComponentPropsWithRef<'input'>['enterKeyHint'];
  /** Turns the browser's spelling suggestions on or off. */
  spellCheck?: boolean;
  /** React's native change handler, called on each user edit. */
  onChange?: ComponentPropsWithRef<'input'>['onChange'];
  /** Called once per user edit, with the new string and original input event. */
  onValueChange?: (value: string, details: TextFieldValueChangeDetails) => void;
  /** Called when the reveal button or a submission of the form shows or hides the password. */
  onRevealedChange?: (revealed: boolean, details: PasswordFieldRevealedChangeDetails) => void;
}

/**
 * A password input with a button that shows or hides the password.
 *
 * The reveal button is a toggle button with one name, whose pressed state says whether the
 * password shows, controlled with `revealed` or uncontrolled with `defaultRevealed`. Submitting
 * the owning form hides the password again, so that a password manager reads it as a password,
 * and a reset restores `defaultRevealed`.
 */
export function PasswordField({
  variant = 'outline',
  size = 'medium',
  labelPlacement = 'top',
  state = 'default',
  label,
  hint,
  placeholder,
  revealed,
  defaultRevealed = false,
  revealLabel,
  disabled,
  onValueChange,
  onRevealedChange,
  onChange,
  id,
  className,
  style,
  dir,
  ref,
  'aria-describedby': describedBy,
  ...rest
}: PasswordFieldProps) {
  const { labels } = useUiCoreConfig();
  const [uncontrolled, setUncontrolled] = useState(defaultRevealed);
  const isRevealed = revealed ?? uncontrolled;
  const attributes = splitFieldAttributes(rest);
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${generatedId}-hint`;
  const inputRef = useRef<HTMLInputElement | null>(null);
  // The listeners of the form read the latest state and callbacks without subscribing again.
  const latest = useRef({ isRevealed, defaultRevealed, onRevealedChange });
  useEffect(() => {
    latest.current = { isRevealed, defaultRevealed, onRevealedChange };
  });

  const change = (next: boolean, originalEvent: Event) => {
    setUncontrolled(next);
    latest.current.onRevealedChange?.(next, { originalEvent });
  };

  useEffect(() => {
    const form = inputRef.current?.form;
    if (form === null || form === undefined) {
      return;
    }
    const events = new AbortController();
    form.addEventListener(
      'submit',
      (event) => {
        if (latest.current.isRevealed) {
          change(false, event);
        }
      },
      { signal: events.signal },
    );
    form.addEventListener(
      'reset',
      (event) => {
        // A listener after this one may cancel the reset, so the visibility waits for the outcome.
        queueMicrotask(() => {
          if (!event.defaultPrevented) {
            setUncontrolled(latest.current.defaultRevealed);
          }
        });
      },
      { signal: events.signal },
    );
    return () => {
      events.abort();
    };
  });

  return (
    <Field
      block="password-field"
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
      <div className={fieldPart('password-field', 'input-row')}>
        <input
          type={isRevealed ? 'text' : 'password'}
          id={inputId}
          className={fieldPart('password-field', 'input')}
          placeholder={fieldPlaceholder(placeholder)}
          disabled={disabled}
          aria-invalid={state === 'error' || undefined}
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
            const value = event.currentTarget.value;
            onChange?.(event);
            onValueChange?.(value, { originalEvent: event.nativeEvent });
          }}
        />
        <button
          type="button"
          className={`${fieldPart('password-field', 'reveal')} ui-field__action`}
          disabled={disabled}
          aria-pressed={isRevealed}
          aria-controls={inputId}
          aria-label={revealLabel ?? labels.passwordField.reveal}
          onClick={(event) => {
            change(!isRevealed, event.nativeEvent);
          }}
        >
          <span
            className={`${fieldPart('password-field', 'reveal-icon')} ui-field__action-icon`}
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: isRevealed ? iconEye : iconEyeSlash }}
          />
        </button>
      </div>
    </Field>
  );
}
