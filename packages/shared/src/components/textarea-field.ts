import { defineComponent, type OptionOf } from './component.ts';
import { type TextControlProps, textField } from './text-field.ts';

/** The specification of TextareaField. */
export const textareaField = defineComponent({
  name: 'TextareaField',
  tag: 'ui-textarea-field',
  category: 'Inputs',
  status: 'done',
  figma: '2175:457',
  design: {
    flags: ['disabled'],
    booleans: [],
    codeOnly: ['resize', 'maxRows'],
    previews: textField.design.previews,
  },
  summary: 'A multi-line text input with a label, hint and validation feedback.',
  options: {
    variant: textField.options.variant,
    size: textField.options.size,
    labelPlacement: textField.options.labelPlacement,
    state: textField.options.state,
    resize: { options: ['vertical', 'none', 'auto'], default: 'vertical' },
  },
  labels: [],
  parts: [
    'base',
    'control',
    'input',
    'label-row',
    'label',
    'label-text',
    'label-hint',
    'hint',
    'hint-text',
  ],
  slots: [],
  events: ['ui-value-change'],
  stories: ['Playground', 'Variants', 'Resize', 'OnSurfaces'],
  exceptions: [
    {
      items: ['form', 'validity', 'validationMessage', 'willValidate'],
      reason:
        'The web component exposes its form-associated state. React exposes the native state through the ref of its textarea, and its form prop is the native form ID attribute.',
    },
    {
      items: ['defaultValue'],
      reason:
        'React uses defaultValue for an uncontrolled initial and reset value. The web component uses its value attribute for that, and its property for the current value.',
    },
    {
      items: ['inputMode', 'enterKeyHint', 'spellCheck'],
      reason:
        'The web component passes the native inputmode, enterkeyhint and spellcheck attributes of its host to the textarea, since HTMLElement already owns these properties. React takes them as props of the textarea.',
    },
  ],
});

/** How the height of a textarea follows the user and its content. */
export type TextareaFieldResize = OptionOf<typeof textareaField, 'resize'>;

/** The props both implementations of TextareaField share. */
export interface TextareaFieldProps extends TextControlProps {
  /**
   * `vertical` lets the user drag the height, `none` keeps the designed height, and `auto` grows
   * with the content.
   * @default 'vertical'
   */
  resize?: TextareaFieldResize;
  /** With `resize="auto"`, the number of lines after which the textarea scrolls instead of growing. */
  maxRows?: number;
}
