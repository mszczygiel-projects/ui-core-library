import { defineComponent, type OptionOf } from './component.ts';

/** The specification of Button. */
export const button = defineComponent({
  name: 'Button',
  tag: 'ui-button',
  category: 'Actions',
  status: 'done',
  figma: '179:100',
  design: {
    flags: ['disabled', 'loading'],
    booleans: [],
    codeOnly: ['type'],
    previews: {
      interaction: {
        options: ['rest', 'active', 'focus'],
        default: 'rest',
        note: 'Previews hover and press (active) and keyboard focus. Leave it at rest in a design.',
      },
    },
  },
  summary: 'Triggers an action, with optional icons and a loading state.',
  options: {
    variant: {
      options: ['primary', 'secondary', 'outline', 'ghost', 'danger'],
      default: 'primary',
    },
    size: { options: ['small', 'medium', 'large'], default: 'medium' },
    shape: { options: ['square', 'rounded'], default: 'square' },
    type: { options: ['button', 'submit', 'reset'], default: 'button' },
  },
  labels: ['loading'],
  parts: ['base', 'wrapper', 'content', 'leading-icon', 'label', 'trailing-icon', 'loader'],
  slots: ['leading-icon', 'trailing-icon'],
  events: [],
  stories: ['Playground', 'Variants', 'Shapes', 'WithIcons', 'OnSurfaces'],
  exceptions: [
    {
      items: ['form', 'validity', 'validationMessage', 'willValidate'],
      reason:
        'The web component exposes its form-associated state as read-only properties. React exposes the native state through its ref, and its form prop is the native form ID attribute.',
    },
  ],
});

/** The visual emphasis of an action. */
export type ButtonVariant = OptionOf<typeof button, 'variant'>;
/** The sizes of an action, each following the density. */
export type ButtonSize = OptionOf<typeof button, 'size'>;
/** The corners of an action: the radius of the control family or a pill. */
export type ButtonShape = OptionOf<typeof button, 'shape'>;
/** The native action performed after an uncancelled click. */
export type ButtonType = OptionOf<typeof button, 'type'>;

/** The props both implementations of Button share. */
export interface ButtonProps {
  /**
   * The visual emphasis of the action.
   * @default 'primary'
   */
  variant?: ButtonVariant;
  /**
   * The size, which follows the density.
   * @default 'medium'
   */
  size?: ButtonSize;
  /**
   * The corners of the action.
   * @default 'square'
   */
  shape?: ButtonShape;
  /**
   * Disables interaction and removes the control from keyboard navigation.
   * @default false
   */
  disabled?: boolean;
  /**
   * Blocks activation while keeping focus, width and the accessible name.
   * @default false
   */
  loading?: boolean;
  /**
   * The native form action; an ordinary action does not submit.
   * @default 'button'
   */
  type?: ButtonType;
  /** The name of the form entry, submitted only when this button submits. */
  name?: string;
  /** The value submitted with the name; it identifies the action and is not edited. */
  value?: string;
  /** An accessible name replacing the visible content. An author's `aria-label` wins. */
  label?: string;
  /** The description of the loading state, falling back to `labels.button.loading`. */
  loadingLabel?: string;
}
