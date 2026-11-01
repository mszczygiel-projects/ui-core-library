'use client';

import {
  formatDateText,
  parseDateText,
  validateDate,
} from '@mszczygiel-projects/ui-core-shared/date';
import type {
  DateFieldProps as SharedProps,
  DateFieldValueChangeDetails as SharedDetails,
} from '@mszczygiel-projects/ui-core-shared/date-field';
import { type ComponentPropsWithRef, useId, useRef } from 'react';

import {
  Field,
  fieldDescription,
  fieldPart,
  fieldPlaceholder,
  splitFieldAttributes,
} from '../internal/field.tsx';
import { setRef } from '../internal/set-ref.ts';
import { useDateMask } from '../internal/use-date-mask.ts';
import { useParsedField } from '../internal/use-parsed-field.ts';
import { useUiCoreConfig } from '../internal/use-ui-core-config.ts';

/** The editable text, parse state and validation result of one user edit. */
export type DateFieldValueChangeDetails = SharedDetails<Event>;

/** Appearance attributes reach the root; native attributes and ref reach the visible text input. */
export interface DateFieldProps
  extends
    SharedProps,
    Omit<
      ComponentPropsWithRef<'input'>,
      | keyof SharedProps
      | 'size'
      | 'type'
      | 'value'
      | 'defaultValue'
      | 'children'
      | 'pattern'
      | 'minLength'
      | 'maxLength'
    > {
  /** The initial uncontrolled value, restored by form reset. @default '' */
  defaultValue?: string;
  /** Called once for each user edit, including incomplete and invalid text. */
  onValueChange?: (value: string, details: DateFieldValueChangeDetails) => void;
}

/** A masked date input with a locale-aware display and an ISO calendar-date value. */
export function DateField({
  variant,
  size,
  labelPlacement,
  state,
  label,
  hint,
  placeholder,
  locale,
  value,
  defaultValue = '',
  min,
  max,
  disabledDates,
  getFormatHintLabel,
  getValidationMessageLabel,
  name,
  form,
  disabled,
  readOnly,
  required,
  onValueChange,
  onChange,
  onInput,
  onFocus,
  onBlur,
  onInvalid,
  id,
  className,
  style,
  dir,
  ref,
  'aria-describedby': describedBy,
  ...rest
}: DateFieldProps) {
  const { labels } = useUiCoreConfig();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const entryRef = useRef<HTMLInputElement | null>(null);
  const constraints = { min, max, disabledDates };
  const field = useParsedField({
    value,
    defaultValue,
    locale,
    form,
    inputRef,
    entryRef,
    required,
    parse: parseDateText,
    format: formatDateText,
    serialize: (iso: string) => iso,
    validate: (parsed) => validateDate(parsed, constraints),
    message: (reason, effectiveLocale) =>
      (getValidationMessageLabel ?? labels.dateField.validationMessage)({
        ...constraints,
        reason,
        locale: effectiveLocale,
      }),
  });
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${generatedId}-hint`;
  const attributes = splitFieldAttributes(rest);
  const visibleHint =
    hint ??
    (getFormatHintLabel ?? labels.dateField.formatHint)(formatDateText('2026-12-31', field.locale));
  const visualState = state === 'error' || field.invalid ? 'error' : state;
  const notify = (text: string, originalEvent: Event) => {
    const { value: next, ...details } = field.edit(text);
    onValueChange?.(next, { ...details, originalEvent });
  };

  useDateMask(
    inputRef,
    field.locale,
    field.text,
    (event) => {
      const input = inputRef.current;
      if (input !== null && input.value !== field.text) {
        notify(input.value, event);
      }
    },
    readOnly !== true && disabled !== true,
  );

  return (
    <Field
      block="date-field"
      controlId={inputId}
      hintId={hintId}
      className={className}
      style={style}
      dir={dir}
      rootAttributes={attributes.root}
      variant={variant}
      size={size}
      labelPlacement={labelPlacement}
      state={visualState}
      label={label}
      hint={visibleHint}
    >
      <div className={fieldPart('date-field', 'input-row')}>
        <input
          {...attributes.control}
          type="text"
          id={inputId}
          className={fieldPart('date-field', 'input')}
          value={field.text}
          placeholder={fieldPlaceholder(placeholder)}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          form={form}
          inputMode={rest.inputMode ?? 'numeric'}
          aria-invalid={visualState === 'error' ? true : rest['aria-invalid']}
          aria-describedby={fieldDescription(describedBy, visibleHint, hintId)}
          ref={(input) => {
            inputRef.current = input;
            const release = setRef(ref, input);
            return () => {
              inputRef.current = null;
              release();
            };
          }}
          onInput={(event) => {
            if (!(event.nativeEvent instanceof InputEvent && event.nativeEvent.isComposing)) {
              notify(event.currentTarget.value, event.nativeEvent);
            }
            onInput?.(event);
          }}
          onChange={onChange}
          onFocus={(event) => {
            field.focus();
            onFocus?.(event);
          }}
          onBlur={(event) => {
            field.blur();
            onBlur?.(event);
          }}
          onInvalid={(event) => {
            field.report();
            onInvalid?.(event);
          }}
        />

        <input
          type="hidden"
          name={name}
          form={form}
          disabled={disabled}
          value={field.canonical}
          ref={entryRef}
        />
      </div>
    </Field>
  );
}
