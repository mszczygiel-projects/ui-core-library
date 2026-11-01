import { checkboxField, type ChoiceControlProps, type ChoiceState } from './checkbox-field.ts';
import { defineComponent, type OptionOf } from './component.ts';

/** The specification of RadioGroup. */
export const radioGroup = defineComponent({
  name: 'RadioGroup',
  tag: 'ui-radio-group',
  category: 'Selection',
  status: 'done',
  figma: '2997:163',
  design: { flags: ['disabled'], booleans: [], codeOnly: [], previews: {} },
  summary: 'A set of radio options from which a user chooses exactly one value.',
  options: {
    orientation: { options: ['vertical', 'horizontal'], default: 'vertical' },
    state: checkboxField.options.state,
  },
  labels: [],
  parts: ['base', 'label', 'label-text', 'options', 'hint', 'hint-text'],
  slots: [],
  events: ['ui-value-change'],
  stories: ['Playground', 'Horizontal', 'InForm', 'OnSurfaces'],
  exceptions: [
    {
      items: ['state'],
      reason:
        'A choice has no success state: a chosen option already confirms the choice. The state of the choice controls is default or error.',
    },
    {
      items: ['form', 'validity', 'validationMessage', 'willValidate'],
      reason:
        'The web component exposes its form-associated state. React renders native radio buttons that share a name, so the browser validates and submits them.',
    },
    {
      items: ['defaultValue'],
      reason:
        'React uses defaultValue for an uncontrolled initial and reset value. The web component uses its value attribute for that, and its property for the current value.',
    },
  ],
});

/** The direction in which the options of a group follow each other. */
export type RadioGroupOrientation = OptionOf<typeof radioGroup, 'orientation'>;

/**
 * What accompanies a new value: the native event that caused it. The package knows no browser
 * types, so each implementation names the type of the event.
 */
export interface RadioGroupValueChangeDetails<OriginalEvent> {
  /** The native change event of the chosen radio button. */
  readonly originalEvent: OriginalEvent;
}

/** The detail of `ui-value-change`: the value of the chosen option and the native event. */
export interface RadioGroupValueChangeDetail<
  OriginalEvent,
> extends RadioGroupValueChangeDetails<OriginalEvent> {
  /** The value of the chosen option. */
  readonly value: string;
}

/** The props both implementations of RadioGroup share. */
export interface RadioGroupProps extends ChoiceControlProps {
  /**
   * The direction in which the options follow each other. The arrow keys move along both axes,
   * as in a native group.
   * @default 'vertical'
   */
  orientation?: RadioGroupOrientation;
  /** The value of the chosen option. A value that no option has chooses none. */
  value?: string;
  /** The name of the form entry. */
  name?: string;
  /**
   * Requires a chosen option for native validation.
   * @default false
   */
  required?: boolean;
  /**
   * Visual feedback; `error` also sets `aria-invalid` on the group, without changing native
   * validity.
   * @default 'default'
   */
  state?: ChoiceState;
}
