'use client';

import { iconMinus, iconPlus } from '@mszczygiel-projects/ui-core-icons';
import type {
  NumberFieldProps as SharedProps,
  NumberFieldValueChangeDetails as SharedDetails,
} from '@mszczygiel-projects/ui-core-shared/number-field';
import {
  boundNumberValue,
  formatNumberText,
  nextNumberValue,
  parseNumberText,
  serializeNumber,
  validateNumber,
} from '@mszczygiel-projects/ui-core-shared/numeric';
import { type ComponentPropsWithRef, type KeyboardEvent, useId, useRef } from 'react';

import {
  Field,
  fieldDescription,
  fieldPart,
  fieldPlaceholder,
  splitFieldAttributes,
} from '../internal/field.tsx';
import { setRef } from '../internal/set-ref.ts';
import { useParsedField } from '../internal/use-parsed-field.ts';
import { useUiCoreConfig } from '../internal/use-ui-core-config.ts';

export type { NumberFieldControls } from '@mszczygiel-projects/ui-core-shared/number-field';

/** The editable text, parse state and validation result of one user edit. */
export type NumberFieldValueChangeDetails = SharedDetails<Event>;

/** Appearance attributes reach the root; native attributes and ref reach the visible text input. */
export interface NumberFieldProps
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
  /** The initial uncontrolled value, restored by form reset. @default null */
  defaultValue?: number | null;
  /** Called once for each user edit, including incomplete and invalid text. */
  onValueChange?: (value: number | null, details: NumberFieldValueChangeDetails) => void;
}

/** A locale-aware number input with validation and optional decrement and increment buttons. */
export function NumberField({
  variant,
  size,
  labelPlacement,
  state,
  label,
  hint,
  placeholder,
  locale,
  value,
  defaultValue = null,
  min,
  max,
  step = 1,
  precision,
  controls = 'none',
  decrementLabel,
  incrementLabel,
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
  onKeyDown,
  onCompositionEnd,
  id,
  className,
  style,
  dir,
  ref,
  'aria-describedby': describedBy,
  ...rest
}: NumberFieldProps) {
  const { labels } = useUiCoreConfig();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const entryRef = useRef<HTMLInputElement | null>(null);
  const constraints = { min, max, step, precision };
  const field = useParsedField({
    value,
    defaultValue,
    locale,
    form,
    inputRef,
    entryRef,
    required,
    parse: parseNumberText,
    format: formatNumberText,
    serialize: serializeNumber,
    validate: (parsed) => validateNumber(parsed, constraints),
    message: (reason, effectiveLocale) =>
      (getValidationMessageLabel ?? labels.numberField.validationMessage)({
        ...constraints,
        reason,
        locale: effectiveLocale,
      }),
  });

  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${generatedId}-hint`;
  const attributes = splitFieldAttributes(rest);
  const visibleHint = hint;
  const visualState = state === 'error' || field.invalid ? 'error' : state;
  // Composition edits the draft silently; its result is one edit, emitted once at compositionend.
  const compositionRef = useRef<{ pending: boolean; confirmed: string | null }>({
    pending: false,
    confirmed: null,
  });
  const notify = (text: string, originalEvent: Event) => {
    const { value: next, ...details } = field.edit(text);
    onValueChange?.(next, { ...details, originalEvent });
  };
  const changeNumber = (next: number | null, originalEvent: Event) => {
    const input = inputRef.current;
    if (
      input === null ||
      input.readOnly ||
      input.matches(':disabled') ||
      next === field.parsed.value
    ) {
      return;
    }
    const text = formatNumberText(next, field.locale);
    input.value = text;
    input.focus();
    notify(text, originalEvent);
  };
  const decrement = nextNumberValue(field.parsed, -1, constraints);
  const increment = nextNumberValue(field.parsed, 1, constraints);
  const keyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event);
    if (
      event.defaultPrevented ||
      event.nativeEvent.isComposing ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.currentTarget.readOnly
    ) {
      return;
    }
    const next =
      event.key === 'ArrowUp'
        ? increment
        : event.key === 'ArrowDown'
          ? decrement
          : event.key === 'Home'
            ? boundNumberValue(field.parsed, -1, constraints)
            : event.key === 'End'
              ? boundNumberValue(field.parsed, 1, constraints)
              : undefined;
    if (next !== undefined) {
      event.preventDefault();
      changeNumber(next, event.nativeEvent);
    }
  };
  return (
    <Field
      block="number-field"
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
      <div className={fieldPart('number-field', 'input-row')}>
        {controls === 'inline' && (
          <NumberAction
            direction={-1}
            next={decrement}
            current={field.parsed.value}
            disabled={disabled === true || readOnly === true}
            inputId={inputId}
            label={decrementLabel ?? labels.numberField.decrement}
            onActivate={changeNumber}
          />
        )}
        <input
          {...attributes.control}
          type="text"
          id={inputId}
          className={fieldPart('number-field', 'input')}
          value={field.text}
          placeholder={fieldPlaceholder(placeholder)}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          form={form}
          role="spinbutton"
          inputMode={rest.inputMode ?? 'decimal'}
          aria-valuenow={field.parsed.value ?? undefined}
          aria-valuemin={Number.isFinite(min) ? min : undefined}
          aria-valuemax={Number.isFinite(max) ? max : undefined}
          aria-valuetext={field.text || undefined}
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
            const text = event.currentTarget.value;
            const { confirmed } = compositionRef.current;
            compositionRef.current.confirmed = null;
            if (event.nativeEvent instanceof InputEvent && event.nativeEvent.isComposing) {
              compositionRef.current.pending = true;
              field.edit(text);
            } else if (text !== confirmed) {
              notify(text, event.nativeEvent);
            }
            onInput?.(event);
          }}
          onCompositionEnd={(event) => {
            const text = event.currentTarget.value;
            if (compositionRef.current.pending) {
              // Some browsers repeat the result as a final input event, which must not emit again.
              compositionRef.current = { pending: false, confirmed: text };
              notify(text, event.nativeEvent);
            }
            onCompositionEnd?.(event);
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
          onKeyDown={keyDown}
        />
        {controls === 'inline' && (
          <NumberAction
            direction={1}
            next={increment}
            current={field.parsed.value}
            disabled={disabled === true || readOnly === true}
            inputId={inputId}
            label={incrementLabel ?? labels.numberField.increment}
            onActivate={changeNumber}
          />
        )}
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

interface NumberActionProps {
  readonly direction: -1 | 1;
  readonly next: number | null;
  readonly current: number | null;
  readonly disabled: boolean;
  readonly inputId: string;
  readonly label: string;
  readonly onActivate: (next: number | null, event: Event) => void;
}

function NumberAction({
  direction,
  next,
  current,
  disabled,
  inputId,
  label,
  onActivate,
}: NumberActionProps) {
  const part = direction < 0 ? 'decrement' : 'increment';
  return (
    <button
      type="button"
      className={`${fieldPart('number-field', part)} ui-field__action${direction < 0 ? ' ui-field__action--leading' : ''}`}
      disabled={disabled || next === current}
      aria-controls={inputId}
      aria-label={label}
      onClick={(event) => {
        onActivate(next, event.nativeEvent);
      }}
    >
      <span
        className={`${fieldPart('number-field', `${part}-icon`)} ui-field__action-icon`}
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: direction < 0 ? iconMinus : iconPlus }}
      />
    </button>
  );
}
