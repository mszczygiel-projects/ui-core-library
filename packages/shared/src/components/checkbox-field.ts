import { defineComponent, type OptionOf } from './component.ts';

/** The specification of CheckboxField. */
export const checkboxField = defineComponent({
  name: 'CheckboxField',
  tag: 'ui-checkbox-field',
  category: 'Selection',
  status: 'done',
  figma: '1145:1141',
  design: {
    flags: ['checked', 'indeterminate', 'disabled'],
    booleans: [],
    codeOnly: [],
    previews: {
      interaction: {
        options: ['rest', 'active', 'focus'],
        default: 'rest',
        note: 'Previews hover and press (active) and keyboard focus. Leave it at rest in a design.',
      },
    },
  },
  summary:
    'A checkbox with a label and hint that a user turns on and off, with a mixed state for a partial selection.',
  options: {
    state: { options: ['default', 'error'], default: 'default' },
  },
  labels: [],
  parts: ['base', 'label', 'control', 'input', 'mark', 'label-text', 'hint', 'hint-text'],
  slots: [],
  events: ['ui-checked-change'],
  stories: ['Playground', 'States', 'Indeterminate', 'OnSurfaces'],
  exceptions: [
    {
      items: ['state'],
      reason:
        'A choice has no success state: a checked box already confirms the choice. The state of the choice controls is default or error.',
    },
    {
      items: ['form', 'validity', 'validationMessage', 'willValidate'],
      reason:
        'The web component exposes its form-associated state. React exposes the native state through the ref of its input, and its form prop is the native form ID attribute.',
    },
    {
      items: ['defaultChecked'],
      reason:
        'React uses defaultChecked for an uncontrolled initial and reset state. The web component uses its checked attribute for that, and its property for the current state, as a native checkbox does.',
    },
    {
      items: ['value'],
      reason:
        'As on a native checkbox, value is the string the form submits while the box is checked, not its state, which is checked.',
    },
  ],
});

/** Visual feedback of a choice control, independent of native validity. */
export type ChoiceState = OptionOf<typeof checkboxField, 'state'>;

/**
 * What accompanies a change of the checked state: the native event that caused it. The package
 * knows no browser types, so each implementation names the type of the event.
 */
export interface CheckedChangeDetails<OriginalEvent> {
  /** The native change event of the input. */
  readonly originalEvent: OriginalEvent;
}

/** The detail of `ui-checked-change`: the new state and the native event that caused it. */
export interface CheckedChangeDetail<OriginalEvent> extends CheckedChangeDetails<OriginalEvent> {
  /** Whether the control is now checked. */
  readonly value: boolean;
}

/**
 * The props every choice control shares: CheckboxField, RadioField and SwitchField, and the
 * RadioGroup that holds radio options.
 */
export interface ChoiceControlProps {
  /** A persistent visible name. Include any required marker in this text. */
  label?: string;
  /** Help or validation feedback, connected to the description of the control. */
  hint?: string;
  /**
   * Prevents interaction and submission.
   * @default false
   */
  disabled?: boolean;
}

/** The props both implementations of CheckboxField share. */
export interface CheckboxFieldProps extends ChoiceControlProps {
  /**
   * Whether the box is checked.
   * @default false
   */
  checked?: boolean;
  /**
   * Shows the mixed state of a partial selection, which a click of the user ends. A reset keeps
   * it, as on a native checkbox.
   * @default false
   */
  indeterminate?: boolean;
  /**
   * Visual feedback; `error` also sets `aria-invalid`, without changing native validity.
   * @default 'default'
   */
  state?: ChoiceState;
  /**
   * Requires the box to be checked for native validation.
   * @default false
   */
  required?: boolean;
  /** The name of the form entry. */
  name?: string;
  /**
   * The string the form submits while the box is checked.
   * @default 'on'
   */
  value?: string;
}
