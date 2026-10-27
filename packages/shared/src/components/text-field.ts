import { defineComponent, type OptionOf } from './component.ts';

/** The specification of TextField. */
export const textField = defineComponent({
  name: 'TextField',
  tag: 'ui-text-field',
  category: 'Inputs',
  status: 'done',
  figma: '144:293',
  design: {
    flags: ['disabled'],
    booleans: [],
    codeOnly: ['type'],
    previews: {
      interaction: {
        options: ['rest', 'active', 'focus'],
        default: 'rest',
        note: 'Previews hover and press (active) and keyboard focus. Leave it at rest in a design.',
      },
      valueState: {
        options: ['empty', 'filled'],
        default: 'empty',
        note: 'Chooses the layout of an empty or a filled field. Keep it consistent with the text of value.',
      },
    },
  },
  summary: 'A single-line text input with a label, hint and validation feedback.',
  options: {
    variant: { options: ['outline', 'filled', 'underlined'], default: 'outline' },
    size: { options: ['small', 'medium', 'large'], default: 'medium' },
    labelPlacement: { options: ['top', 'floating', 'inner'], default: 'top' },
    state: { options: ['default', 'error', 'success'], default: 'default' },
    type: { options: ['text', 'email', 'tel', 'url'], default: 'text' },
  },
  labels: [],
  parts: [
    'base',
    'control',
    'input-row',
    'input',
    'label',
    'label-text',
    'hint',
    'hint-text',
    'leading-icon',
    'trailing-icon',
  ],
  slots: ['leading-icon', 'trailing-icon'],
  events: ['ui-value-change'],
  stories: ['Playground', 'Variants', 'WithIcons', 'OnSurfaces'],
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

/** The surface and border treatment of a field. */
export type TextFieldVariant = OptionOf<typeof textField, 'variant'>;
/** The sizes of a field, each following the density. */
export type TextFieldSize = OptionOf<typeof textField, 'size'>;
/** The position of the visible label. */
export type TextFieldLabelPlacement = OptionOf<typeof textField, 'labelPlacement'>;
/** Visual feedback, independent of native validity. */
export type TextFieldState = OptionOf<typeof textField, 'state'>;
/** The supported single-line input types. */
export type TextFieldType = OptionOf<typeof textField, 'type'>;

/**
 * What accompanies a new value: the native input event that caused it. The package knows no
 * browser types, so each implementation names the type of the event.
 */
export interface TextFieldValueChangeDetails<OriginalEvent> {
  /** The original input event. */
  readonly originalEvent: OriginalEvent;
}

/** The detail of `ui-value-change`: the new value and the native event that caused it. */
export interface TextFieldValueChangeDetail<
  OriginalEvent,
> extends TextFieldValueChangeDetails<OriginalEvent> {
  /** The current string of the input. */
  readonly value: string;
}

/** The props both implementations of TextField share. */
export interface TextFieldProps {
  /**
   * The surface and border treatment.
   * @default 'outline'
   */
  variant?: TextFieldVariant;
  /**
   * The size, which follows the density.
   * @default 'medium'
   */
  size?: TextFieldSize;
  /**
   * The position of the visible label.
   * @default 'top'
   */
  labelPlacement?: TextFieldLabelPlacement;
  /** A persistent visible name. Include any required marker in this text. */
  label?: string;
  /** An example or short prompt, never a replacement for the label. */
  placeholder?: string;
  /** Help or validation feedback, connected to the description of the input. */
  hint?: string;
  /**
   * Visual feedback; `error` also sets `aria-invalid`, without changing native validity.
   * @default 'default'
   */
  state?: TextFieldState;
  /**
   * Prevents interaction and submission.
   * @default false
   */
  disabled?: boolean;
  /**
   * Prevents editing but keeps submission.
   * @default false
   */
  readOnly?: boolean;
  /**
   * Requires a nonempty value for native validation.
   * @default false
   */
  required?: boolean;
  /** The name of the form entry. */
  name?: string;
  /** The current value. */
  value?: string;
  /**
   * The native input type.
   * @default 'text'
   */
  type?: TextFieldType;
  /** The minimum length a user enters, in UTF-16 code units. */
  minLength?: number;
  /** The maximum length a user enters, in UTF-16 code units. */
  maxLength?: number;
  /** A native regular expression for the whole value. */
  pattern?: string;
  /** The purpose of the browser's autofill. */
  autoComplete?: string;
}
