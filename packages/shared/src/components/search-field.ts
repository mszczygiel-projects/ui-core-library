import { defineComponent } from './component.ts';
import { type TextControlProps, textField } from './text-field.ts';

/** The specification of SearchField. */
export const searchField = defineComponent({
  name: 'SearchField',
  tag: 'ui-search-field',
  category: 'Inputs',
  status: 'done',
  figma: '2972:1698',
  design: {
    flags: [],
    booleans: [],
    codeOnly: [],
    previews: {},
    nested: 'TextField',
  },
  summary: 'A search input with a button that clears the query.',
  options: {
    variant: textField.options.variant,
    size: textField.options.size,
    labelPlacement: textField.options.labelPlacement,
    state: textField.options.state,
  },
  labels: ['clear'],
  parts: [
    'base',
    'control',
    'input-row',
    'input',
    'label',
    'label-row',
    'label-text',
    'label-hint',
    'hint',
    'hint-text',
    'leading-icon',
    'clear',
    'clear-icon',
  ],
  slots: [],
  events: ['ui-value-change', 'ui-clear'],
  stories: ['Playground', 'Variants', 'InForm', 'OnSurfaces'],
  exceptions: [
    {
      items: ['form', 'validity', 'validationMessage', 'willValidate'],
      reason:
        'The web component exposes its form-associated state. React exposes the native state through the ref of its input, and its form prop is the native form ID attribute.',
    },
    {
      items: ['defaultValue'],
      reason:
        'React uses defaultValue for an uncontrolled initial and reset value. The web component uses its value attribute for that, and its property for the current value.',
    },
    {
      items: ['inputMode', 'enterKeyHint', 'spellCheck'],
      reason:
        'The web component passes the native inputmode, enterkeyhint and spellcheck attributes of its host to the input, since HTMLElement already owns these properties. React takes them as props of the input.',
    },
  ],
});

/** What accompanies clearing the query: the click or the Escape key that caused it. */
export interface SearchFieldClearDetails<OriginalEvent> {
  /** The original click or keyboard event. */
  readonly originalEvent: OriginalEvent;
}

/** The props both implementations of SearchField share. */
export interface SearchFieldProps extends TextControlProps {
  /** A native regular expression for the whole value. */
  pattern?: string;
  /** The name of the button that clears the query, falling back to `labels.searchField.clear`. */
  clearLabel?: string;
}
