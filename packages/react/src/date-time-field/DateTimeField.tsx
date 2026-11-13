'use client';

import { iconCalendar } from '@mszczygiel-projects/ui-core-icons';
import { formatDateText } from '@mszczygiel-projects/ui-core-shared/date';
import {
  dateTimeDraftParts,
  dateTimeMaskOptions,
  formatDateTimeText,
  parseDateTimeText,
  validateDateTime,
} from '@mszczygiel-projects/ui-core-shared/date-time';
import type {
  DateTimeFieldProps as SharedProps,
  DateTimeFieldValueChangeDetails as SharedDetails,
} from '@mszczygiel-projects/ui-core-shared/date-time-field';
import {
  isIsoLocalDateTime,
  joinLocalDateTime,
  splitLocalDateTime,
} from '@mszczygiel-projects/ui-core-shared/time';
import {
  type ComponentPropsWithRef,
  type KeyboardEvent,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import { Button } from '../button/Button.tsx';
import { Calendar } from '../calendar/Calendar.tsx';
import type { DateFieldOpenChangeDetails } from '../date-field/DateField.tsx';
import {
  Field,
  fieldDescription,
  fieldPart,
  fieldPlaceholder,
  splitFieldAttributes,
} from '../internal/field.tsx';
import { setRef } from '../internal/set-ref.ts';
import { useDateMask } from '../internal/use-date-mask.ts';
import { useFormState } from '../internal/use-form-state.ts';
import { useParsedField } from '../internal/use-parsed-field.ts';
import { usePopup } from '../internal/use-popup.ts';
import { useUiCoreConfig } from '../internal/use-ui-core-config.ts';
import { TimeField } from '../time-field/TimeField.tsx';

/** The editable text, parse state and constraint result of one edit. */
export type DateTimeFieldValueChangeDetails = SharedDetails<Event>;

/** Appearance reaches the root; native attributes and ref reach the editable input. */
export interface DateTimeFieldProps
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
  /** Initial uncontrolled local date-time. @default '' */
  defaultValue?: string;
  /** Called once for each user edit, including incomplete text. */
  onValueChange?: (value: string, details: DateTimeFieldValueChangeDetails) => void;
  /** Whether the uncontrolled picker starts open. @default false */
  defaultOpen?: boolean;
  /** Called when the picker opens or closes. */
  onOpenChange?: (open: boolean, details: DateFieldOpenChangeDetails) => void;
}

/** A masked date and time input with a combined picker and a local value with minute precision. */
export function DateTimeField({
  variant,
  size,
  labelPlacement,
  hideLabel = false,
  state,
  label,
  hint,
  labelHint,
  placeholder,
  locale,
  value,
  defaultValue = '',
  min,
  max,
  disabledDates,
  open,
  defaultOpen = false,
  hideCalendarButton = false,
  firstDayOfWeek,
  today,
  openCalendarLabel,
  timeLabel,
  getFormatHintLabel,
  getValidationMessageLabel,
  name,
  form,
  disabled,
  readOnly,
  required,
  onValueChange,
  onOpenChange,
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
}: DateTimeFieldProps) {
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
    parse: parseDateTimeText,
    format: formatDateTimeText,
    serialize: (iso: string) => iso,
    validate: (parsed) => validateDateTime(parsed, constraints),
    message: (reason, effectiveLocale) =>
      (getValidationMessageLabel ?? labels.dateTimeField.validationMessage)({
        reason,
        locale: effectiveLocale,
        min,
        max,
      }),
  });
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${generatedId}-hint`;
  const panelId = `${generatedId}-panel`;
  const attributes = splitFieldAttributes(rest);
  const visibleHint =
    hint ??
    (getFormatHintLabel ?? labels.dateField.formatHint)(
      formatDateTimeText('2026-12-31T09:30', field.locale),
    );
  const visualState = state === 'error' || field.invalid ? 'error' : state;
  const notify = (text: string, originalEvent: Event) => {
    const { value: next, ...details } = field.edit(text);
    onValueChange?.(next, { ...details, originalEvent });
  };
  const rootRef = useRef<HTMLDivElement | null>(null);
  const controlRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDialogElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const [picker, setPicker] = useState(() => splitLocalDateTime(value ?? defaultValue));
  const formDisabled = useFormState(inputRef, () => {
    setUncontrolledOpen(false);
  });
  const canOpen = disabled !== true && readOnly !== true && !formDisabled;
  const isOpen = (open ?? uncontrolledOpen) && canOpen;
  const pickerLabel = openCalendarLabel ?? labels.dateTimeField.openPicker;
  const returnFocusRef = useRef(false);
  const [seenOpen, setSeenOpen] = useState(false);
  const [seenValue, setSeenValue] = useState(value);
  if (seenOpen !== isOpen) {
    setSeenOpen(isOpen);
    if (isOpen) {
      setPicker(dateTimeDraftParts(field.text, field.locale));
    }
  } else if (seenValue !== value) {
    setSeenValue(value);
    if (isOpen && value !== undefined) {
      setPicker(splitLocalDateTime(value));
    }
  } else if (
    isOpen &&
    value !== undefined &&
    joinLocalDateTime(picker) !== '' &&
    (field.parsed.inputState === 'valid' || field.parsed.inputState === 'empty') &&
    joinLocalDateTime(picker) !== field.parsed.value
  ) {
    setPicker(splitLocalDateTime(field.parsed.value));
  }
  const setOpen = (next: boolean, event: Event) => {
    if ((next && !canOpen) || next === isOpen) {
      return;
    }
    if (next) {
      setPicker(dateTimeDraftParts(field.text, field.locale));
    }
    setUncontrolledOpen(next);
    onOpenChange?.(next, { originalEvent: event });
  };
  const close = (event: Event) => {
    returnFocusRef.current = true;
    setOpen(false, event);
  };
  usePopup({
    open: isOpen,
    root: rootRef,
    anchor: controlRef,
    popup: panelRef,
    onDismiss: (event) => {
      setOpen(false, event);
    },
    modal: true,
  });
  useLayoutEffect(() => {
    if (!isOpen) {
      if (returnFocusRef.current) {
        returnFocusRef.current = false;
        buttonRef.current?.focus();
      }
      return;
    }
    let remaining = 10;
    let frame = 0;
    const focusCell = () => {
      const cell = panelRef.current?.querySelector<HTMLElement>('[role="gridcell"][tabindex="0"]');
      if (cell !== null && cell !== undefined) {
        cell.focus();
      } else if (remaining > 0) {
        remaining -= 1;
        frame = requestAnimationFrame(focusCell);
      }
    };
    focusCell();
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [isOpen]);
  const onPickerKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close(event.nativeEvent);
      return;
    }
    if (event.key !== 'Tab') {
      return;
    }
    const stops = [
      ...event.currentTarget.querySelectorAll<HTMLElement>(
        'button:enabled, input:enabled, [role="gridcell"][tabindex="0"]',
      ),
    ];
    const first = stops.at(0);
    const last = stops.at(-1);
    if (
      first !== undefined &&
      last !== undefined &&
      event.target === (event.shiftKey ? first : last)
    ) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    }
  };
  const pick = (next: typeof picker, event: Event) => {
    setPicker(next);
    if (next.date === '') {
      return;
    }
    const complete = joinLocalDateTime(next);
    notify(
      complete === ''
        ? formatDateText(next.date, field.locale)
        : formatDateTimeText(complete, field.locale),
      event,
    );
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
    dateTimeMaskOptions,
  );
  const dateMin = min !== undefined && isIsoLocalDateTime(min) ? min.slice(0, 10) : undefined;
  const dateMax = max !== undefined && isIsoLocalDateTime(max) ? max.slice(0, 10) : undefined;
  return (
    <Field
      block="date-time-field"
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
      state={visualState}
      label={label}
      hint={visibleHint}
      labelHint={labelHint}
      rootRef={rootRef}
      controlRef={controlRef}
      popup={
        isOpen ? (
          <dialog
            ref={panelRef}
            id={panelId}
            className={fieldPart('date-time-field', 'panel')}
            aria-label={pickerLabel}
            dir={dir}
            onKeyDown={onPickerKeyDown}
            onCancel={(event) => {
              event.preventDefault();
              close(event.nativeEvent);
            }}
            onClose={(event) => {
              setOpen(false, event.nativeEvent);
            }}
          >
            <Calendar
              className={fieldPart('date-time-field', 'calendar')}
              value={picker.date}
              min={dateMin}
              max={dateMax}
              disabledDates={disabledDates}
              locale={field.locale}
              firstDayOfWeek={firstDayOfWeek}
              today={today}
              onValueChange={(date, details) => {
                if (inputRef.current?.matches(':disabled') !== true) {
                  pick({ ...picker, date }, details.originalEvent);
                }
              }}
            />
            <TimeField
              className={fieldPart('date-time-field', 'time')}
              label={timeLabel ?? labels.dateTimeField.timeLabel}
              value={picker.time}
              onValueChange={(time, details) => {
                pick({ ...picker, time }, details.originalEvent);
              }}
            />
            <Button
              className={fieldPart('date-time-field', 'done-button')}
              type="button"
              variant="secondary"
              onClick={(event) => {
                close(event.nativeEvent);
              }}
            >
              {labels.dateTimeField.done}
            </Button>
          </dialog>
        ) : null
      }
    >
      <div className={fieldPart('date-time-field', 'input-row')}>
        <input
          {...attributes.control}
          type="text"
          id={inputId}
          className={fieldPart('date-time-field', 'input')}
          value={field.text}
          placeholder={fieldPlaceholder(placeholder)}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          form={form}
          inputMode={rest.inputMode ?? 'numeric'}
          aria-invalid={visualState === 'error' ? true : rest['aria-invalid']}
          aria-describedby={fieldDescription(describedBy, visibleHint, hintId, labelHint)}
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
        <button
          ref={buttonRef}
          type="button"
          className={`${fieldPart('date-time-field', 'picker-button')} ui-field__action`}
          hidden={hideCalendarButton}
          disabled={!canOpen}
          aria-label={pickerLabel}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-controls={isOpen ? panelId : undefined}
          onClick={(event) => {
            setOpen(!isOpen, event.nativeEvent);
          }}
        >
          <span
            className="ui-field__action-icon"
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: iconCalendar }}
          />
        </button>
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
