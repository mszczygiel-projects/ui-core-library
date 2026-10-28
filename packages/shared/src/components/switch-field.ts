import { checkboxField, type ChoiceControlProps, type ChoiceState } from './checkbox-field.ts';
import { defineComponent, type OptionOf } from './component.ts';

/** The specification of SwitchField. */
export const switchField = defineComponent({
  name: 'SwitchField',
  tag: 'ui-switch-field',
  category: 'Selection',
  status: 'in-progress',
  figma: '2251:2499',
  design: {
    flags: ['checked', 'disabled'],
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
  summary: 'A switch with a label and hint that turns a setting on or off at once.',
  options: {
    labelPosition: { options: ['start', 'end'], default: 'end' },
    state: checkboxField.options.state,
  },
  labels: [],
  parts: ['base', 'label', 'control', 'thumb', 'icon', 'input', 'label-text', 'hint', 'hint-text'],
  slots: ['icon-on', 'icon-off'],
  events: ['ui-checked-change'],
  stories: ['Playground', 'LabelPosition', 'WithIcons', 'OnSurfaces'],
  exceptions: [
    {
      items: ['state'],
      reason:
        'A choice has no success state: a switch that is on already confirms the setting. The state of the choice controls is default or error.',
    },
    {
      items: ['required'],
      reason:
        'A switch applies a setting at once and has no answer a form could require; ARIA does not support aria-required on the switch role. A choice the form requires is a CheckboxField.',
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
        'As on a native checkbox, value is the string the form submits while the switch is on, not its state, which is checked.',
    },
  ],
});

/** The side of the switch on which the label and hint sit. */
export type SwitchFieldLabelPosition = OptionOf<typeof switchField, 'labelPosition'>;

/** The props both implementations of SwitchField share. */
export interface SwitchFieldProps extends ChoiceControlProps {
  /**
   * The side of the switch on which the label and hint sit. At `start`, the switch moves to the
   * end of the row, as in a list of settings.
   * @default 'end'
   */
  labelPosition?: SwitchFieldLabelPosition;
  /**
   * Whether the switch is on.
   * @default false
   */
  checked?: boolean;
  /**
   * Visual feedback; `error` also sets `aria-invalid`, without changing native validity.
   * @default 'default'
   */
  state?: ChoiceState;
  /** The name of the form entry. */
  name?: string;
  /**
   * The string the form submits while the switch is on.
   * @default 'on'
   */
  value?: string;
}
