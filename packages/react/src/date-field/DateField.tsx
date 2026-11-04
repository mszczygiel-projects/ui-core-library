'use client';

import { iconCalendar } from '@mszczygiel-projects/ui-core-icons';
import {
  formatDateText,
  parseDateText,
  validateDate,
} from '@mszczygiel-projects/ui-core-shared/date';
import type {
  DateFieldOpenChangeDetails as SharedOpenChangeDetails,
  DateFieldProps as SharedProps,
  DateFieldValueChangeDetails as SharedDetails,
} from '@mszczygiel-projects/ui-core-shared/date-field';
import {
  type ComponentPropsWithRef,
  type KeyboardEvent,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import { Calendar } from '../calendar/Calendar.tsx';
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

/** The editable text, parse state and validation result of one user edit. */
export type DateFieldValueChangeDetails = SharedDetails<Event>;

/** The native event that opened or closed the calendar, before React wraps it. */
export type DateFieldOpenChangeDetails = SharedOpenChangeDetails<Event>;

/** The elements of a calendar that take the focus, in the order of Tab. */
const CALENDAR_STOPS = 'button:enabled, [role="gridcell"][tabindex="0"]';

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
  /** The controlled open state of the calendar. Pair it with onOpenChange. */
  open?: boolean;
  /** Whether the uncontrolled calendar starts open. @default false */
  defaultOpen?: boolean;
  /** Called when the user opens or closes the calendar. */
  onOpenChange?: (open: boolean, details: DateFieldOpenChangeDetails) => void;
}

/**
 * A masked date input with a locale-aware display and an ISO calendar-date value.
 *
 * The button after the input opens a calendar in a modal dialog in the top layer, which makes the
 * rest of the page inert until it closes, with the focus on the chosen date, else on today. Tab
 * stays inside the dialog. Picking a date writes its text, as one edit, closes the dialog and
 * returns the focus to the button; Escape closes it without a change, and a click outside closes
 * it without reaching the page.
 */
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
  open,
  defaultOpen = false,
  hideCalendarButton = false,
  firstDayOfWeek,
  today,
  openCalendarLabel,
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

  const rootRef = useRef<HTMLDivElement | null>(null);
  const controlRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDialogElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const formDisabled = useFormState(inputRef, () => {
    setUncontrolledOpen(false);
  });
  // A read-only field keeps its date, so its calendar stays closed as well, and so does a field
  // that a disabled fieldset disables.
  const canOpen = disabled !== true && readOnly !== true && !formDisabled;
  const isOpen = (open ?? uncontrolledOpen) && canOpen;
  const calendarLabel = openCalendarLabel ?? labels.dateField.openCalendar;
  const panelId = `${generatedId}-panel`;

  const setOpen = (next: boolean, originalEvent: Event) => {
    if ((next && !canOpen) || next === isOpen) {
      return;
    }
    setUncontrolledOpen(next);
    onOpenChange?.(next, { originalEvent });
  };

  // A pick or Escape returns the focus to the button, once the modal dialog has closed and the
  // button is no longer inert.
  const returnFocusRef = useRef(false);
  const close = (originalEvent: Event) => {
    returnFocusRef.current = true;
    setOpen(false, originalEvent);
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

  // The calendar takes the focus when it opens, the first render included, after the popup is in
  // the top layer. A calendar that hydrates without today draws its days a little later.
  useLayoutEffect(() => {
    if (!isOpen) {
      if (returnFocusRef.current) {
        returnFocusRef.current = false;
        buttonRef.current?.focus();
      }
      return;
    }
    let frames = 10;
    let frame = 0;
    const focusCell = () => {
      const cell = panelRef.current?.querySelector<HTMLElement>('[role="gridcell"][tabindex="0"]');
      if (cell !== null && cell !== undefined) {
        cell.focus();
      } else if (frames > 0) {
        frames -= 1;
        frame = requestAnimationFrame(focusCell);
      }
    };
    focusCell();
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [isOpen]);

  /**
   * Escape that the calendar leaves, in its days, closes the dialog. Tab and Shift+Tab go round
   * the stops of the calendar, which a modal dialog never lets the focus leave. The calendar stops
   * the Escape that it uses, so the handler sits on it rather than on the dialog.
   */
  const onCalendarKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close(event.nativeEvent);
      return;
    }
    if (event.key !== 'Tab') {
      return;
    }
    const stops = [...event.currentTarget.querySelectorAll<HTMLElement>(CALENDAR_STOPS)];
    const first = stops.at(0);
    const last = stops.at(-1);
    if (first === undefined || last === undefined) {
      return;
    }
    if (event.target === (event.shiftKey ? first : last)) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    }
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
      rootRef={rootRef}
      controlRef={controlRef}
      popup={
        isOpen ? (
          <dialog
            ref={panelRef}
            id={panelId}
            className={fieldPart('date-field', 'panel')}
            aria-label={calendarLabel}
            dir={dir}
            onCancel={(event) => {
              // Escape that reaches the dialog itself, not a cell, closes it as Escape on a cell.
              event.preventDefault();
              close(event.nativeEvent);
            }}
            onClose={(event) => {
              // The browser may close a modal dialog on its own, such as on a repeated Escape.
              setOpen(false, event.nativeEvent);
            }}
          >
            <Calendar
              className={fieldPart('date-field', 'calendar')}
              value={field.parsed.value}
              min={min}
              max={max}
              disabledDates={disabledDates}
              locale={field.locale}
              firstDayOfWeek={firstDayOfWeek}
              today={today}
              onKeyDown={onCalendarKeyDown}
              onValueChange={(picked, details) => {
                // A fieldset can disable the field while its calendar is open; the pick then
                // changes nothing.
                if (inputRef.current?.matches(':disabled') === true) {
                  return;
                }
                notify(formatDateText(picked, field.locale), details.originalEvent);
                close(details.originalEvent);
              }}
            />
          </dialog>
        ) : null
      }
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

        <button
          ref={buttonRef}
          type="button"
          className={`${fieldPart('date-field', 'calendar-button')} ui-field__action`}
          hidden={hideCalendarButton}
          disabled={!canOpen}
          aria-label={calendarLabel}
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
