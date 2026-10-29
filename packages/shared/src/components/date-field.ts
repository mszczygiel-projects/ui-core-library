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
  figma: '3018:39',
  design: {
    nested: 'TextField',
    flags: [],
    booleans: [],
    previews: {},
    codeOnly: [
      'locale',
      'min',
      'max',
      'disabledDates',
      'readOnly',
      'required',
      'name',
      'autoComplete',
      'getFormatHintLabel',
      'getValidationMessageLabel',
    ],
  },
  summary: 'A masked date input with a locale-aware display and an ISO calendar-date value.',
  options: {
    variant: textField.options.variant,
    size: textField.options.size,
    labelPlacement: textField.options.labelPlacement,
    state: textField.options.state,
  },
  labels: ['formatHint', 'validationMessage'],
  parts: ['base', 'control', 'input-row', 'input', 'label', 'label-text', 'hint', 'hint-text'],
  slots: [],
  events: ['ui-value-change'],
  stories: ['Playground', 'Variants', 'WithLocale', 'WithConstraints', 'InForm', 'OnSurfaces'],
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

/** The props both implementations of DateField share. */
export interface DateFieldProps extends ParsedFieldProps, DateConstraints {
  /** The canonical ISO calendar date (YYYY-MM-DD); an empty string means empty. @default '' */
  value?: string;
  /** A whole sentence describing the format, used when hint is absent. */
  getFormatHintLabel?: (example: string) => string;
  /** A complete translated message for a parsing or constraint error. */
  getValidationMessageLabel?: (context: DateValidationContext) => string;
}
