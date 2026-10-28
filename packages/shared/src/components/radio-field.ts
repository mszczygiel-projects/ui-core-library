import { checkboxField, type ChoiceControlProps } from './checkbox-field.ts';
import { defineComponent } from './component.ts';

/** The specification of RadioField. */
export const radioField = defineComponent({
  name: 'RadioField',
  tag: 'ui-radio-field',
  category: 'Selection',
  status: 'in-progress',
  figma: '1217:1382',
  design: {
    flags: ['disabled'],
    booleans: [],
    codeOnly: [],
    previews: {
      interaction: {
        options: ['rest', 'active', 'focus'],
        default: 'rest',
        note: 'Previews hover and press (active) and keyboard focus. Leave it at rest in a design.',
      },
      checked: {
        options: ['false', 'true'],
        default: 'false',
        note: 'Previews the chosen option. In code, the value of the RadioGroup chooses it.',
      },
      state: {
        options: checkboxField.options.state.options,
        default: checkboxField.options.state.default,
        note: 'Previews the error state. In code, the state of the RadioGroup sets it on every option.',
      },
    },
  },
  summary: 'One option of a RadioGroup, with a label and hint.',
  options: {},
  labels: [],
  parts: ['base', 'label', 'control', 'input', 'label-text', 'hint', 'hint-text'],
  slots: [],
  events: [],
  stories: ['Playground', 'WithHint', 'Disabled'],
  exceptions: [
    {
      items: ['checked', 'name', 'required', 'state'],
      reason:
        'An option belongs to a RadioGroup, which holds the chosen value, the form entry, the validation and the state. Outside a group, an option has no state and submits nothing.',
    },
  ],
});

/** The props both implementations of RadioField share. */
export interface RadioFieldProps extends ChoiceControlProps {
  /** The value that the group takes when a user chooses this option. */
  value: string;
}
