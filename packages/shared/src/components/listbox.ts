import { checkboxField, type ChoiceState } from './checkbox-field.ts';
import { defineComponent, type OptionOf } from './component.ts';

/** The specification of Listbox. */
export const listbox = defineComponent({
  name: 'Listbox',
  tag: 'ui-listbox',
  category: 'Selection',
  status: 'done',
  figma: '3031:560',
  design: {
    flags: ['multiple', 'disabled'],
    booleans: [],
    codeOnly: ['options', 'name', 'required'],
    previews: {
      interaction: {
        options: ['rest', 'active', 'focus'],
        default: 'rest',
        note: 'Previews hover and press (active) and keyboard focus. Leave it at rest in a design.',
      },
      content: {
        options: ['options', 'groups', 'empty'],
        default: 'options',
        note: 'Chooses a flat list, a list in groups or the message of an empty list. Keep it consistent with the options of the design.',
      },
    },
  },
  summary: 'A visible list of options from which a user chooses one value or several.',
  options: {
    size: { options: ['small', 'medium', 'large'], default: 'medium' },
    state: checkboxField.options.state,
  },
  labels: ['empty'],
  parts: [
    'base',
    'label',
    'label-text',
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
  slots: [],
  events: ['ui-value-change'],
  stories: ['Playground', 'Multiple', 'Groups', 'OnSurfaces'],
  exceptions: [
    {
      items: ['state'],
      reason:
        'A choice has no success state: a chosen option already confirms the choice. The state of the choice controls is default or error.',
    },
    {
      items: ['form', 'validity', 'validationMessage', 'willValidate'],
      reason:
        'The web component exposes its form-associated state. React renders a hidden native select with the same options, so the browser validates and submits them.',
    },
    {
      items: ['defaultValue'],
      reason:
        'React uses defaultValue for an uncontrolled initial and reset value. The web component uses its value attribute for one value and its defaultValue property for several, since an attribute cannot hold a list.',
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

/** The sizes of the rows of a list, each following the density. */
export type ListboxSize = OptionOf<typeof listbox, 'size'>;

/** One option of a list. `Icon` is the type each implementation uses for a decorative icon. */
export interface ListboxOption<Icon = never> {
  /** The value a choice of the option gives, never empty. */
  readonly value: string;
  /** The text of the option, which also names it. */
  readonly label: string;
  /** Shows the option without letting a user choose it. */
  readonly disabled?: boolean;
  /** A decorative icon before the label. */
  readonly icon?: Icon;
}

/** Options under a heading. A group without a label is separated from the one before by a rule. */
export interface ListboxGroup<Icon = never> {
  readonly label?: string;
  readonly options: readonly ListboxOption<Icon>[];
}

/** The options of a list: all of them alone or all of them in groups, never both. */
export type ListboxItems<Icon = never> =
  readonly ListboxOption<Icon>[] | readonly ListboxGroup<Icon>[];

/** The chosen value: one string, or a list of strings when the list allows several. */
export type ListboxValue = string | readonly string[];

/**
 * What accompanies a new value: the native event that caused it, a key or a pointer event. The
 * package knows no browser types, so each implementation names the type of the event.
 */
export interface ListboxValueChangeDetails<OriginalEvent> {
  readonly originalEvent: OriginalEvent;
}

/** The detail of `ui-value-change`: the new value and the native event that caused it. */
export interface ListboxValueChangeDetail<
  OriginalEvent,
  Value extends ListboxValue = ListboxValue,
> extends ListboxValueChangeDetails<OriginalEvent> {
  readonly value: Value;
}

/**
 * The props both implementations of Listbox share. `Icon` is the type of the icons of the options,
 * which each implementation names.
 */
export interface ListboxProps<Icon = unknown> {
  /** A persistent visible name. Include any required marker in this text. */
  label?: string;
  /** Help or validation feedback, connected to the description of the list. */
  hint?: string;
  /**
   * The size of the rows, which follows the density.
   * @default 'medium'
   */
  size?: ListboxSize;
  /**
   * Visual feedback; `error` also sets `aria-invalid`, without changing native validity.
   * @default 'default'
   */
  state?: ChoiceState;
  /**
   * Lets a user choose several options. The value is then a list of strings.
   * @default false
   */
  multiple?: boolean;
  /**
   * Prevents interaction and submission.
   * @default false
   */
  disabled?: boolean;
  /**
   * Requires a chosen option for native validation.
   * @default false
   */
  required?: boolean;
  /** The name of the form entry, one entry for each chosen value. */
  name?: string;
  /** The options, alone or in groups. */
  options?: ListboxItems<Icon>;
  /** The chosen value; a value that no option has chooses none. */
  value?: ListboxValue;
  /** The text shown when there are no options, falling back to `labels.listbox.empty`. */
  emptyLabel?: string;
}
