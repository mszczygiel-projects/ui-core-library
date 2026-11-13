'use client';

import { isIsoTime } from '@mszczygiel-projects/ui-core-shared/time';
import type {
  TimeFieldProps as SharedProps,
  TimeFieldValueChangeDetails as SharedDetails,
} from '@mszczygiel-projects/ui-core-shared/time-field';
import { type ComponentPropsWithRef, useId, useLayoutEffect, useRef } from 'react';

import { Field, fieldDescription, fieldPart, splitFieldAttributes } from '../internal/field.tsx';
import { setRef } from '../internal/set-ref.ts';
import { useFormState } from '../internal/use-form-state.ts';
import { useUiCoreConfig } from '../internal/use-ui-core-config.ts';

/** The native event that caused a time edit. */
export type TimeFieldValueChangeDetails = SharedDetails<Event>;

/** Appearance reaches the root; native attributes and ref reach the time input. */
export interface TimeFieldProps
  extends
    SharedProps,
    Omit<
      ComponentPropsWithRef<'input'>,
      keyof SharedProps | 'size' | 'type' | 'defaultValue' | 'children' | 'step'
    > {
  /** The initial uncontrolled value, restored by form reset. @default '' */
  defaultValue?: string;
  /** Called for each user edit. */
  onValueChange?: (value: string, details: TimeFieldValueChangeDetails) => void;
}

/** A time input with a native time picker and a 24-hour value with minute precision. */
export function TimeField({
  variant,
  size,
  labelPlacement,
  hideLabel,
  state,
  label,
  hint,
  labelHint,
  min,
  max,
  value,
  defaultValue,
  ref,
  onValueChange,
  onChange,
  id,
  className,
  style,
  dir,
  'aria-describedby': describedBy,
  ...rest
}: TimeFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${generatedId}-hint`;
  const attributes = splitFieldAttributes(rest);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const ownMessageRef = useRef('');
  const { labels } = useUiCoreConfig();
  const invalidLimits =
    min !== undefined && max !== undefined && isIsoTime(min) && isIsoTime(max) && min > max;
  const syncLimits = (input: HTMLInputElement) => {
    if (input.validity.customError && input.validationMessage !== ownMessageRef.current) {
      return;
    }
    const message = invalidLimits && input.value !== '' ? labels.timeField.inconsistentLimits : '';
    input.setCustomValidity(message);
    ownMessageRef.current = message;
  };
  useFormState(inputRef, () => {
    if (inputRef.current !== null) {
      syncLimits(inputRef.current);
    }
  });
  useLayoutEffect(() => {
    if (inputRef.current !== null) {
      syncLimits(inputRef.current);
    }
  });
  return (
    <Field
      block="time-field"
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
      <div className={fieldPart('time-field', 'input-row')}>
        <input
          {...attributes.control}
          id={inputId}
          type="time"
          step={60}
          value={value === undefined ? undefined : isIsoTime(value) ? value : ''}
          defaultValue={
            defaultValue === undefined ? undefined : isIsoTime(defaultValue) ? defaultValue : ''
          }
          min={min}
          max={max}
          ref={(input) => {
            inputRef.current = input;
            const release = setRef(ref, input);
            return () => {
              inputRef.current = null;
              release();
            };
          }}
          className={fieldPart('time-field', 'input')}
          aria-invalid={state === 'error' || undefined}
          aria-describedby={fieldDescription(describedBy, hint, hintId, labelHint)}
          onChange={(event) => {
            syncLimits(event.currentTarget);
            onChange?.(event);
            onValueChange?.(event.currentTarget.value, { originalEvent: event.nativeEvent });
          }}
        />
      </div>
    </Field>
  );
}
