import { defineComponent, type OptionOf } from './component.ts';
import type { ListboxItems, ListboxValue } from './listbox.ts';
import { type FieldControlProps, textField } from './text-field.ts';

const { options } = textField;

/** The specification of Combobox. */
export const combobox = defineComponent({
  name: 'Combobox',
  tag: 'ui-combobox',
  category: 'Selection',
  status: 'in-progress',
  figma: '2273:665',
  design: {
    flags: ['open', 'multiple'],
    booleans: ['clearable'],
    codeOnly: ['options', 'name', 'required', 'filterMode', 'loading', 'allowCreate'],
    previews: {},
    nested: 'TextField',
  },
  summary:
    'A text field that filters a list of options from which a user chooses one value or several.',
  options: {
    variant: options.variant,
    size: options.size,
    labelPlacement: options.labelPlacement,
    state: options.state,
    filterMode: { options: ['local', 'remote'], default: 'local' },
  },
  labels: ['clear', 'create'],
  parts: [
    'base',
    'label',
    'label-text',
    'control',
    'input-row',
    'chips',
    'chip',
    'input',
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
    'create',
    'message',
    'hint',
    'hint-text',
  ],
  slots: ['leading-icon'],
  events: ['ui-value-change', 'ui-open-change', 'ui-query-change', 'ui-create'],
  stories: ['Playground', 'Multiple', 'RemoteFiltering', 'Create', 'OnSurfaces'],
  exceptions: [
    {
      items: ['form', 'validity', 'validationMessage', 'willValidate'],
      reason:
        'The web component exposes its form-associated state. React renders a hidden native select with the chosen options, so the browser validates and submits them.',
    },
    {
      items: ['defaultValue', 'defaultOpen'],
      reason:
        'React uses defaultValue and defaultOpen for an uncontrolled initial state. The web component uses its value attribute for one value, its defaultValue property for several and its open attribute, and its properties for the current state.',
    },
    {
      items: ['value'],
      reason:
        'The empty string means that no option is chosen, so no option may have it as its value. The query a user types is never a value.',
    },
    {
      items: ['icon'],
      reason:
        'The icon of an option is an SVG string of the icon package in the web component and a React node in React, since data cannot carry a slot.',
    },
  ],
});

/** Where the options are filtered: in the component, or by the author from the query. */
export type ComboboxFilterMode = OptionOf<typeof combobox, 'filterMode'>;

/** What accompanies a new query or a request to create an option: the native event that caused it. */
export interface ComboboxQueryDetails<OriginalEvent> {
  readonly originalEvent: OriginalEvent;
}

/** The detail of `ui-query-change` and `ui-create`: the query as typed, and the native event. */
export interface ComboboxQueryDetail<OriginalEvent> extends ComboboxQueryDetails<OriginalEvent> {
  readonly value: string;
}

/**
 * The props both implementations of Combobox share. `Icon` is the type of the icons of the
 * options, which each implementation names.
 */
export interface ComboboxProps<Icon = unknown> extends FieldControlProps {
  /** The options, alone or in groups. */
  options?: ListboxItems<Icon>;
  /** The chosen value: one string, or a list of strings when `multiple` is set. */
  value?: ListboxValue;
  /**
   * Lets a user choose several options, shown as chips before the query.
   * @default false
   */
  multiple?: boolean;
  /**
   * Whether the list of options is open.
   * @default false
   */
  open?: boolean;
  /**
   * Shows a button that clears the chosen options and the query.
   * @default false
   */
  clearable?: boolean;
  /**
   * `local` filters the options by the query; `remote` shows them as given, for an author who
   * filters them from the query events.
   * @default 'local'
   */
  filterMode?: ComboboxFilterMode;
  /**
   * Shows that the options are loading instead of the options.
   * @default false
   */
  loading?: boolean;
  /**
   * Offers to create an option from a query that no label equals.
   * @default false
   */
  allowCreate?: boolean;
  /** The name of the clear button, falling back to `labels.combobox.clear`. */
  clearLabel?: string;
  /** The text shown when no option matches, falling back to `labels.listbox.empty`. */
  emptyLabel?: string;
  /** The text shown while the options load, falling back to `labels.listbox.loading`. */
  loadingLabel?: string;
  /** The text of the option that creates one from the query, falling back to `labels.combobox.create`. */
  getCreateLabel?: (query: string) => string;
}
