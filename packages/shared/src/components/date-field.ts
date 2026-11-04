import type { DateConstraints, DateValidationContext, DateValidationError } from '../utils/date.ts';
import type { ParsedFieldProps, ParsedInputDetails } from '../utils/parsed-input.ts';
import { defineComponent } from './component.ts';
import { textField } from './text-field.ts';

/** The specification of DateField. */
export const dateField = defineComponent({
  name: 'DateField',
  tag: 'ui-date-field',
  category: 'Inputs',
  status: 'in-progress',
  figma: '3190:372',
  design: {
    nested: 'TextField',
    flags: ['open'],
    booleans: [],
    previews: {},
    codeOnly: [
      'locale',
      'min',
      'max',
      'disabledDates',
      'firstDayOfWeek',
      'today',
      'openCalendarLabel',
      'readOnly',
      'required',
      'name',
      'autoComplete',
      'getFormatHintLabel',
      'getValidationMessageLabel',
    ],
  },
  summary:
    'A masked date input with a locale-aware display and an ISO calendar-date value, and a calendar to pick the date from.',
  options: {
    variant: textField.options.variant,
    size: textField.options.size,
    labelPlacement: textField.options.labelPlacement,
    state: textField.options.state,
  },
  labels: ['formatHint', 'validationMessage', 'openCalendar'],
  parts: [
    'base',
    'control',
    'input-row',
    'input',
    'calendar-button',
    'panel',
    'calendar',
    'label',
    'label-text',
    'hint',
    'hint-text',
  ],
  slots: [],
  events: ['ui-value-change', 'ui-open-change'],
  stories: ['Playground', 'Variants', 'WithLocale', 'WithConstraints', 'OnSurfaces'],
  exceptions: [
    ...textField.exceptions,
    {
      items: ['value', 'name', 'min', 'max'],
      reason:
        'The visible input and its ref hold editable text. Form data and value use the canonical ISO date. React submits through a hidden input. Parsing and constraint errors use customError on the text input.',
    },
    {
      items: ['disabledDates'],
      reason:
        'The web component takes an array or predicate as a property only, without an attribute.',
    },
    {
      items: ['defaultOpen'],
      reason:
        'React uses defaultOpen for an uncontrolled initial state. The web component uses its open attribute for that, and its property for the current state.',
    },
  ],
});

/** The text, parse state and constraint result accompanying a user edit. */
export type DateFieldValueChangeDetails<OriginalEvent> = ParsedInputDetails<
  OriginalEvent,
  DateValidationError
>;

/** The detail of ui-value-change. */
export interface DateFieldValueChangeDetail<
  OriginalEvent,
> extends DateFieldValueChangeDetails<OriginalEvent> {
  /** The parsed value, or an empty string for empty, incomplete or invalid text. */
  readonly value: string;
}

/** What accompanies an opened or closed calendar: the native event that caused it. */
export interface DateFieldOpenChangeDetails<OriginalEvent> {
  readonly originalEvent: OriginalEvent;
}

/** The detail of `ui-open-change`: whether the calendar is now open, and the native event. */
export interface DateFieldOpenChangeDetail<
  OriginalEvent,
> extends DateFieldOpenChangeDetails<OriginalEvent> {
  readonly value: boolean;
}

/** The props both implementations of DateField share. */
export interface DateFieldProps extends ParsedFieldProps, DateConstraints {
  /** The canonical ISO calendar date (YYYY-MM-DD); an empty string means empty. @default '' */
  value?: string;
  /**
   * Whether the calendar is open. A disabled or read-only field keeps it closed.
   * @default false
   */
  open?: boolean;
  /**
   * Hides the button that opens the calendar, leaving typing as the only way to enter a date.
   * @default false
   */
  hideCalendarButton?: boolean;
  /**
   * The first day of the week in the calendar, from 1 for Monday to 7 for Sunday. Without it the
   * locale decides, or Monday when the browser has no week data.
   */
  firstDayOfWeek?: number;
  /**
   * Today's date, `YYYY-MM-DD`, which the calendar marks. Without it the calendar reads the clock
   * and time zone of the browser.
   */
  today?: string;
  /** The name of the calendar button and its dialog, falling back to `labels.dateField.openCalendar`. */
  openCalendarLabel?: string;
  /** A whole sentence describing the format, used when hint is absent. */
  getFormatHintLabel?: (example: string) => string;
  /** A complete translated message for a parsing or constraint error. */
  getValidationMessageLabel?: (context: DateValidationContext) => string;
}
