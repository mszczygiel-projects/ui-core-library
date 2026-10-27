import { defineComponent } from './component.ts';
import { type TextControlProps, textField } from './text-field.ts';

/** The specification of PasswordField. */
export const passwordField = defineComponent({
  name: 'PasswordField',
  tag: 'ui-password-field',
  category: 'Inputs',
  status: 'in-progress',
  figma: '229:3491',
  design: {
    flags: ['revealed'],
    booleans: [],
    codeOnly: [],
    previews: {},
    nested: 'TextField',
  },
  summary: 'A password input with a button that shows or hides the password.',
  options: {
    variant: textField.options.variant,
    size: textField.options.size,
    labelPlacement: textField.options.labelPlacement,
    state: textField.options.state,
  },
  labels: ['reveal'],
  parts: [
    'base',
    'control',
    'input-row',
    'input',
    'label',
    'label-text',
    'hint',
    'hint-text',
    'reveal',
    'reveal-icon',
  ],
  slots: [],
  events: ['ui-value-change', 'ui-revealed-change'],
  stories: ['Playground', 'Variants', 'Revealed', 'OnSurfaces'],
  exceptions: [
    {
      items: ['form', 'validity', 'validationMessage', 'willValidate'],
      reason:
        'The web component exposes its form-associated state. React exposes the native state through the ref of its input, and its form prop is the native form ID attribute.',
    },
    {
      items: ['defaultValue', 'defaultRevealed'],
      reason:
        'React uses defaultValue and defaultRevealed for uncontrolled initial and reset values. The web component uses its value and revealed attributes for them, and its properties for the current state.',
    },
    {
      items: ['inputMode', 'enterKeyHint', 'spellCheck'],
      reason:
        'The web component passes the native inputmode, enterkeyhint and spellcheck attributes of its host to the input, since HTMLElement already owns these properties. React takes them as props of the input.',
    },
  ],
});

/**
 * What accompanies a change of visibility: the click on the reveal button, or the submission of
 * the owning form, which hides the password again.
 */
export interface PasswordFieldRevealedChangeDetails<OriginalEvent> {
  /** The original click or submit event. */
  readonly originalEvent: OriginalEvent;
}

/** The detail of `ui-revealed-change`: whether the password is now shown. */
export interface PasswordFieldRevealedChangeDetail<
  OriginalEvent,
> extends PasswordFieldRevealedChangeDetails<OriginalEvent> {
  /** Whether the password is shown as plain text. */
  readonly value: boolean;
}

/** The props both implementations of PasswordField share. */
export interface PasswordFieldProps extends TextControlProps {
  /** A native regular expression for the whole value. */
  pattern?: string;
  /**
   * Shows the password as plain text. A reset and a submission of the owning form hide it again.
   * @default false
   */
  revealed?: boolean;
  /** The name of the button that shows the password, falling back to `labels.passwordField.reveal`. */
  revealLabel?: string;
}
