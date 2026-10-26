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

import { classNames } from '../internal/class-names.ts';
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
  state = 'default',
  label,
  hint,
  placeholder,
  leadingIcon,
  trailingIcon,
  onValueChange,
  onChange,
  id,
  className,
  style,
  'aria-describedby': describedBy,
  ...rest
}: TextFieldProps) {
  const rootAttributes: Record<string, unknown> = {};
  const inputAttributes: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(rest)) {
    (name.startsWith('data-') ? rootAttributes : inputAttributes)[name] = value;
  }
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${generatedId}-hint`;
  const placement = oneOf(
    labelPlacement,
    options.labelPlacement.options,
    options.labelPlacement.default,
  );
  const labelNode = label ? (
    <label className="ui-text-field__label" htmlFor={inputId}>
      <span className="ui-text-field__label-text">{label}</span>
    </label>
  ) : null;
  return (
    <div
      {...rootAttributes}
      style={style}
      className={classNames(
        'ui-text-field',
        'ui-text-field__base',
        className,
        `ui-text-field--${oneOf(variant, options.variant.options, options.variant.default)}`,
        `ui-text-field--${oneOf(size, options.size.options, options.size.default)}`,
        `ui-text-field--${placement}`,
        `ui-text-field--${oneOf(state, options.state.options, options.state.default)}`,
      )}
    >
      {placement === 'top' && labelNode}
      <div className="ui-text-field__control">
        {placement !== 'top' && labelNode}
        <div className="ui-text-field__input-row">
          {rendersContent(leadingIcon) && (
            <span className="ui-text-field__leading-icon" aria-hidden="true">
              {leadingIcon}
            </span>
          )}
          <input
            type={oneOf(type, options.type.options, options.type.default)}
            id={inputId}
            className="ui-text-field__input"
            placeholder={placeholder === undefined || placeholder === '' ? ' ' : placeholder}
            aria-invalid={state === 'error' || undefined}
            {...inputAttributes}
            aria-describedby={
              [describedBy, hint ? hintId : undefined].filter(Boolean).join(' ') || undefined
            }
            onChange={(event) => {
              const value = event.currentTarget.value;
              onChange?.(event);
              onValueChange?.(value, { originalEvent: event.nativeEvent });
            }}
          />
          {rendersContent(trailingIcon) && (
            <span className="ui-text-field__trailing-icon" aria-hidden="true">
              {trailingIcon}
            </span>
          )}
        </div>
      </div>
      {hint && (
        <span id={hintId} className="ui-text-field__hint">
          <span className="ui-text-field__hint-text">{hint}</span>
        </span>
      )}
    </div>
  );
}
