import type {
  NumberConstraints,
  NumberValidationContext,
  NumberValidationError,
} from '../utils/numeric.ts';
import type { ParsedFieldProps, ParsedInputDetails } from '../utils/parsed-input.ts';
import { defineComponent, type OptionOf } from './component.ts';
import { textField } from './text-field.ts';

/** The specification of NumberField. */
export const numberField = defineComponent({
  name: 'NumberField',
  tag: 'ui-number-field',
  category: 'Inputs',
  status: 'in-progress',
  figma: '2193:2228',
  design: {
    nested: 'TextField',
    flags: [],
    booleans: [],
    previews: {},
    codeOnly: [
      'locale',
      'min',
      'max',
      'step',
      'precision',
      'readOnly',
      'required',
      'name',
      'autoComplete',
      'decrementLabel',
      'incrementLabel',
      'getValidationMessageLabel',
    ],
  },
  summary:
    'A locale-aware number input with validation and optional decrement and increment buttons.',
  options: {
    variant: textField.options.variant,
    size: textField.options.size,
    labelPlacement: textField.options.labelPlacement,
    state: textField.options.state,
    controls: { options: ['none', 'inline'], default: 'none' },
  },
  labels: ['decrement', 'increment', 'validationMessage'],
  parts: [
    'base',
    'control',
    'input-row',
    'input',
    'label',
    'label-text',
    'hint',
    'hint-text',
    'decrement',
    'decrement-icon',
    'increment',
    'increment-icon',
  ],
  slots: [],
  events: ['ui-value-change'],
  stories: ['Playground', 'Variants', 'WithControls', 'WithDecimals', 'WithLocale', 'OnSurfaces'],
  exceptions: [
    ...textField.exceptions,
    {
      items: ['value', 'name', 'min', 'max', 'step', 'precision'],
      reason:
        'The visible input and its ref hold editable text. Form data and value use the canonical number. React submits through a hidden input. Parsing and constraint errors use customError on the text input.',
    },
  ],
});

/** Whether decrement and increment buttons accompany the input. */
export type NumberFieldControls = OptionOf<typeof numberField, 'controls'>;

/** The text, parse state and constraint result accompanying a user edit. */
export type NumberFieldValueChangeDetails<OriginalEvent> = ParsedInputDetails<
  OriginalEvent,
  NumberValidationError
>;

/** The detail of ui-value-change. */
export interface NumberFieldValueChangeDetail<
  OriginalEvent,
> extends NumberFieldValueChangeDetails<OriginalEvent> {
  /** The parsed value, or null for empty, incomplete or invalid text. */
  readonly value: number | null;
}

/** The props both implementations of NumberField share. */
export interface NumberFieldProps extends ParsedFieldProps, NumberConstraints {
  /** The canonical number; null means empty. @default null */
  value?: number | null;
  /** Whether the field shows decrement and increment buttons. @default 'none' */
  controls?: NumberFieldControls;
  /** The name of the decrement button, falling back to labels.numberField.decrement. */
  decrementLabel?: string;
  /** The name of the increment button, falling back to labels.numberField.increment. */
  incrementLabel?: string;
  /** A complete translated message for a parsing or constraint error. */
  getValidationMessageLabel?: (context: NumberValidationContext) => string;
}
