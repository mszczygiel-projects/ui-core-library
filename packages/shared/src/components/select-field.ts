import { defineComponent } from './component.ts';
import type { ListboxItems } from './listbox.ts';
import { type FieldControlProps, textField } from './text-field.ts';

const { options } = textField;

/** The specification of SelectField. */
export const selectField = defineComponent({
  name: 'SelectField',
  tag: 'ui-select-field',
  category: 'Selection',
  status: 'done',
  figma: '1370:179',
  design: {
    flags: ['open'],
    booleans: ['clearable'],
    codeOnly: ['options', 'name', 'required'],
    previews: {},
    nested: 'TextField',
  },
  summary: 'A field that opens a list of options from which a user chooses one value.',
  options: {
    variant: options.variant,
    size: options.size,
    labelPlacement: options.labelPlacement,
    state: options.state,
  },
  labels: ['clear'],
  parts: [
    'base',
    'label',
    'label-text',
    'control',
    'trigger',
    'value',
    'leading-icon',
    'indicator',
    'clear',
    'popup',
    'listbox',
    'group',
    'group-label',
    'option',
    'option-icon',
    'option-label',
    'option-mark',
    'message',
    'hint',
    'hint-text',
  ],
  slots: ['leading-icon'],
  events: ['ui-value-change', 'ui-open-change'],
  stories: ['Playground', 'Variants', 'Groups', 'OnSurfaces'],
  exceptions: [
    {
      items: ['form', 'validity', 'validationMessage', 'willValidate'],
      reason:
        'The web component exposes its form-associated state. React renders a hidden native select with the same options, so the browser validates and submits it.',
    },
    {
      items: ['defaultValue', 'defaultOpen'],
      reason:
        'React uses defaultValue and defaultOpen for an uncontrolled initial state. The web component uses its value and open attributes for that, and its properties for the current state.',
    },
    {
      items: ['value'],
      reason:
        'The empty string means that no option is chosen, so no option may have it as its value.',
    },
    {
      items: ['icon'],
      reason:
        'The icon of an option is an SVG string of the icon package in the web component and a React node in React, since data cannot carry a slot.',
    },
  ],
});

/** What accompanies an opened or closed list: the native event that caused it. */
export interface SelectFieldOpenChangeDetails<OriginalEvent> {
  readonly originalEvent: OriginalEvent;
}

/** The detail of `ui-open-change`: whether the list is now open, and the native event. */
export interface SelectFieldOpenChangeDetail<
  OriginalEvent,
> extends SelectFieldOpenChangeDetails<OriginalEvent> {
  readonly value: boolean;
}

/**
 * The props both implementations of SelectField share. `Icon` is the type of the icons of the
 * options, which each implementation names.
 */
export interface SelectFieldProps<Icon = unknown> extends FieldControlProps {
  /** The options, alone or in groups. */
  options?: ListboxItems<Icon>;
  /** The value of the chosen option; a value that no option has chooses none. */
  value?: string;
  /**
   * Whether the list of options is open.
   * @default false
   */
  open?: boolean;
  /**
   * Shows a button that clears the chosen option.
   * @default false
   */
  clearable?: boolean;
  /** The name of the button that clears the chosen option, falling back to `labels.selectField.clear`. */
  clearLabel?: string;
  /** The text shown when there are no options, falling back to `labels.listbox.empty`. */
  emptyLabel?: string;
}
