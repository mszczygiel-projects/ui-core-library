import { button } from './button.ts';
import { defineComponent, type OptionOf } from './component.ts';

/** The specification of IconButton. */
export const iconButton = defineComponent({
  name: 'IconButton',
  tag: 'ui-icon-button',
  category: 'Actions',
  status: 'done',
  figma: '182:1049',
  design: {
    flags: ['disabled', 'loading'],
    booleans: [],
    codeOnly: ['type'],
    previews: button.design.previews,
  },
  summary: 'Triggers an action named only by an icon, as a square of the height of a button.',
  options: button.options,
  labels: ['loading'],
  parts: ['base', 'icon', 'loader'],
  slots: ['icon'],
  events: [],
  stories: ['Playground', 'Variants', 'OnSurfaces'],
  exceptions: [
    {
      items: ['form', 'validity', 'validationMessage', 'willValidate'],
      reason:
        'The web component exposes its form-associated state as read-only properties. React exposes the native state through its ref, and its form prop is the native form ID attribute.',
    },
  ],
});

/** The visual emphasis of an icon action, shared with Button. */
export type IconButtonVariant = OptionOf<typeof iconButton, 'variant'>;
/** The sizes of an icon action, each as tall as a button of that size. */
export type IconButtonSize = OptionOf<typeof iconButton, 'size'>;
/** The native action performed after an uncancelled click. */
export type IconButtonType = OptionOf<typeof iconButton, 'type'>;

/** The props both implementations of IconButton share. */
export interface IconButtonProps {
  /** The accessible name of the action, which nothing visible gives. An author's `aria-label` wins. */
  label: string;
  /**
   * The visual emphasis of the action.
   * @default 'primary'
   */
  variant?: IconButtonVariant;
  /**
   * The size, which follows the density and matches the height of a button.
   * @default 'medium'
   */
  size?: IconButtonSize;
  /**
   * Disables interaction and removes the control from keyboard navigation.
   * @default false
   */
  disabled?: boolean;
  /**
   * Blocks activation while keeping focus and the accessible name.
   * @default false
   */
  loading?: boolean;
  /**
   * The native form action; an ordinary action does not submit.
   * @default 'button'
   */
  type?: IconButtonType;
  /** The name of the form entry, submitted only when this button submits. */
  name?: string;
  /** The value submitted with the name; it identifies the action and is not edited. */
  value?: string;
  /** The description of the loading state, falling back to `labels.iconButton.loading`. */
  loadingLabel?: string;
}
