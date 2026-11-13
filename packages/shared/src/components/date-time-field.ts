import type { DateValidationError } from '../utils/date.ts';
import type { ParsedInputDetails } from '../utils/parsed-input.ts';
import type { TimeValidationError } from '../utils/time.ts';
import { defineComponent } from './component.ts';
import { dateField, type DateFieldProps } from './date-field.ts';

/** The specification of DateTimeField. */
export const dateTimeField = defineComponent({
  name: 'DateTimeField',
  tag: 'ui-date-time-field',
  category: 'Inputs',
  status: 'in-progress',
  figma: '3330:621',
  design: {
    nested: 'TextField',
    flags: ['open'],
    booleans: [],
    codeOnly: [
      'locale',
      'min',
      'max',
      'disabledDates',
      'firstDayOfWeek',
      'today',
      'timeLabel',
      'openCalendarLabel',
      'readOnly',
      'required',
      'name',
      'autoComplete',
      'getFormatHintLabel',
      'getValidationMessageLabel',
    ],
    previews: {},
  },
  summary:
    'A masked date and time input with a combined picker and a local value with minute precision.',
  options: dateField.options,
  labels: ['openPicker', 'timeLabel', 'done', 'validationMessage'],
  parts: [
    'base',
    'control',
    'input-row',
    'input',
    'picker-button',
    'panel',
    'calendar',
    'time',
    'done-button',
    'label',
    'label-row',
    'label-text',
    'label-hint',
    'hint',
    'hint-text',
  ],
  slots: [],
  events: ['ui-value-change', 'ui-open-change'],
  stories: ['Playground', 'Variants', 'WithLocale', 'WithConstraints', 'OnSurfaces'],
  exceptions: [
    {
      items: ['value', 'name', 'min', 'max'],
      reason:
        'The visible input holds localized editable text while the form submits one canonical local date-time without a time-zone conversion.',
    },
    {
      items: ['disabledDates'],
      reason:
        'The web component takes an array or predicate as a property only, without an attribute.',
    },
  ],
});

/** Why a local date-time cannot be submitted. */
export type DateTimeValidationError = DateValidationError | TimeValidationError;

/** Data for a whole translated validation message. */
export interface DateTimeValidationContext {
  /** The failed parse or constraint. */
  readonly reason: DateTimeValidationError;
  /** The locale used for editable text. */
  readonly locale: string;
  /** Earliest permitted canonical value, when supplied. */
  readonly min?: string;
  /** Latest permitted canonical value, when supplied. */
  readonly max?: string;
}

/** The state and native event accompanying an edit. */
export type DateTimeFieldValueChangeDetails<OriginalEvent> = ParsedInputDetails<
  OriginalEvent,
  DateTimeValidationError
>;

/** An edit and its complete local date-time, or an empty string. */
export interface DateTimeFieldValueChangeDetail<
  OriginalEvent,
> extends DateTimeFieldValueChangeDetails<OriginalEvent> {
  /** The parsed value, or an empty string while the text is empty, partial or invalid. */
  readonly value: string;
}

/** The props both implementations of DateTimeField share. */
export interface DateTimeFieldProps extends Omit<DateFieldProps, 'getValidationMessageLabel'> {
  /** The local date and time, YYYY-MM-DDTHH:mm, without an offset. @default '' */
  value?: string;
  /** Inclusive lower bound in YYYY-MM-DDTHH:mm; malformed values are ignored. */
  min?: string;
  /** Inclusive upper bound in YYYY-MM-DDTHH:mm; malformed values are ignored. */
  max?: string;
  /** The accessible and visible name of the time control inside the picker. */
  timeLabel?: string;
  /** The name of the combined picker button and dialog. */
  openCalendarLabel?: string;
  /** A complete translated message for a parsing or constraint error. */
  getValidationMessageLabel?: (context: DateTimeValidationContext) => string;
}
