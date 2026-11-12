'use client';

import { oneOf } from '@mszczygiel-projects/ui-core-shared/one-of';
import {
  textField,
  type TextFieldLabelPlacement,
  type TextFieldProps as SharedTextFieldProps,
  type TextFieldSize,
  type TextFieldState,
  type TextFieldType,
  type TextFieldValueChangeDetails as SharedValueChangeDetails,
  type TextFieldVariant,
} from '@mszczygiel-projects/ui-core-shared/text-field';
import { type ComponentPropsWithRef, type ReactNode, useId } from 'react';

import {
  Field,
  fieldDescription,
  fieldPart,
  fieldPlaceholder,
  splitFieldAttributes,
} from '../internal/field.tsx';
import { rendersContent } from '../internal/renders-content.ts';

export type {
  TextFieldLabelPlacement,
  TextFieldSize,
  TextFieldState,
  TextFieldType,
  TextFieldVariant,
};

/** The native event that caused a value change, before React wraps it. */
export type TextFieldValueChangeDetails = SharedValueChangeDetails<Event>;

const { options } = textField;

/** TextField props. Appearance attributes reach the root; native attributes and ref reach the input. */
export interface TextFieldProps
  extends
    SharedTextFieldProps,
    Omit<
      ComponentPropsWithRef<'input'>,
      keyof SharedTextFieldProps | 'size' | 'type' | 'value' | 'defaultValue' | 'children'
    > {
  /** The controlled value. Pair it with onValueChange to accept edits. */
  value?: string;
  /** The initial uncontrolled value, restored by native form reset. @default '' */
  defaultValue?: string;
  /** A hint for the virtual keyboard. */
  inputMode?: ComponentPropsWithRef<'input'>['inputMode'];
  /** A hint for the virtual keyboard's Enter key. */
  enterKeyHint?: ComponentPropsWithRef<'input'>['enterKeyHint'];
  /** Turns the browser's spelling suggestions on or off. */
  spellCheck?: boolean;
  /** A decorative icon before the input, in reading order. */
  leadingIcon?: ReactNode;
  /** A decorative icon after the input, in reading order. */
  trailingIcon?: ReactNode;
  /** React's native change handler, called on each user edit. */
  onChange?: ComponentPropsWithRef<'input'>['onChange'];
  /** Called once per user edit, with the new string and original input event. */
  onValueChange?: (value: string, details: TextFieldValueChangeDetails) => void;
}

/**
 * A single-line text input with a label, hint and validation feedback.
 *
 * Native input and change handlers retain React's conventions. A visual error does not invent a
 * constraint: use the native attributes or ref.current.setCustomValidity for form validation.
 */
export function TextField({
  variant = 'outline',
  type = 'text',
  size = 'medium',
  labelPlacement = 'top',
  hideLabel = false,
  state = 'default',
  label,
  hint,
  labelHint,
  placeholder,
  leadingIcon,
  trailingIcon,
  onValueChange,
  onChange,
  id,
  className,
  style,
  dir,
  'aria-describedby': describedBy,
  ...rest
}: TextFieldProps) {
  const attributes = splitFieldAttributes(rest);
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${generatedId}-hint`;
  return (
    <Field
      block="text-field"
      controlId={inputId}
      hintId={hintId}
      className={className}
      style={style}
      dir={dir}
      rootAttributes={attributes.root}
      variant={variant}
      size={size}
      labelPlacement={labelPlacement}
      hideLabel={hideLabel}
      state={state}
      label={label}
      hint={hint}
      labelHint={labelHint}
    >
      <div className={fieldPart('text-field', 'input-row')}>
        {rendersContent(leadingIcon) && (
          <span className={fieldPart('text-field', 'leading-icon')} aria-hidden="true">
            {leadingIcon}
          </span>
        )}
        <input
          type={oneOf(type, options.type.options, options.type.default)}
          id={inputId}
          className={fieldPart('text-field', 'input')}
          placeholder={fieldPlaceholder(placeholder)}
          aria-invalid={state === 'error' || undefined}
          {...attributes.control}
          aria-describedby={fieldDescription(describedBy, hint, hintId, labelHint)}
          onChange={(event) => {
            const value = event.currentTarget.value;
            onChange?.(event);
            onValueChange?.(value, { originalEvent: event.nativeEvent });
          }}
        />
        {rendersContent(trailingIcon) && (
          <span className={fieldPart('text-field', 'trailing-icon')} aria-hidden="true">
            {trailingIcon}
          </span>
        )}
      </div>
    </Field>
  );
}
